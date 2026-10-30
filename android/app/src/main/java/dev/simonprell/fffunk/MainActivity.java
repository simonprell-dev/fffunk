package dev.simonprell.fffunk;

import android.os.Bundle;
import android.view.KeyEvent;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VoskSttPlugin.class); // Offline-Spracherkennung (lokales Plugin)
        registerPlugin(RadioTtsPlugin.class); // Sprachausgabe, wenn der Server nicht erreichbar ist
        registerPlugin(RadioKeysPlugin.class); // Tasten von Funkgeräten (PTT, SOS, Drehknopf)
        super.onCreate(savedInstanceState);
        applyFullscreen();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyFullscreen(); // nach Dialogen/App-Wechsel wieder ausblenden
    }

    // Kleine Displays (z. B. 2,4"-Funkgerät): Statusleiste ausblenden, Wischen vom Rand zeigt sie kurz.
    private void applyFullscreen() {
        if (getResources().getConfiguration().smallestScreenWidthDp >= 360) return;
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        return RadioKeysPlugin.onKeyEvent(event) || super.dispatchKeyEvent(event);
    }
}
