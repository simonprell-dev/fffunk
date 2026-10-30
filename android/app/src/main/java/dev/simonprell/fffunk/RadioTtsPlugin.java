package dev.simonprell.fffunk;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Sprachausgabe über die Android-Sprachsynthese – Ersatz, wenn der Server (Piper) nicht erreichbar ist.
 * Die Android-WebView kennt keine Web-Speech-Sprachausgabe.
 *
 * speak({ text }) → endet, wenn fertig gesprochen;  stop();  info() → { available, german }
 */
@CapacitorPlugin(name = "RadioTts")
public class RadioTtsPlugin extends Plugin {
    private TextToSpeech tts;
    private boolean ready;
    private boolean german;
    private int counter;
    private final Map<String, PluginCall> pending = new HashMap<>();

    @Override
    public void load() {
        tts = new TextToSpeech(getContext(), status -> {
            if (status != TextToSpeech.SUCCESS) return;
            int r = tts.setLanguage(Locale.GERMANY);
            german = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED;
            if (german) useOfflineGermanVoice();
            tts.setSpeechRate(1.1f);
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { finish(id); }
                @Override public void onError(String id) { finish(id); }
                @Override public void onStop(String id, boolean interrupted) { finish(id); }
            });
            ready = true;
            // Stimme vorladen: sonst dauert der erste längere Text spürbar, bis er weiterläuft
            if (german) {
                Bundle silent = new Bundle();
                silent.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 0f);
                tts.speak("Funkverbindung steht.", TextToSpeech.QUEUE_ADD, silent, "warmup");
            }
        });
    }

    /**
     * Neuere Google-Sprachausgabe nimmt sonst gern eine Online-Stimme, die Satz für Satz lädt –
     * lange Pausen zwischen den Sätzen (z. B. Cat S62 Pro). Offline-Stimme mit bester Qualität bevorzugen.
     */
    private void useOfflineGermanVoice() {
        try {
            Voice best = null;
            for (Voice v : tts.getVoices()) {
                if (!"de".equals(v.getLocale().getLanguage()) || v.isNetworkConnectionRequired()) continue;
                if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                if (best == null || v.getQuality() > best.getQuality()) best = v;
            }
            if (best != null) tts.setVoice(best);
            Log.d("FFFunkTts", "Stimme: " + (best != null ? best.getName() : "Standard"));
        } catch (RuntimeException e) {
            Log.w("FFFunkTts", "Stimmenwahl fehlgeschlagen", e); // ältere Engines: Standardstimme behalten
        }
    }

    private synchronized void finish(String id) {
        PluginCall call = pending.remove(id);
        if (call != null) call.resolve();
    }

    @PluginMethod
    public void info(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", ready);
        ret.put("german", german);
        call.resolve(ret);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        if (!ready || !german || text.isEmpty()) {
            call.reject("Keine deutsche Sprachausgabe auf dem Gerät.");
            return;
        }
        String id = "u" + (++counter);
        synchronized (this) { pending.put(id, call); }
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id); // QUEUE_FLUSH beendet die vorige Ausgabe → onStop
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) tts.stop();
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) tts.shutdown();
    }
}
