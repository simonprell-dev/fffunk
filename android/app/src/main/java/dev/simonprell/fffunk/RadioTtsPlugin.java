package dev.simonprell.fffunk;

import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Sprachausgabe über die Android-Sprachsynthese – die Android-WebView kennt keine Web-Speech-Ausgabe.
 *
 * Satzweise vorberechnet: Langsame Geräte (z. B. Cat S62 Pro mit aktueller Google-Sprachausgabe) brauchen
 * pro Satz etwa so lange zum Berechnen wie zum Sprechen. Mit tts.speak() entsteht dadurch vor jedem Satz
 * eine Pause von mehreren Sekunden. Deshalb wird jeder Satz in eine Datei synthetisiert und abgespielt,
 * während die Sprachausgabe schon den nächsten berechnet.
 *
 * speak({ text }) → endet, wenn fertig gesprochen;  stop();  info() → { available, german }
 */
@CapacitorPlugin(name = "RadioTts")
public class RadioTtsPlugin extends Plugin {
    private static final String TAG = "FFFunkTts";

    private TextToSpeech tts;
    private boolean ready;
    private boolean german;
    private final Handler main = new Handler(Looper.getMainLooper());
    private int seq;
    private Job job; // nur auf dem Main-Thread benutzt

    /** Ein Text, zerlegt in Sätze: Datei je Satz, Zustand 0 = wird berechnet, 1 = fertig, -1 = Fehler. */
    private static class Job {
        final int id;
        final PluginCall call;
        final List<File> files = new ArrayList<>();
        int[] state;
        int next;
        MediaPlayer player;

        Job(int id, PluginCall call) { this.id = id; this.call = call; }
    }

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
                @Override public void onDone(String id) { main.post(() -> partReady(id, true)); }
                @Override public void onError(String id) { main.post(() -> partReady(id, false)); }
            });
            ready = true;
            // Stimme vorladen: sonst dauert der erste Satz spürbar länger
            if (german) {
                Bundle silent = new Bundle();
                silent.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 0f);
                tts.speak("Funkverbindung steht.", TextToSpeech.QUEUE_ADD, silent, "warmup");
            }
        });
    }

    /**
     * Neuere Google-Sprachausgabe nimmt sonst gern eine Online-Stimme, die Satz für Satz lädt.
     * Offline-Stimme mit bester Qualität bevorzugen.
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
            Log.d(TAG, "Stimme: " + (best != null ? best.getName() : "Standard"));
        } catch (RuntimeException e) {
            Log.w(TAG, "Stimmenwahl fehlgeschlagen", e); // ältere Engines: Standardstimme behalten
        }
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
        String text = call.getString("text", "").trim();
        if (!ready || !german || text.isEmpty()) {
            call.reject("Keine deutsche Sprachausgabe auf dem Gerät.");
            return;
        }
        main.post(() -> start(call, text));
    }

    private void start(PluginCall call, String text) {
        cancel(); // es spricht immer nur der neueste Text
        Job j = new Job(++seq, call);
        String[] parts = text.split("(?<=[.!?…])\\s+");
        j.state = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            File f = new File(getContext().getCacheDir(), "tts_" + j.id + "_" + i + ".wav");
            j.files.add(f);
            // Die Sprachausgabe arbeitet die Aufträge nacheinander ab – Satz 2 entsteht, während Satz 1 läuft.
            int res = tts.synthesizeToFile(parts[i], null, f, "j" + j.id + "_" + i);
            if (res != TextToSpeech.SUCCESS) j.state[i] = -1;
        }
        job = j;
        playNext();
    }

    /** Satz fertig berechnet (Utterance-ID „j<job>_<satz>“). */
    private void partReady(String utteranceId, boolean ok) {
        if (job == null || utteranceId == null || !utteranceId.startsWith("j" + job.id + "_")) return;
        int i;
        try { i = Integer.parseInt(utteranceId.substring(utteranceId.indexOf('_') + 1)); }
        catch (NumberFormatException e) { return; }
        if (i < 0 || i >= job.state.length) return;
        job.state[i] = ok ? 1 : -1;
        if (job.player == null) playNext();
    }

    private void playNext() {
        Job j = job;
        if (j == null || j.player != null) return;
        while (j.next < j.state.length && j.state[j.next] == -1) j.next++;
        if (j.next >= j.state.length) { finish(j); return; }
        if (j.state[j.next] == 0) return; // Satz wird noch berechnet – partReady() spielt ihn ab
        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build());
            mp.setDataSource(j.files.get(j.next).getAbsolutePath());
            mp.prepare();
        } catch (Exception e) {
            Log.w(TAG, "Satz nicht abspielbar", e);
            mp.release();
            j.next++;
            playNext();
            return;
        }
        mp.setOnCompletionListener(done -> {
            done.release();
            if (job != j) return;
            j.player = null;
            j.next++;
            playNext();
        });
        j.player = mp;
        mp.start();
    }

    private void finish(Job j) {
        if (j.player != null) {
            try { j.player.stop(); } catch (IllegalStateException ignored) { }
            j.player.release();
            j.player = null;
        }
        for (File f : j.files) //noinspection ResultOfMethodCallIgnored
            f.delete();
        if (job == j) job = null;
        j.call.resolve();
    }

    /** Laufende Ausgabe abbrechen; ihr speak() endet dann (wie bisher bei QUEUE_FLUSH). */
    private void cancel() {
        if (tts != null) tts.stop();
        if (job != null) finish(job);
    }

    /** Deutsche Stimmen des Geräts (zum Vergleichen von Klang und Tempo). */
    @PluginMethod
    public void voices(PluginCall call) {
        JSArray list = new JSArray();
        if (ready) for (Voice v : tts.getVoices()) {
            if (!"de".equals(v.getLocale().getLanguage())) continue;
            JSObject o = new JSObject();
            o.put("name", v.getName());
            o.put("quality", v.getQuality());
            o.put("network", v.isNetworkConnectionRequired());
            list.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("voices", list);
        ret.put("current", ready && tts.getVoice() != null ? tts.getVoice().getName() : null);
        call.resolve(ret);
    }

    @PluginMethod
    public void setVoice(PluginCall call) {
        String name = call.getString("name", "");
        if (ready) for (Voice v : tts.getVoices()) {
            if (v.getName().equals(name)) { tts.setVoice(v); call.resolve(); return; }
        }
        call.reject("Stimme nicht gefunden: " + name);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        main.post(this::cancel);
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        main.post(() -> {
            cancel();
            if (tts != null) tts.shutdown();
        });
    }
}
