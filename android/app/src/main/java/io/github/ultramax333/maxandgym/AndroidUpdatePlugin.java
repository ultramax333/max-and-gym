package io.github.ultramax333.maxandgym;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AndroidUpdate")
public class AndroidUpdatePlugin extends Plugin {
    private static final String APPROVED_HOST = "github.com";
    private static final String APPROVED_PATH_PREFIX = "/ultramax333/max-and-gym/releases/download/";

    @PluginMethod
    public void openDownload(PluginCall call) {
        String value = call.getString("url");
        if (value == null) {
            call.reject("A release download URL is required.");
            return;
        }
        Uri uri = Uri.parse(value);
        String host = uri.getHost();
        String path = uri.getPath();
        boolean approved = "https".equalsIgnoreCase(uri.getScheme())
            && host != null
            && APPROVED_HOST.equalsIgnoreCase(host)
            && path != null
            && path.startsWith(APPROVED_PATH_PREFIX)
            && path.endsWith("-release.apk")
            && uri.getQuery() == null
            && uri.getFragment() == null;
        if (!approved) {
            call.reject("The release download URL is not approved.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        try {
            getActivity().startActivity(intent);
            call.resolve(new JSObject());
        } catch (ActivityNotFoundException exception) {
            call.reject("No browser can open the release download.", exception);
        }
    }
}
