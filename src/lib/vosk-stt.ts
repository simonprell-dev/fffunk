// Offline-Spracherkennung der Android-App (Vosk, natives Plugin in android/app/.../VoskSttPlugin.java).
// Für Geräte ohne Google-Sprachdienst, deren WebView zu alt für Whistle ist (z. B. Messe-Funkgerät).
import { Capacitor, registerPlugin } from '@capacitor/core';
import { speechGrammar } from './speech-match';
import splits from './vosk-splits.json';

interface VoskSttPlugin {
  load(): Promise<void>;
  /** grammar: nur diese Wörter erkennen (plus „[unk]“ für alles andere). */
  start(options?: { grammar?: string[] }): Promise<void>;
  stop(): Promise<{ text: string }>;
}

export const VoskStt = registerPlugin<VoskSttPlugin>('VoskStt');

export function isVoskAvailable(): boolean {
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('VoskStt');
}

/** Wortliste für einen Funkspruch – das kleine Modell kennt viele Feuerwehr-Komposita nicht einzeln. */
export function voskGrammar(texts: string[]): string[] {
  return speechGrammar(texts, splits);
}
