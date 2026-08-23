package io.github.ultramax333.maxandgym;

import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AndroidUpdate")
public class AndroidUpdatePlugin extends Plugin {
    private static final String APPROVED_HOST = "github.com";
    private static final String APPROVED_PATH_PREFIX = "/ultramax333/max-and-gym/releases/download/";
    private static final String APK_MIME_TYPE = "application/vnd.android.package-archive";
    private static final String PREFERENCES_NAME = "android-update";
    private static final String PENDING_DOWNLOAD_ID = "pendingDownloadId";
    private static final String STAGED_APK_PATH = "stagedApkPath";
    private static final String UPDATE_PHASE = "updatePhase";
    private static final String FAILURE_REASON = "failureReason";
    private static final String DOWNLOADED_BYTES = "downloadedBytes";
    private static final String TOTAL_BYTES = "totalBytes";
    private static final String EXPECTED_SHA256 = "expectedSha256";
    private static final String EXPECTED_SIZE = "expectedSize";
    private static final String EXPECTED_VERSION_NAME = "expectedVersionName";
    private static final String EXPECTED_VERSION_CODE = "expectedVersionCode";

    private DownloadManager downloadManager;
    private BroadcastReceiver downloadReceiver;
    private Handler handler;
    private ExecutorService fileExecutor;
    private Runnable downloadPoller;
    private long processingDownloadId = -1L;

