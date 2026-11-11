// Spracherkennung für die Gruppenübung. Zwei Betriebsarten:
//  • auto  – echte Funkgeräte: Das Handy hört von selbst zu, sobald man an der Reihe ist, und erkennt das Ende
//            an der Sprechpause (oder am Knopf „Fertig gesprochen“).
//  • PTT   – virtuelles Funkgerät: Es wird erkannt, solange die Sprechtaste gehalten ist.
// Reihenfolge der Dienste wie im Einzelmodus: Spracherkennung des Geräts/Browsers, sonst offline (Whistle, Vosk).
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import type { PcmAudio } from 'cactus-needle/browser';
import { FunkSender } from './funk-audio';
import { phraseMatches } from './speech-match';
import { VoskStt, isVoskAvailable, voskGrammar } from './vosk-stt';
import { isWhistleSupported, loadWhistle, prefersWhistle, transcribeWithWhistle } from './whistle-stt';

export type SttDienst = 'web' | 'nativ' | 'vosk' | 'whistle' | 'keiner';

const webSR = (): any => (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;

// Fällt die Erkennung des Browsers aus (kein Netz, kein Google-Dienst), bleibt es für diese Sitzung bei offline.
let webAusgefallen = false;
let nativVerfuegbar: boolean | null = null;

/** Welcher Dienst erkennt? `mitFunk`: Das Mikrofon wird gleichzeitig für die Tonübertragung gebraucht. */
export async function sttDienst(mitFunk: boolean): Promise<SttDienst> {
  if (Capacitor.isNativePlatform()) {
    // Mit Tonübertragung hält die App das Mikrofon selbst – erkannt wird dann aus der eigenen Aufnahme.
    if (mitFunk) return isWhistleSupported() ? 'whistle' : 'keiner';
    if (nativVerfuegbar === null) {
      try { nativVerfuegbar = !!(await SpeechRecognition.available())?.available; } catch { nativVerfuegbar = false; }
    }
    if (nativVerfuegbar) return 'nativ';
    return isVoskAvailable() ? 'vosk' : isWhistleSupported() ? 'whistle' : 'keiner';
  }
  if (webSR() && !webAusgefallen && !prefersWhistle()) return 'web';
  return isWhistleSupported() ? 'whistle' : 'keiner';
}

/** Offline-Modell schon vorab laden, damit der erste Funkspruch nicht wartet. */
export function waermeAuf(dienst: SttDienst): void {
  if (dienst === 'whistle') loadWhistle().catch(() => {});
  if (dienst === 'vosk') VoskStt.preload().catch(() => {});
}

/** Welche Kernbegriffe stecken im erkannten Text? */
export function treffer(text: string, kern: string[]): boolean[] {
  return kern.map(k => phraseMatches(text, k));
}

export interface Zuhoeren {
  /** Sprechen ist zu Ende (Knopf bzw. Sprechtaste losgelassen). `aufnahme`: Mitschnitt für die Offline-Erkennung. */
  fertig(aufnahme?: PcmAudio | null): void;
  /** Ohne Ergebnis beenden. */
  abbrechen(): void;
}

interface Optionen {
  dienst: SttDienst;
  /** true: Ende an der Sprechpause erkennen (echte Funkgeräte). */
  auto: boolean;
  /** Muster und Kernbegriffe – helfen der Offline-Erkennung. */
  hinweise: string[];
  /** Alles Nötige gesagt? Dann endet das Zuhören kurz darauf von selbst. */
  vollstaendig?: (text: string) => boolean;
  onZwischen?: (text: string) => void;
  /** Genau einmal: der erkannte Text ('' = nichts verstanden). */
  onText: (text: string) => void;
  onFehler: (meldung: string) => void;
}

const PAUSE_MS = 2200;        // so lange still → Funkspruch zu Ende
const NACH_VOLLSTAENDIG_MS = 900;
const MAX_MS = 45_000;

export function hoereZu(o: Optionen): Zuhoeren {
  let erledigt = false;
  const timer: ReturnType<typeof setTimeout>[] = [];
  const aufraeumen: (() => void)[] = [];
  const ende = (text: string) => {
    if (erledigt) return;
    erledigt = true;
    timer.forEach(clearTimeout);
    aufraeumen.forEach(f => { try { f(); } catch { /* ignore */ } });
    o.onText(text.trim());
  };
  const scheitere = (meldung: string) => {
    if (erledigt) return;
    erledigt = true;
    timer.forEach(clearTimeout);
    aufraeumen.forEach(f => { try { f(); } catch { /* ignore */ } });
    o.onFehler(meldung);
  };
  const abbrechen = () => {
    if (erledigt) return;
    erledigt = true;
    timer.forEach(clearTimeout);
    aufraeumen.forEach(f => { try { f(); } catch { /* ignore */ } });
  };
  const ausAufnahme = async (aufnahme: PcmAudio | null | undefined) => {
    if (!aufnahme || !isWhistleSupported()) { ende(''); return; }
    try { ende(await transcribeWithWhistle(aufnahme, o.hinweise)); } catch { ende(''); }
  };

  // ── Browser (Web Speech API) ──
  if (o.dienst === 'web') {
    let fest = '', zwischen = '';
    let pause: ReturnType<typeof setTimeout> | null = null;
    let neustarts = 0;
    let rec: any = null;
    let fertigGedrueckt = false;
    let aufnahme: PcmAudio | null | undefined;
    const gesamt = () => `${fest} ${zwischen}`.trim();
    const abschluss = () => {
      const text = gesamt();
      // Browser lieferte nichts, es gibt aber einen Mitschnitt (virtuelles Funkgerät) → offline auswerten
      if (!text && aufnahme) { void ausAufnahme(aufnahme); return; }
      ende(text);
    };
    const starte = () => {
      rec = new (webSR())();
      rec.lang = 'de-DE';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e: any) => {
        zwischen = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) fest = `${fest} ${e.results[i][0].transcript}`.trim();
          else zwischen += e.results[i][0].transcript;
        }
        o.onZwischen?.(gesamt());
        if (!o.auto) return;
        if (pause) clearTimeout(pause);
        const warte = o.vollstaendig?.(gesamt()) ? NACH_VOLLSTAENDIG_MS : PAUSE_MS;
        pause = setTimeout(() => { try { rec.stop(); } catch { /* ignore */ } abschluss(); }, warte);
        timer.push(pause);
      };
      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed') scheitere('Mikrofon-Zugriff verweigert. Bitte im Browser erlauben.');
        else if (e.error === 'audio-capture') scheitere('Kein Mikrofon gefunden.');
        else if (e.error === 'network' || e.error === 'service-not-allowed' || e.error === 'language-not-supported') {
          webAusgefallen = true;
          if (aufnahme !== undefined || fertigGedrueckt) abschluss();
          else scheitere('wechsel'); // Aufrufer startet mit dem Offline-Dienst neu
        }
      };
      rec.onend = () => {
        if (erledigt) return;
        if (fertigGedrueckt || gesamt()) { abschluss(); return; }
        // Chrome beendet die Erkennung nach längerer Stille – einfach weiter zuhören
        if (o.auto && neustarts++ < 8) { try { starte(); } catch { scheitere('Spracherkennung konnte nicht gestartet werden.'); } }
        else abschluss();
      };
      rec.start();
    };
    try { starte(); } catch (e: any) { scheitere('Spracherkennung konnte nicht gestartet werden: ' + (e?.message ?? e)); }
    aufraeumen.push(() => { rec.onend = null; rec.onresult = null; rec.onerror = null; try { rec.abort(); } catch { /* ignore */ } });
    timer.push(setTimeout(abschluss, MAX_MS));
    return {
      fertig: a => {
        if (erledigt) return;
        fertigGedrueckt = true;
        aufnahme = a;
        try { rec.stop(); } catch { /* ignore */ }
        // Das letzte Ergebnis kommt kurz nach stop(); kommt nichts mehr, zählt der bisherige Text.
        timer.push(setTimeout(abschluss, 1200));
      },
      abbrechen,
    };
  }

  // ── Android/iOS: Spracherkennung des Geräts – hört bis zur Sprechpause ──
  if (o.dienst === 'nativ') {
    let versuche = 0;
    const starte = async () => {
      try {
        const perm = await SpeechRecognition.requestPermissions();
        if (perm?.speechRecognition !== 'granted') { scheitere('Berechtigung für das Mikrofon fehlt. Bitte in den App-Einstellungen erlauben.'); return; }
        const res: any = await SpeechRecognition.start({ language: 'de-DE', maxResults: 5, partialResults: false, popup: false });
        if (erledigt) return;
        const text = Array.isArray(res?.matches) ? (res.matches[0] ?? '') : '';
        if (text || !o.auto || ++versuche >= 4) ende(text);
        else void starte();
      } catch (e: any) {
        if (erledigt) return;
        if (/denied|permission|not-allowed/i.test(String(e?.message ?? e))) scheitere('Mikrofon-Zugriff verweigert.');
        else if (o.auto && ++versuche < 4) void starte(); // „keine Sprache erkannt“ → weiter zuhören
        else ende('');
      }
    };
    void starte();
    aufraeumen.push(() => { SpeechRecognition.stop().catch(() => {}); });
    return { fertig: () => { SpeechRecognition.stop().catch(() => {}); timer.push(setTimeout(() => ende(''), 2500)); }, abbrechen };
  }

  // ── Android offline (Vosk): läuft, bis „fertig“ kommt ──
  if (o.dienst === 'vosk') {
    let laeuft = false;
    VoskStt.load()
      .then(() => VoskStt.start({ grammar: voskGrammar(o.hinweise) }))
      .then(() => { laeuft = true; })
      .catch((e: any) => scheitere(String(e?.message ?? e)));
    const stop = async () => {
      if (!laeuft) { ende(''); return; }
      laeuft = false;
      try { ende((await VoskStt.stop()).text ?? ''); } catch { ende(''); }
    };
    aufraeumen.push(() => { if (laeuft) VoskStt.stop().catch(() => {}); });
    timer.push(setTimeout(() => void stop(), o.auto ? 20_000 : MAX_MS));
    return { fertig: () => void stop(), abbrechen };
  }

  // ── Offline im Browser (Whistle): aufnehmen, am Ende auswerten ──
  if (o.dienst === 'whistle') {
    // PTT: Die Aufnahme kommt vom Funkgerät (fertig(aufnahme)). Auto: selbst aufnehmen und die Sprechpause am Pegel erkennen.
    if (!o.auto) {
      timer.push(setTimeout(() => ende(''), MAX_MS));
      return { fertig: a => void ausAufnahme(a), abbrechen };
    }
    const sender = new FunkSender();
    let gesprochen = false, stillSeit = 0;
    const stop = () => { if (!erledigt) void ausAufnahme(sender.stop()); };
    sender.start(() => {
      const jetzt = Date.now();
      if (sender.pegel > 0.02) { gesprochen = true; stillSeit = 0; } else if (gesprochen && !stillSeit) stillSeit = jetzt;
      if (gesprochen && stillSeit && jetzt - stillSeit > PAUSE_MS) stop();
    }).catch((e: any) => scheitere(e?.name === 'NotAllowedError' ? 'Mikrofon-Zugriff verweigert. Bitte im Browser erlauben.' : 'Mikrofon konnte nicht gestartet werden.'));
    aufraeumen.push(() => sender.schliesse());
    timer.push(setTimeout(stop, 28_000));
    return { fertig: stop, abbrechen };
  }

  // ── Kein Dienst ──
  timer.push(setTimeout(() => scheitere('keiner'), 0));
  return { fertig: () => {}, abbrechen };
}
