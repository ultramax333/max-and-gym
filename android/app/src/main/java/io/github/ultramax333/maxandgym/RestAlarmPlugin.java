package io.github.ultramax333.maxandgym;

import android.Manifest;
import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(name = "RestAlarm", permissions = {
    @Permission(alias = "notifications", strings = {Manifest.permission.POST_NOTIFICATIONS})
})
public class RestAlarmPlugin extends Plugin {
    private static final String KEY_NOTIFICATION_REQUESTED = "notificationPermissionRequested";

    @PluginMethod
    public void getCapabilities(PluginCall call) {
        call.resolve(capabilities());
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            call.resolve(capabilities());
            return;
        }
        RestAlarmScheduler.preferences(getContext()).edit().putBoolean(KEY_NOTIFICATION_REQUESTED, true).apply();
        requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        call.resolve(capabilities());
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        boolean opened = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !RestAlarmScheduler.canScheduleExact(getContext())) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
            opened = true;
        }
        JSObject result = new JSObject();
        result.put("opened", opened);
        result.put("exactAlarmAllowed", RestAlarmScheduler.canScheduleExact(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        String timerId = call.getString("timerId");
        String sessionId = call.getString("sessionId");
        Long endsAtEpochMs = call.getLong("endsAtEpochMs");
        if (timerId == null || timerId.isBlank() || sessionId == null || sessionId.isBlank() || endsAtEpochMs == null || endsAtEpochMs <= 0L) {
            call.reject("A valid timerId, sessionId and endsAtEpochMs are required.");
            return;
        }
        boolean scheduled = RestAlarmScheduler.schedule(getContext(), timerId, sessionId, endsAtEpochMs);
        JSObject result = new JSObject();
        result.put("scheduled", scheduled);
        result.put("exactAlarmAllowed", RestAlarmScheduler.canScheduleExact(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        RestAlarmScheduler.cancel(getContext(), call.getString("timerId"));
        call.resolve();
    }

    @PluginMethod
    public void consumeLastAction(PluginCall call) {
        SharedPreferences preferences = RestAlarmScheduler.preferences(getContext());
        String action = preferences.getString(RestAlarmScheduler.KEY_LAST_ACTION, null);
        String timerId = preferences.getString(RestAlarmScheduler.KEY_LAST_ACTION_TIMER_ID, null);
        long occurredAt = preferences.getLong(RestAlarmScheduler.KEY_LAST_ACTION_AT, 0L);
        JSObject result = new JSObject();
        if (action != null) result.put("action", action);
        if (timerId != null) result.put("timerId", timerId);
        if (occurredAt > 0L) result.put("occurredAtEpochMs", occurredAt);
        preferences.edit().remove(RestAlarmScheduler.KEY_LAST_ACTION).remove(RestAlarmScheduler.KEY_LAST_ACTION_TIMER_ID).remove(RestAlarmScheduler.KEY_LAST_ACTION_AT).apply();
        call.resolve(result);
    }

    private JSObject capabilities() {
        JSObject result = new JSObject();
        result.put("nativeAndroid", true);
        result.put("notificationPermission", notificationPermission());
        result.put("exactAlarmAllowed", RestAlarmScheduler.canScheduleExact(getContext()));
        return result;
    }

    private String notificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return "granted";
        boolean requested = RestAlarmScheduler.preferences(getContext()).getBoolean(KEY_NOTIFICATION_REQUESTED, false);
        return requested || getPermissionState("notifications") == PermissionState.DENIED ? "denied" : "prompt";
    }
}
