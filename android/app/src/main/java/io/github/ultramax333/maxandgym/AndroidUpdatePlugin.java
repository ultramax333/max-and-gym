package io.github.ultramax333.maxandgym;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AndroidUpdate")
public class AndroidUpdatePlugin extends Plugin {
    private static final String APPROVED_HOST = "github.com";
    private static final String APPROVED_PATH_PREFIX = "/ultramax333/max-and-gym/releases/download/";
    private static final String APK_MIME_TYPE = "application/vnd.android.package-archive";
    private static final String PREFERENCES_NAME = "android-update";
    private static final String PENDING_DOWNLOAD_ID = "pendingDownloadId";

    private DownloadManager downloadManager;
    private BroadcastReceiver downloadReceiver;

    @Override
    public void load() {
        downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
                long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
                finishDownload(downloadId);
            }
        };
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(downloadReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            getContext().registerReceiver(downloadReceiver, filter);
        }
        resumePendingDownload();
    }

    @Override
    protected void handleOnDestroy() {
        if (downloadReceiver != null) {
            getContext().unregisterReceiver(downloadReceiver);
            downloadReceiver = null;
        }
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

    private void resumePendingDownload() {
        long downloadId = getContext().getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .getLong(PENDING_DOWNLOAD_ID, -1L);
        if (downloadId > 0L) finishDownload(downloadId);
    }

    private void finishDownload(long downloadId) {
        if (downloadId <= 0L || downloadManager == null) return;
        long pendingId = getContext().getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .getLong(PENDING_DOWNLOAD_ID, -1L);
        if (downloadId != pendingId) return;

        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        try (Cursor cursor = downloadManager.query(query)) {
            if (cursor == null || !cursor.moveToFirst()) return;
            int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            if (status == DownloadManager.STATUS_PENDING || status == DownloadManager.STATUS_RUNNING) return;
            clearPendingDownload();
            if (status != DownloadManager.STATUS_SUCCESSFUL) {
                JSObject result = new JSObject();
                result.put("status", "failed");
                notifyListeners("androidUpdateDownload", result);
                return;
            }
            Uri apkUri = downloadManager.getUriForDownloadedFile(downloadId);
            if (apkUri == null) {
                JSObject result = new JSObject();
                result.put("status", "failed");
                notifyListeners("androidUpdateDownload", result);
                return;
            }
            getActivity().runOnUiThread(() -> launchInstaller(apkUri));
        }
    }

    private void clearPendingDownload() {
        getContext().getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .edit()
            .remove(PENDING_DOWNLOAD_ID)
            .apply();
    }

    private void launchInstaller(Uri apkUri) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(apkUri, APK_MIME_TYPE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getActivity().startActivity(intent);
        JSObject result = new JSObject();
        result.put("status", "ready");
        notifyListeners("androidUpdateDownload", result);
    }
}
