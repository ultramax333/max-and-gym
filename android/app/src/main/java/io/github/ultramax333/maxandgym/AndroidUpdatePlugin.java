package io.github.ultramax333.maxandgym;

import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AndroidUpdate")
public class AndroidUpdatePlugin extends Plugin {
    private static final String APPROVED_HOST = "github.com";
    private static final String APPROVED_PATH_PREFIX = "/ultramax333/max-and-gym/releases/download/";
    private static final String APK_MIME_TYPE = "application/vnd.android.package-archive";
    private static final String PREFERENCES_NAME = "android-update";
    private static final String PENDING_DOWNLOAD_ID = "pendingDownloadId";

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
        Uri uri = value == null ? null : Uri.parse(value);
        if (!isApprovedDownload(uri)) {
            call.reject("The release download URL is not approved.");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent settingsIntent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName())
            );
            getActivity().startActivity(settingsIntent);
            JSObject result = new JSObject();
            result.put("status", "permission-required");
            call.resolve(result);
            return;
        }
        if (downloadManager == null) {
            call.reject("Android download manager is unavailable.");
            return;
        }

        DownloadManager.Request request = new DownloadManager.Request(uri)
            .setTitle("Max & Gym update")
            .setDescription("Downloading the signed Android update")
            .setMimeType(APK_MIME_TYPE)
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(false)
            .setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, "max-and-gym-update.apk");
        long downloadId = downloadManager.enqueue(request);
        getContext().getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .edit()
            .putLong(PENDING_DOWNLOAD_ID, downloadId)
            .apply();
        scheduleDownloadPolling();

        JSObject result = new JSObject();
        result.put("status", "downloading");
        result.put("downloadId", downloadId);
        call.resolve(result);
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
                    handler.postDelayed(this, 1000L);
                } else {
                    downloadPoller = null;
                }
            }
        };
        handler.post(downloadPoller);
    }

    private long pendingDownloadId() {
        return getContext().getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .getLong(PENDING_DOWNLOAD_ID, -1L);
    }

    private void finishDownload(long downloadId) {
        if (downloadId <= 0L || downloadManager == null || downloadId != pendingDownloadId()) return;
        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        try (Cursor cursor = downloadManager.query(query)) {
            if (cursor == null || !cursor.moveToFirst()) return;
            int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            if (status == DownloadManager.STATUS_PENDING || status == DownloadManager.STATUS_RUNNING || processingDownloadId == downloadId) return;
            if (status != DownloadManager.STATUS_SUCCESSFUL) {
                clearPendingDownload();
                notifyDownloadStatus("failed");
                return;
            }
            processingDownloadId = downloadId;
            fileExecutor.execute(() -> prepareInstaller(downloadId));
        }
    }

    private void prepareInstaller(long downloadId) {
        Uri installerUri = null;
        try {
            File sharedDirectory = new File(getContext().getFilesDir(), "shared");
            if (!sharedDirectory.exists() && !sharedDirectory.mkdirs()) throw new IOException("Could not create update directory.");
            File apkFile = new File(sharedDirectory, "max-and-gym-update.apk");
            try (InputStream input = downloadManager.openDownloadedFile(downloadId);
                 OutputStream output = new FileOutputStream(apkFile, false)) {
                byte[] buffer = new byte[64 * 1024];
                int count;
                while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            }
            installerUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                apkFile
            );
        } catch (Exception exception) {
            // The UI can retry the update after a failed copy or stale DownloadManager entry.
        }
        Uri finalInstallerUri = installerUri;
        getActivity().runOnUiThread(() -> {
            processingDownloadId = -1L;
            clearPendingDownload();
            if (finalInstallerUri == null) {
                notifyDownloadStatus("failed");
                return;
            }
            launchInstaller(finalInstallerUri);
        });
    }

    private void clearPendingDownload() {
        getContext().getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .edit()
            .remove(PENDING_DOWNLOAD_ID)
            .apply();
    }

    private void launchInstaller(Uri apkUri) {
        Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
        intent.setDataAndType(apkUri, APK_MIME_TYPE);
        intent.addCategory(Intent.CATEGORY_DEFAULT);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getActivity().startActivity(intent);
            notifyDownloadStatus("ready");
        } catch (ActivityNotFoundException | SecurityException exception) {
            Intent fallback = new Intent(Intent.ACTION_VIEW);
            fallback.setDataAndType(apkUri, APK_MIME_TYPE);
            fallback.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getActivity().startActivity(fallback);
                notifyDownloadStatus("ready");
            } catch (ActivityNotFoundException | SecurityException ignored) {
                notifyDownloadStatus("failed");
            }
        }
    }

    private void notifyDownloadStatus(String status) {
        JSObject result = new JSObject();
        result.put("status", status);
        notifyListeners("androidUpdateDownload", result);
    }
}
