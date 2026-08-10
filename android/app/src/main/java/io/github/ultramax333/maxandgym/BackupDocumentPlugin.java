package io.github.ultramax333.maxandgym;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "BackupDocument")
public class BackupDocumentPlugin extends Plugin {
    private static final long MAX_ARCHIVE_BYTES = 256L * 1024L * 1024L;
    private static final int MAX_CHUNK_BYTES = 512 * 1024;
    private static final long ORPHAN_MAX_AGE_MS = 24L * 60L * 60L * 1000L;
    private final ExecutorService fileExecutor = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        cleanupOrphans();
    }

    @Override
    protected void handleOnDestroy() {
        fileExecutor.shutdownNow();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void beginStage(PluginCall call) {
        String fileName = call.getString("fileName");
        Long size = call.getLong("size");
        if (!validFileName(fileName) || size == null || size <= 0 || size > MAX_ARCHIVE_BYTES) {
            call.reject("Invalid backup document.");
            return;
        }
        String token = UUID.randomUUID().toString();
        File file = stageFile(token);
        try {
            File directory = file.getParentFile();
            if (directory == null || (!directory.exists() && !directory.mkdirs()) || !file.createNewFile()) throw new IllegalStateException("Could not create staging file.");
            try (DataOutputStream metadata = new DataOutputStream(new FileOutputStream(sizeFile(token), false))) {
                metadata.writeLong(size);
            }
            JSObject result = new JSObject();
            result.put("token", token);
            call.resolve(result);
        } catch (Exception error) {
            deleteStage(token);
            call.reject("Could not prepare the backup document.", error);
        }
    }

    @PluginMethod
    public void appendStage(PluginCall call) {
        String token = call.getString("token");
        Long offset = call.getLong("offset");
        String base64Data = call.getString("base64Data");
        File file = validToken(token) ? stageFile(token) : null;
        if (file == null || !file.exists() || offset == null || offset != file.length() || base64Data == null) {
            call.reject("Invalid backup chunk order.");
            return;
        }
        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            long expectedSize = expectedSize(token);
            if (bytes.length == 0 || bytes.length > MAX_CHUNK_BYTES || file.length() + bytes.length > expectedSize) throw new IllegalArgumentException("Invalid backup chunk size.");
            try (FileOutputStream output = new FileOutputStream(file, true)) {
                output.write(bytes);
            }
            JSObject result = new JSObject();
            result.put("nextOffset", file.length());
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not stage the backup chunk.", error);
        }
    }

    @PluginMethod
    public void commitStage(PluginCall call) {
        String token = call.getString("token");
        String fileName = call.getString("fileName");
        Long size = call.getLong("size");
        File file = validToken(token) ? stageFile(token) : null;
        if (file == null || !file.exists() || !validFileName(fileName) || size == null || size != file.length() || size != expectedSize(token)) {
            call.reject("The staged backup is incomplete.");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE)
            .setType("application/zip")
            .putExtra(Intent.EXTRA_TITLE, fileName);
        startActivityForResult(call, intent, "commitResult");
    }

    @ActivityCallback
    private void commitResult(PluginCall call, ActivityResult activityResult) {
        if (call == null) return;
        String token = call.getString("token");
        File file = validToken(token) ? stageFile(token) : null;
        Uri uri = activityResult.getData() == null ? null : activityResult.getData().getData();
        if (activityResult.getResultCode() != Activity.RESULT_OK || uri == null) {
            deleteStage(token);
            JSObject result = new JSObject();
            result.put("cancelled", true);
            call.resolve(result);
            return;
        }
        fileExecutor.execute(() -> {
            try (InputStream input = new FileInputStream(file); OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new IllegalStateException("The selected document cannot be written.");
                byte[] buffer = new byte[64 * 1024];
                int count;
                while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                output.flush();
                JSObject result = new JSObject();
                result.put("cancelled", false);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Could not save the backup document.", error);
            } finally {
                deleteStage(token);
            }
        });
    }

    @PluginMethod
    public void abortStage(PluginCall call) {
        String token = call.getString("token");
        if (validToken(token)) deleteStage(token);
        call.resolve();
    }

    private File stageFile(String token) {
        return new File(new File(getContext().getCacheDir(), "backup-staging"), token + ".part");
    }

    private File sizeFile(String token) {
        return new File(new File(getContext().getCacheDir(), "backup-staging"), token + ".size");
    }

    private long expectedSize(String token) {
        try (DataInputStream metadata = new DataInputStream(new FileInputStream(sizeFile(token)))) {
            return metadata.readLong();
        } catch (Exception error) {
            return -1L;
        }
    }

    private void deleteStage(String token) {
        deleteQuietly(stageFile(token));
        deleteQuietly(sizeFile(token));
    }

    private boolean validToken(String token) {
        return token != null && token.matches("[a-f0-9-]{36}");
    }

    private boolean validFileName(String fileName) {
        return fileName != null && fileName.matches("[a-zA-Z0-9._-]+\\.maxgym");
    }

    private void cleanupOrphans() {
        File directory = new File(getContext().getCacheDir(), "backup-staging");
        File[] files = directory.listFiles();
        if (files == null) return;
        long cutoff = System.currentTimeMillis() - ORPHAN_MAX_AGE_MS;
        for (File file : files) if (file.lastModified() < cutoff) deleteQuietly(file);
    }

    private void deleteQuietly(File file) {
        if (file != null && file.exists()) file.delete();
    }
}
