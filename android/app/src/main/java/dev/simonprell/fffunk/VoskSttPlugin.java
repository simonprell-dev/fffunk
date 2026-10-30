package dev.simonprell.fffunk;

import android.Manifest;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONObject;
import org.vosk.LibVosk;
import org.vosk.LogLevel;
import org.vosk.Model;
import org.vosk.Recognizer;
import org.vosk.android.RecognitionListener;
import org.vosk.android.SpeechService;
import org.vosk.android.StorageService;

/**
 * Offline-Spracherkennung mit Vosk – für Geräte ohne Google-Sprachdienst
 * (z. B. das Messe-Funkgerät: Android 9, 32-bit ARM, keine Google-App).
 * Modell: assets/model-de (scripts/fetch-vosk-model.mjs).
 *
 * load()  → Modell beim ersten Start entpacken und laden
 * start() → Mikrofon auf, Erkennung läuft, solange die Sprechtaste gedrückt ist;
 *           optional { grammar: [...] } – nur diese Wörter erkennen (viel treffsicherer)
 * stop()  → Erkennung beenden, liefert { text }
 */
@CapacitorPlugin(
    name = "VoskStt",
    permissions = { @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }) }
)
public class VoskSttPlugin extends Plugin {
    private static final float SAMPLE_RATE = 16000.0f;

    private Model model;
    private boolean loading;
    private final java.util.List<PluginCall> loadCalls = new java.util.ArrayList<>();
    private SpeechService speechService;
    private final StringBuilder text = new StringBuilder();
    private PluginCall stopCall;

    @PluginMethod
    public void load(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "afterPermission");
            return;
        }
        loadModel(call);
    }

    @PermissionCallback
    private void afterPermission(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("Mikrofon-Zugriff verweigert.", "permission");
            return;
        }
        loadModel(call);
    }

    private void loadModel(PluginCall call) {
        if (model != null) { call.resolve(); return; }
        loadCalls.add(call);
        if (loading) return;
        loading = true;
        LibVosk.setLogLevel(LogLevel.WARNINGS);
        StorageService.unpack(getContext(), "model-de", "model",
            m -> { model = m; loading = false; for (PluginCall c : loadCalls) c.resolve(); loadCalls.clear(); },
            e -> { loading = false; for (PluginCall c : loadCalls) c.reject("Sprachmodell konnte nicht geladen werden: " + e.getMessage()); loadCalls.clear(); });
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (model == null) { call.reject("Sprachmodell nicht geladen."); return; }
        stopService();
        text.setLength(0);
        try {
            JSArray grammar = call.getArray("grammar");
            Recognizer recognizer = grammar != null && grammar.length() > 0
                ? new Recognizer(model, SAMPLE_RATE, grammar.toString())
                : new Recognizer(model, SAMPLE_RATE);
            speechService = new SpeechService(recognizer, SAMPLE_RATE);
            speechService.startListening(listener);
            call.resolve();
        } catch (Exception e) {
            stopService();
            call.reject("Mikrofon konnte nicht gestartet werden: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (speechService == null) { resolveText(call); return; }
        if (stopCall != null) stopCall.reject("abgelöst");
        stopCall = call;
        speechService.stop(); // → onFinalResult
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onPartialResult(String hypothesis) {}

        // Vosk liefert bei Sprechpausen Zwischenergebnisse – zusammensetzen.
        @Override public void onResult(String hypothesis) { append(hypothesis); }

        @Override public void onFinalResult(String hypothesis) {
            append(hypothesis);
            stopService();
            if (stopCall != null) { resolveText(stopCall); stopCall = null; }
        }

        @Override public void onError(Exception e) {
            stopService();
            if (stopCall != null) { stopCall.reject("Spracherkennung fehlgeschlagen: " + e.getMessage()); stopCall = null; }
        }

        @Override public void onTimeout() {}
    };

    private void append(String json) {
        try {
            String t = new JSONObject(json).optString("text", "").trim();
            if (!t.isEmpty()) { if (text.length() > 0) text.append(' '); text.append(t); }
        } catch (Exception ignored) { }
    }

    private void resolveText(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("text", text.toString());
        call.resolve(ret);
    }

    private void stopService() {
        if (speechService != null) {
            speechService.shutdown();
            speechService = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        stopService();
        if (model != null) { model.close(); model = null; }
    }
}
