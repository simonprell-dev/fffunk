// Android-App: Spracherkennung schon beim App-Start im Hintergrund vorbereiten.
// Sonst lädt das Offline-Modell (Vosk) erst beim ersten Funkspruch – auf langsamen Geräten mehrere Sekunden.
// Die Sprachausgabe startet das native Plugin ohnehin beim App-Start (RadioTtsPlugin.load).
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { VoskStt, isVoskAvailable } from './vosk-stt';

export interface WarmUpDeps {
  platform: string;
  voskAvailable: boolean;
  googleAvailable: () => Promise<boolean>;
  preloadVosk: () => Promise<void>;
}

const defaultDeps = (): WarmUpDeps => ({
  platform: Capacitor.getPlatform(),
  voskAvailable: isVoskAvailable(),
  googleAvailable: async () => !!(await SpeechRecognition.available())?.available,
  preloadVosk: () => VoskStt.preload(),
});

/** Welche Erkennung vorbereitet wurde: 'vosk' (Modell lädt), 'google' (nichts zu tun) oder 'none' (Browser). */
export async function warmUpSpeech(deps: WarmUpDeps = defaultDeps()): Promise<'vosk' | 'google' | 'none'> {
  if (deps.platform !== 'android' || !deps.voskAvailable) return 'none';
  let google = false;
  try { google = await deps.googleAvailable(); } catch { /* wie ohne Google-Dienst */ }
  if (google) return 'google';
  await deps.preloadVosk().catch(() => {}); // Fehler zeigt das Funkspruch-Fenster beim eigentlichen Laden
  return 'vosk';
}