    @Override
    public void load() {
        downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        handler = new Handler(Looper.getMainLooper());
        fileExecutor = Executors.newSingleThreadExecutor();
        clearStagedUpdateIfAlreadyInstalled();
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
                finishDownload(intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L));
            }
        };
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(downloadReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            getContext().registerReceiver(downloadReceiver, filter);
        }
        scheduleDownloadPolling();
    }

    @Override
    protected void handleOnDestroy() {
        if (handler != null && downloadPoller != null) handler.removeCallbacks(downloadPoller);
        if (downloadReceiver != null) {
            getContext().unregisterReceiver(downloadReceiver);
            downloadReceiver = null;
        }
        if (fileExecutor != null) fileExecutor.shutdownNow();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String value = call.getString("url");
        String expectedSha256 = call.getString("expectedSha256");
        String expectedVersionName = call.getString("expectedVersionName");
        Long expectedSize = call.getLong("expectedSize");
        Integer expectedVersionCode = call.getInt("expectedVersionCode");
        Uri uri = value == null ? null : Uri.parse(value);
        if (!isApprovedDownload(uri)) {
            call.reject("The release download URL is not approved.");
            return;
        }
        if (expectedSha256 == null || !expectedSha256.matches("(?i)[a-f0-9]{64}") ||
            expectedVersionName == null || !expectedVersionName.matches("\\d+\\.\\d+\\.\\d+") ||
            expectedSize == null || expectedSize <= 0L || expectedVersionCode == null || expectedVersionCode <= 0) {
            call.reject("The release verification metadata is invalid.");
            return;
        }

        persistExpectedRelease(expectedSha256, expectedSize, expectedVersionName, expectedVersionCode);
        if (!canInstallPackages()) {
            persistStatus("permission-required", 0L, expectedSize, "install-permission-required");
            openInstallPermissionSettings();
            call.resolve(statusObject());
            return;
        }
        if (downloadManager == null) {
            persistStatus("failed", 0L, expectedSize, "download-manager-unavailable");
            call.resolve(statusObject());
            return;
        }

        long previousDownloadId = pendingDownloadId();
        if (previousDownloadId > 0L) downloadManager.remove(previousDownloadId);
        clearPendingDownload();
        clearStagedApk();

        String destinationName = "max-and-gym-update-" + System.currentTimeMillis() + ".apk";
        DownloadManager.Request request = new DownloadManager.Request(uri)
            .setTitle("Max & Gym update")
            .setDescription("Downloading the signed Android update")
            .setMimeType(APK_MIME_TYPE)
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(false)
            .setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, destinationName);
        try {
            long downloadId = downloadManager.enqueue(request);
            preferences().edit().putLong(PENDING_DOWNLOAD_ID, downloadId).apply();
            persistStatus("pending", 0L, expectedSize, null);
            scheduleDownloadPolling();
        } catch (RuntimeException exception) {
            persistStatus("failed", 0L, expectedSize, "download-enqueue-failed");
        }
        call.resolve(statusObject());
    }

    @PluginMethod
    public void getUpdateStatus(PluginCall call) {
        long pendingId = pendingDownloadId();
        if (pendingId > 0L) finishDownload(pendingId);
        call.resolve(statusObject());
    }

    @PluginMethod
    public void installPending(PluginCall call) {
        File apkFile = stagedApkFile();
        if (!apkFile.isFile()) {
            persistStatus("idle", 0L, 0L, null);
            call.resolve(statusObject());
            return;
        }
        if (!canInstallPackages()) {
            persistStatus("permission-required", apkFile.length(), apkFile.length(), "install-permission-required");
            openInstallPermissionSettings();
            call.resolve(statusObject());
            return;
        }
        Uri apkUri = FileProvider.getUriForFile(
            getContext(), getContext().getPackageName() + ".fileprovider", apkFile
        );
        if (!launchInstaller(apkUri)) {
            persistStatus("failed", apkFile.length(), apkFile.length(), "installer-unavailable");
        } else {
            persistStatus("ready", apkFile.length(), apkFile.length(), null);
        }
        call.resolve(statusObject());
    }

    private boolean isApprovedDownload(Uri uri) {
        if (uri == null) return false;
        String host = uri.getHost();
        String path = uri.getPath();
        return "https".equalsIgnoreCase(uri.getScheme())
            && host != null
            && APPROVED_HOST.equalsIgnoreCase(host)
            && path != null
            && path.startsWith(APPROVED_PATH_PREFIX)
            && path.endsWith("-release.apk")
            && uri.getQuery() == null
            && uri.getFragment() == null;
    }

    private void scheduleDownloadPolling() {
        if (handler == null) return;
        if (downloadPoller != null) handler.removeCallbacks(downloadPoller);
        downloadPoller = new Runnable() {
            @Override
            public void run() {
                long pendingId = pendingDownloadId();
                if (pendingId > 0L) {
                    finishDownload(pendingId);
                    handler.postDelayed(this, 750L);
                } else {
                    downloadPoller = null;
                }
            }
        };
        handler.post(downloadPoller);
    }

    private long pendingDownloadId() {
        return preferences().getLong(PENDING_DOWNLOAD_ID, -1L);
    }

    private void finishDownload(long downloadId) {
        if (downloadId <= 0L || downloadManager == null || downloadId != pendingDownloadId()) return;
        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        try (Cursor cursor = downloadManager.query(query)) {
            if (cursor == null || !cursor.moveToFirst()) {
                failDownload(downloadId, "download-missing");
                return;
            }
            int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            long downloaded = nonNegative(cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)));
            long reportedTotal = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
            long expectedTotal = preferences().getLong(EXPECTED_SIZE, 0L);
            long total = reportedTotal > 0L ? reportedTotal : expectedTotal;
            if (status == DownloadManager.STATUS_PENDING) {
                updateProgress("pending", downloaded, total);
                return;
            }
            if (status == DownloadManager.STATUS_RUNNING || status == DownloadManager.STATUS_PAUSED) {
                updateProgress("downloading", downloaded, total);
                return;
            }
            if (processingDownloadId == downloadId) return;
            if (status != DownloadManager.STATUS_SUCCESSFUL) {
                failDownload(downloadId, downloadFailureReason(cursor));
                return;
            }
            processingDownloadId = downloadId;
            persistStatus("verifying", total > 0L ? total : downloaded, total, null);
            notifyDownloadStatus();
            fileExecutor.execute(() -> prepareInstaller(downloadId));
        } catch (RuntimeException exception) {
            failDownload(downloadId, "download-query-failed");
        }
    }

    private void updateProgress(String phase, long downloaded, long total) {
        SharedPreferences prefs = preferences();
        if (phase.equals(prefs.getString(UPDATE_PHASE, "idle")) &&
            downloaded == prefs.getLong(DOWNLOADED_BYTES, 0L) && total == prefs.getLong(TOTAL_BYTES, 0L)) return;
        persistStatus(phase, downloaded, total, null);
        notifyDownloadStatus();
    }

    private void failDownload(long downloadId, String reason) {
        if (downloadManager != null && downloadId > 0L) downloadManager.remove(downloadId);
        clearPendingDownload();
        persistStatus("failed", preferences().getLong(DOWNLOADED_BYTES, 0L), preferences().getLong(TOTAL_BYTES, 0L), reason);
        notifyDownloadStatus();
    }

    private String downloadFailureReason(Cursor cursor) {
        int reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON));
        switch (reason) {
            case DownloadManager.ERROR_CANNOT_RESUME: return "download-cannot-resume";
            case DownloadManager.ERROR_DEVICE_NOT_FOUND: return "download-storage-unavailable";
            case DownloadManager.ERROR_FILE_ALREADY_EXISTS: return "download-file-conflict";
            case DownloadManager.ERROR_FILE_ERROR: return "download-file-error";
            case DownloadManager.ERROR_HTTP_DATA_ERROR: return "download-http-data-error";
            case DownloadManager.ERROR_INSUFFICIENT_SPACE: return "download-insufficient-space";
            case DownloadManager.ERROR_TOO_MANY_REDIRECTS: return "download-too-many-redirects";
            case DownloadManager.ERROR_UNHANDLED_HTTP_CODE: return "download-http-error";
            default: return "download-failed";
        }
    }

    private void prepareInstaller(long downloadId) {
        String failure = null;
        Uri installerUri = null;
        File temporaryFile = null;
        try {
            File sharedDirectory = new File(getContext().getFilesDir(), "shared");
            if (!sharedDirectory.exists() && !sharedDirectory.mkdirs()) throw new UpdateValidationException("copy-failed");
            temporaryFile = new File(sharedDirectory, "max-and-gym-update.tmp");
            File apkFile = new File(sharedDirectory, "max-and-gym-update.apk");
            if (temporaryFile.exists() && !temporaryFile.delete()) throw new UpdateValidationException("copy-failed");
            if (apkFile.exists() && !apkFile.delete()) throw new UpdateValidationException("copy-failed");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            long copied = 0L;
            try (ParcelFileDescriptor descriptor = downloadManager.openDownloadedFile(downloadId);
                 InputStream input = new ParcelFileDescriptor.AutoCloseInputStream(descriptor);
                 OutputStream output = new FileOutputStream(temporaryFile, false)) {
                byte[] buffer = new byte[64 * 1024];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    output.write(buffer, 0, count);
                    digest.update(buffer, 0, count);
                    copied += count;
                }
            }
            verifyDownloadedApk(temporaryFile, copied, hex(digest.digest()));
            if (!temporaryFile.renameTo(apkFile)) throw new UpdateValidationException("copy-failed");
            installerUri = FileProvider.getUriForFile(
                getContext(), getContext().getPackageName() + ".fileprovider", apkFile
            );
            preferences().edit().putString(STAGED_APK_PATH, apkFile.getAbsolutePath()).apply();
        } catch (UpdateValidationException exception) {
            failure = exception.reason;
        } catch (IOException exception) {
            failure = "copy-failed";
        } catch (NoSuchAlgorithmException exception) {
            failure = "verification-unavailable";
        } catch (RuntimeException exception) {
            failure = "verification-failed";
        } finally {
            if (temporaryFile != null && temporaryFile.exists()) temporaryFile.delete();
            if (downloadManager != null) downloadManager.remove(downloadId);
        }

        String finalFailure = failure;
        Uri finalInstallerUri = installerUri;
        handler.post(() -> {
            processingDownloadId = -1L;
            clearPendingDownload();
            long expectedSize = preferences().getLong(EXPECTED_SIZE, 0L);
            if (finalFailure != null || finalInstallerUri == null) {
                clearStagedApk();
                persistStatus("failed", expectedSize, expectedSize, finalFailure == null ? "verification-failed" : finalFailure);
                notifyDownloadStatus();
                return;
            }
            persistStatus("ready", expectedSize, expectedSize, null);
            notifyDownloadStatus();
            if (!launchInstaller(finalInstallerUri)) {
                persistStatus("failed", expectedSize, expectedSize, "installer-unavailable");
                notifyDownloadStatus();
            }
        });
    }

    private void verifyDownloadedApk(File apkFile, long copied, String actualSha256) throws UpdateValidationException {
        SharedPreferences prefs = preferences();
        long expectedSize = prefs.getLong(EXPECTED_SIZE, -1L);
        String expectedSha256 = prefs.getString(EXPECTED_SHA256, "");
        if (copied != expectedSize || apkFile.length() != expectedSize) throw new UpdateValidationException("size-mismatch");
        if (!actualSha256.equalsIgnoreCase(expectedSha256)) throw new UpdateValidationException("digest-mismatch");

        PackageManager packageManager = getContext().getPackageManager();
        int signatureFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
            ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        PackageInfo archive = packageManager.getPackageArchiveInfo(apkFile.getAbsolutePath(), signatureFlags);
        if (archive == null || !getContext().getPackageName().equals(archive.packageName)) {
            throw new UpdateValidationException("package-mismatch");
        }
        String expectedVersionName = prefs.getString(EXPECTED_VERSION_NAME, "");
        long expectedVersionCode = prefs.getLong(EXPECTED_VERSION_CODE, -1L);
        if (!expectedVersionName.equals(archive.versionName) || packageVersionCode(archive) != expectedVersionCode ||
            expectedVersionCode <= installedVersionCode()) {
            throw new UpdateValidationException("version-mismatch");
        }
        try {
            PackageInfo installed = packageManager.getPackageInfo(getContext().getPackageName(), signatureFlags);
            if (!certificateDigests(archive).equals(certificateDigests(installed))) {
                throw new UpdateValidationException("signer-mismatch");
            }
        } catch (PackageManager.NameNotFoundException exception) {
            throw new UpdateValidationException("package-mismatch");
        }
    }

    private Set<String> certificateDigests(PackageInfo info) throws UpdateValidationException {
        Signature[] signatures;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && info.signingInfo != null) {
            signatures = info.signingInfo.hasMultipleSigners()
                ? info.signingInfo.getApkContentsSigners() : info.signingInfo.getSigningCertificateHistory();
        } else {
            signatures = info.signatures;
        }
        if (signatures == null || signatures.length == 0) throw new UpdateValidationException("signer-mismatch");
        Set<String> digests = new HashSet<>();
        try {
            for (Signature signature : signatures) {
                digests.add(hex(MessageDigest.getInstance("SHA-256").digest(signature.toByteArray())));
            }
        } catch (NoSuchAlgorithmException exception) {
            throw new UpdateValidationException("verification-unavailable");
        }
        return digests;
    }

    private long installedVersionCode() throws UpdateValidationException {
        try {
            PackageInfo installed = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            return packageVersionCode(installed);
        } catch (PackageManager.NameNotFoundException exception) {
            throw new UpdateValidationException("package-mismatch");
        }
    }

    private long packageVersionCode(PackageInfo info) {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? info.getLongVersionCode() : info.versionCode;
    }

    private void persistExpectedRelease(String sha256, long size, String versionName, long versionCode) {
        preferences().edit()
            .putString(EXPECTED_SHA256, sha256.toLowerCase())
            .putLong(EXPECTED_SIZE, size)
            .putString(EXPECTED_VERSION_NAME, versionName)
            .putLong(EXPECTED_VERSION_CODE, versionCode)
            .apply();
    }

    private void persistStatus(String phase, long downloaded, long total, String reason) {
        SharedPreferences.Editor editor = preferences().edit()
            .putString(UPDATE_PHASE, phase)
            .putLong(DOWNLOADED_BYTES, nonNegative(downloaded))
            .putLong(TOTAL_BYTES, nonNegative(total));
        if (reason == null) editor.remove(FAILURE_REASON); else editor.putString(FAILURE_REASON, reason);
        editor.apply();
    }

    private JSObject statusObject() {
        SharedPreferences prefs = preferences();
        boolean staged = stagedApkFile().isFile();
        long pendingId = pendingDownloadId();
        String phase = prefs.getString(UPDATE_PHASE, staged ? "ready" : pendingId > 0L ? "downloading" : "idle");
        if (staged && "idle".equals(phase)) phase = "ready";
        long downloaded = prefs.getLong(DOWNLOADED_BYTES, 0L);
        long total = prefs.getLong(TOTAL_BYTES, prefs.getLong(EXPECTED_SIZE, 0L));
        JSObject result = new JSObject();
        result.put("phase", phase);
        result.put("downloadedBytes", downloaded);
        result.put("totalBytes", total);
        if (total > 0L) result.put("percent", (int) Math.max(0L, Math.min(100L, downloaded * 100L / total)));
        String reason = prefs.getString(FAILURE_REASON, null);
        if (reason != null) result.put("reason", reason);
        result.put("staged", staged);
        result.put("downloading", pendingId > 0L || Arrays.asList("pending", "downloading", "verifying").contains(phase));
        return result;
    }

    private void clearPendingDownload() {
        preferences().edit().remove(PENDING_DOWNLOAD_ID).apply();
    }

    private File stagedApkFile() {
        String path = preferences().getString(STAGED_APK_PATH, null);
        return path == null ? new File(getContext().getFilesDir(), "shared/max-and-gym-update.apk") : new File(path);
    }

    private void clearStagedApk() {
        File file = stagedApkFile();
        if (file.exists()) file.delete();
        preferences().edit().remove(STAGED_APK_PATH).apply();
    }

    private void clearStagedUpdateIfAlreadyInstalled() {
        File staged = stagedApkFile();
        if (!staged.isFile()) return;
        try {
            PackageInfo archive = getContext().getPackageManager().getPackageArchiveInfo(staged.getAbsolutePath(), 0);
            if (archive != null && packageVersionCode(archive) <= installedVersionCode()) {
                clearStagedApk();
                clearPendingDownload();
                persistStatus("idle", 0L, 0L, null);
            }
        } catch (UpdateValidationException ignored) {
            // A normal status reconciliation will expose an unusable staged file.
        }
    }

    private boolean canInstallPackages() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getContext().getPackageManager().canRequestPackageInstalls();
    }

    private void openInstallPermissionSettings() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        Intent settingsIntent = new Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName())
        );
        try {
            Context launchContext = getActivity() == null ? getContext() : getActivity();
            launchContext.startActivity(settingsIntent);
        } catch (ActivityNotFoundException ignored) {
            // The status remains permission-required and the UI gives a retry path.
        }
    }

    private boolean launchInstaller(Uri apkUri) {
        Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
        intent.setDataAndType(apkUri, APK_MIME_TYPE);
        intent.addCategory(Intent.CATEGORY_DEFAULT);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            Context launchContext = getActivity() == null ? getContext() : getActivity();
            launchContext.startActivity(intent);
            return true;
        } catch (ActivityNotFoundException | SecurityException exception) {
            Intent fallback = new Intent(Intent.ACTION_VIEW);
            fallback.setDataAndType(apkUri, APK_MIME_TYPE);
            fallback.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                Context launchContext = getActivity() == null ? getContext() : getActivity();
                launchContext.startActivity(fallback);
                return true;
            } catch (ActivityNotFoundException | SecurityException ignored) {
                return false;
            }
        }
    }

    private void notifyDownloadStatus() {
        notifyListeners("androidUpdateDownload", statusObject());
    }

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    private long nonNegative(long value) {
        return Math.max(0L, value);
    }

    private String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) result.append(String.format("%02x", value & 0xff));
        return result.toString();
    }

    private static final class UpdateValidationException extends Exception {
        private final String reason;

        private UpdateValidationException(String reason) {
            super(reason);
            this.reason = reason;
        }
    }
}
