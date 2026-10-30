package dev.simonprell.fffunk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;
import android.view.KeyEvent;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Tasten von PoC-Funkgeräten (getestet: Android-9-Gerät mit 2,4"-Display).
 *
 * Event „key“ { key, pressed }:
 *   ptt     – seitliche Sprechtaste (Broadcast android.intent.action.ptt.down/up)
 *   sos     – Notruftaste (Broadcast unipro.hotkey.vb.down/up)
 *   next / prev / select – mittlerer Drehknopf (Kanalwähler: KEY_COPY/KEY_OPEN → F3/F4) und Knopfdruck,
 *                          ersatzweise Steuerkreuz. Der Lautstärkeknopf bleibt Lautstärke.
 */
@CapacitorPlugin(name = "RadioKeys")
public class RadioKeysPlugin extends Plugin {
    private static final String TAG = "FFFunkKeys";
    private static RadioKeysPlugin instance;

    private final BroadcastReceiver receiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (action == null) return;
            String key = action.contains(".ptt.") ? "ptt" : "sos";
            emit(key, action.endsWith(".down"));
        }
    };

    @Override
    public void load() {
        instance = this;
        IntentFilter filter = new IntentFilter();
        filter.addAction("android.intent.action.ptt.down");
        filter.addAction("android.intent.action.ptt.up");
        filter.addAction("unipro.hotkey.vb.down");
        filter.addAction("unipro.hotkey.vb.up");
        // Die Tasten-Broadcasts kommen vom System, nicht aus der App → EXPORTED (ab Android 14 Pflicht).
        ContextCompat.registerReceiver(getContext(), receiver, filter, ContextCompat.RECEIVER_EXPORTED);
    }

    private void emit(String key, boolean pressed) {
        JSObject ev = new JSObject();
        ev.put("key", key);
        ev.put("pressed", pressed);
        notifyListeners("key", ev);
    }

    /** Aus MainActivity.dispatchKeyEvent – true = Taste verbraucht. */
    static boolean onKeyEvent(KeyEvent event) {
        RadioKeysPlugin p = instance;
        if (p == null) return false;
        Log.d(TAG, KeyEvent.keyCodeToString(event.getKeyCode()) + " " + (event.getAction() == KeyEvent.ACTION_DOWN ? "down" : "up"));
        String key;
        switch (event.getKeyCode()) {
            case KeyEvent.KEYCODE_F3:          // Kanalwähler eine Raste weiter
            case KeyEvent.KEYCODE_DPAD_DOWN:
                key = "next"; break;
            case KeyEvent.KEYCODE_F4:          // Kanalwähler eine Raste zurück
            case KeyEvent.KEYCODE_DPAD_UP:
                key = "prev"; break;
            case KeyEvent.KEYCODE_F5:
            case KeyEvent.KEYCODE_NAVIGATE_NEXT:
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
                key = "select"; break;
            default:
                return false;
        }
        // Gehaltene Tasten wiederholen sich – nur den ersten Druck werten.
        if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) p.emit(key, true);
        return true;
    }

    @Override
    protected void handleOnDestroy() {
        try { getContext().unregisterReceiver(receiver); } catch (IllegalArgumentException ignored) { }
        if (instance == this) instance = null;
    }
}
