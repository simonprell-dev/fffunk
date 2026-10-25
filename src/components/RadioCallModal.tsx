import { useState, useEffect, useRef } from 'react';
import { Mic, ShieldAlert, ClipboardList, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { WhistleRecorder, isWhistleSupported, loadWhistle, prefersWhistle, transcribeWithWhistle } from '../lib/whistle-stt';
import type { CallSplit } from '../lib/radio-response';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResult: (success: boolean, transcript: string) => void;
  expectedPhrases: string[];
  hint: string;
  feedbackFailure?: string;
  feedbackSuccess?: string;
  briefing?: string;
  mode?: 'guided' | 'training';
  /** Anruf und Nachricht getrennt: erst anrufen, Antwort abwarten, dann sprechen. */
  callSplit?: CallSplit | null;
  /** Funk-Sprachausgabe für die Antwort der Gegenstelle. */
  speak?: (text: string) => Promise<void>;
}

type Status = 'init' | 'ready' | 'recording' | 'done' | 'reveal';
type Phase = 'call' | 'answer' | 'message';
type Engine = 'google' | 'whistle';

// Einmal ausgefallene Google-Erkennung (z. B. kein Netz/Dienst) nicht bei jedem Funkspruch erneut versuchen.
let googleUnavailable = false;

export default function RadioCallModal({ isOpen, onClose, onResult, expectedPhrases, hint, feedbackFailure, feedbackSuccess, briefing, mode = 'guided', callSplit, speak }: Props) {
  const isTraining = mode === 'training';
  const [phase, setPhase] = useState<Phase>(callSplit ? 'call' : 'message');

  const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-zäöüß0-9]+/g, ' ').trim();
  // Anruf: Gegenstelle + eigener Name + „kommen“. Nachricht: ohne den Namen der Gegenstelle.
  const activeExpected = !callSplit
    ? expectedPhrases
    : phase === 'call'
      ? [callSplit.callee, callSplit.caller, 'kommen']
      : expectedPhrases.filter(p =>
          !(normalizeName(callSplit.callee).startsWith(normalizeName(p)) &&
            !normalizeName(callSplit.caller).includes(normalizeName(p))));
  const activeHint = !callSplit ? hint : phase === 'message' ? callSplit.message : callSplit.call;
  const [status, setStatus] = useState<Status>('init');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pressed, setPressed] = useState(false);   // Knopf gedrückt (Piepton oder Aufnahme)
  const [beeping, setBeeping] = useState(false);    // kurzer Freigabe-Piepton läuft
  const [accepted, setAccepted] = useState(false);
  const [engine, setEngine] = useState<Engine>('google');
  const [loadPercent, setLoadPercent] = useState<number | null>(null); // Whistle-Modell lädt
  const [transcribing, setTranscribing] = useState(false);              // Whistle wertet aus
  const [notice, setNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const pressedRef = useRef(false);
  const nativeRef = useRef(false);
  const beepCtxRef = useRef<AudioContext | null>(null);
  const whistleRecRef = useRef<WhistleRecorder | null>(null);
  const silentEndsRef = useRef(0); // Google-Erkennung ohne Ergebnis beendet (in Folge)

  const getSpeechRecognition = () =>
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;

  const requestMicAccess = async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Mikrofon-Zugriff wird in diesem Browser nicht unterstützt. Bitte Chrome oder Edge verwenden.');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (e: any) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Mikrofon-Zugriff verweigert. Bitte im Browser erlauben und erneut versuchen.');
      } else if (e.name === 'NotFoundError') {
        setError('Kein Mikrofon gefunden.');
      } else {
        setError('Mikrofon-Zugriff fehlgeschlagen: ' + (e?.message ?? e));
      }
      return false;
    }
  };

  // ---- Offline-Fallback: Whistle läuft lokal im Browser, ohne Google-Dienste ----
  const prepareWhistle = async () => {
    setEngine('whistle');
    setStatus('init');
    setError(null);
    if (!isWhistleSupported()) {
      setError('Offline-Spracherkennung wird in diesem Browser nicht unterstützt. Bitte Chrome verwenden.');
      return;
    }
    if (!(await requestMicAccess())) return;
    setLoadPercent(0);
    try {
      await loadWhistle(p => setLoadPercent(p));
      setStatus('ready');
    } catch (e: any) {
      setError('Offline-Spracherkennung konnte nicht geladen werden: ' + (e?.message ?? e));
    } finally {
      setLoadPercent(null);
    }
  };

  // Mikrofon direkt beim Öffnen vorbereiten → kein "Funk beginnen"-Knopf nötig.
  const prepareMic = async () => {
    setError(null);
    setStatus('init');
    setEngine('google');

    if (prefersWhistle() || googleUnavailable) {
      await prepareWhistle();
      return;
    }

    // ---- Native (Android/iOS): Geräte-Spracherkennung vorbereiten ----
    if (Capacitor.isNativePlatform()) {
      try {
        const avail = await SpeechRecognition.available();
        if (!avail?.available) {
          await prepareWhistle(); // kein Google-Sprachdienst auf dem Gerät
          return;
        }
        const perm = await SpeechRecognition.requestPermissions();
        if (perm?.speechRecognition !== 'granted') {
          setError('Berechtigung für Spracherkennung/Mikrofon verweigert. Bitte in den App-Einstellungen erlauben.');
          return;
        }
        setStatus('ready');
      } catch (e: any) {
        setError('Spracherkennung konnte nicht vorbereitet werden: ' + (e?.message ?? e));
      }
      return;
    }

    // ---- Web (Web Speech API) ----
    if (!getSpeechRecognition()) {
      if (!window.isSecureContext) {
        setError('Spracherkennung erfordert HTTPS. Bitte über die richtige URL öffnen.');
        return;
      }
      await prepareWhistle(); // z. B. Firefox oder Browser ohne Google-Spracherkennung
      return;
    }
    if (await requestMicAccess()) setStatus('ready');
  };

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setError(null);
      setNotice(null);
      setPressed(false);
      setBeeping(false);
      setAccepted(false);
      setTranscribing(false);
      setPhase(callSplit ? 'call' : 'message');
      pressedRef.current = false;
      prepareMic();
    } else {
      whistleRecRef.current?.release();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (Capacitor.isNativePlatform()) { try { SpeechRecognition.stop(); } catch { /* ignore */ } }
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* ignore */ } }
      if (beepCtxRef.current) { try { beepCtxRef.current.close(); } catch { /* ignore */ } }
      whistleRecRef.current?.release();
    };
  }, []);

  // Kurzer Freigabe-Piepton (wie beim Digitalfunk): erst piepen, dann sprechen.
  const playBeep = () => new Promise<void>((resolve) => {
    try {
      if (!beepCtxRef.current) {
        const Ctx = (window as any).AudioContext ?? (window as any).webkitAudioContext;
        beepCtxRef.current = new Ctx();
      }
      const ctx = beepCtxRef.current!;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.01);
      gain.gain.setValueAtTime(0.22, t0 + 0.10);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.15);
      osc.onended = () => resolve();
      setTimeout(resolve, 220); // Sicherheitsnetz
    } catch { resolve(); }
  });

  const normalizeSpeech = (value: string): string =>
    value
      .toLowerCase()
      .replace(/\b(eins|eine|ein)\b/g, '1')
      .replace(/\bzwei\b/g, '2')
      .replace(/\bdrei\b/g, '3')
      .replace(/\bvier\b/g, '4')
      .replace(/\b(fuenf|fünf)\b/g, '5')
      .replace(/\bsechs\b/g, '6')
      .replace(/\bsieben\b/g, '7')
      .replace(/\bacht\b/g, '8')
      .replace(/\bneun\b/g, '9')
      .replace(/\bnull\b/g, '0')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const phraseMatches = (spokenText: string, phrase: string): boolean => {
    const spoken = normalizeSpeech(spokenText);
    const expected = normalizeSpeech(phrase);
    if (!expected) return false;
    if (spoken.includes(expected)) return true;
    const expectedWords = expected.split(' ').filter(word => word.length > 1);
    if (expectedWords.length <= 1) return spoken.split(' ').includes(expected);
    return expectedWords.every(word => spoken.split(' ').includes(word));
  };

  const isAcceptedTransmission = (spokenText: string): boolean => {
    const relevantPhrases = activeExpected.filter(phrase => normalizeSpeech(phrase).length > 0);
    if (relevantPhrases.length === 0) return true;
    const matches = relevantPhrases.filter(phrase => phraseMatches(spokenText, phrase)).length;
    return matches >= Math.min(relevantPhrases.length, 2);
  };

  // Auswertung des erkannten Texts – gemeinsam für Web und nativ.
  const processTranscript = (text: string) => {
    setTranscript(text);
    setPressed(false);
    pressedRef.current = false;
    recognitionRef.current = null;
    nativeRef.current = false;

    const ok = isAcceptedTransmission(text);

    // Anruf erkannt → Gegenstelle meldet sich, erst danach wird die Nachricht gesprochen.
    if (phase === 'call' && callSplit) {
      // Nachricht gleich mitgesprochen? Dann wurde nicht auf die Gegenstelle gewartet.
      const wordCount = (s: string) => normalizeSpeech(s).split(' ').filter(Boolean).length;
      if (ok && wordCount(text) > wordCount(callSplit.call) + 4) {
        setError(`Erst nur anrufen und warten, bis sich ${callSplit.callee} meldet: „${callSplit.call}“`);
        setStatus('ready');
        return;
      }
      if (!ok) {
        setError(`Anruf nicht erkannt. Erst nur anrufen: „${callSplit.call}“`);
        setStatus('ready');
        return;
      }
      setError(null);
      setPhase('answer');
      setStatus('ready');
      const minDisplay = new Promise(r => setTimeout(r, 1200));
      Promise.all([speak?.(callSplit.answer), minDisplay]).finally(() => {
        setTranscript('');
        setPhase('message');
      });
      return;
    }

    if (isTraining) {
      setAccepted(ok);
      setError(null);
      setStatus('reveal');
      return;
    }

    if (ok) {
      setStatus('done');
      onResult(true, text);
    } else {
      setError(feedbackFailure || `Nicht ganz richtig. Erwartet wird sinngemäß: ${hint}`);
      setStatus('ready');
    }
  };

  const startRecording = async () => {
    setStatus('recording');
    setError(null);
    setNotice(null);

    // ---- Offline (Whistle): Audio aufnehmen, Auswertung beim Loslassen ----
    if (engine === 'whistle') {
      const rec = (whistleRecRef.current ??= new WhistleRecorder());
      rec.start().catch((e: any) => {
        setError('Mikrofon konnte nicht gestartet werden: ' + (e?.message ?? e));
        setStatus('ready'); setPressed(false); pressedRef.current = false;
      });
      return;
    }

    // ---- Native: Geräte-Spracherkennung (Web Speech API gibt es in der WebView nicht) ----
    if (Capacitor.isNativePlatform()) {
      if (nativeRef.current) return;
      nativeRef.current = true;
      try {
        const res: any = await SpeechRecognition.start({ language: 'de-DE', maxResults: 5, partialResults: false, popup: false });
        const text = Array.isArray(res?.matches) ? (res.matches[0] ?? '') : '';
        if (!text) {
          nativeRef.current = false;
          setError('Keine Sprache erkannt. Bitte erneut versuchen.');
          setStatus('ready'); setPressed(false); pressedRef.current = false;
          return;
        }
        processTranscript(text);
      } catch (e: any) {
        nativeRef.current = false;
        const msg = String(e?.message ?? e);
        setError(/denied|permission|not-allowed/i.test(msg)
          ? 'Mikrofon-Zugriff verweigert.'
          : 'Keine Sprache erkannt. Bitte erneut versuchen.');
        setStatus('ready'); setPressed(false); pressedRef.current = false;
      }
      return;
    }

    // ---- Web (Web Speech API) ----
    if (recognitionRef.current) return;
    const SR = getSpeechRecognition();
    if (!SR) {
      setError('Spracherkennung nicht verfügbar.');
      setStatus('ready');
      return;
    }

    const recognizer = new SR();
    recognizer.lang = 'de-DE';
    recognizer.continuous = false;
    recognizer.interimResults = false;

    let handled = false; // Ergebnis oder Fehler erhalten

    const switchToWhistle = () => {
      googleUnavailable = true;
      recognitionRef.current = null;
      setPressed(false);
      pressedRef.current = false;
      prepareWhistle().then(() =>
        setNotice('Google-Spracherkennung nicht erreichbar – Offline-Erkennung ist jetzt aktiv. Bitte den Funkspruch wiederholen.'));
    };

    recognizer.onresult = (event: any) => {
      handled = true;
      silentEndsRef.current = 0;
      processTranscript(event.results[0][0].transcript);
    };

    // Ohne Google-Dienst endet die Erkennung oft still – ohne Ergebnis und ohne Fehler.
    recognizer.onend = () => {
      if (handled) return;
      silentEndsRef.current++;
      if (silentEndsRef.current >= 2) { switchToWhistle(); return; }
      setError('Keine Sprache erkannt. Bitte erneut versuchen.');
      setStatus('ready');
      setPressed(false);
      pressedRef.current = false;
      recognitionRef.current = null;
    };

    recognizer.onerror = (e: any) => {
      handled = true;
      // Google-Dienst nicht erreichbar/nicht vorhanden → auf Offline-Erkennung umschalten.
      if (e.error === 'network' || e.error === 'service-not-allowed' || e.error === 'language-not-supported') {
        switchToWhistle();
        return;
      }
      let msg = 'Spracherkennung fehlgeschlagen';
      if (e.error === 'not-allowed') msg = 'Mikrofon-Zugriff verweigert.';
      else if (e.error === 'no-speech') msg = 'Keine Sprache erkannt. Bitte lauter sprechen.';
      else if (e.error === 'audio-capture') msg = 'Mikrofon nicht gefunden.';
      else if (e.error === 'network') msg = 'Netzwerkfehler. Bitte Verbindung prüfen.';
      setError(msg);
      setStatus('ready');
      setPressed(false);
      pressedRef.current = false;
      recognitionRef.current = null;
    };

    try {
      recognizer.start();
      recognitionRef.current = recognizer;
    } catch (e: any) {
      setError('Start fehlgeschlagen: ' + e.message);
      setStatus('ready');
      setPressed(false);
      pressedRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (engine === 'whistle') {
      setPressed(false);
      const rec = whistleRecRef.current;
      if (!rec) return;
      setTranscribing(true);
      try {
        const audio = await rec.stop();
        if (!audio) { setStatus('ready'); return; } // während des Pieptons losgelassen
        const text = await transcribeWithWhistle(audio, activeExpected);
        if (!text) {
          setError('Keine Sprache erkannt. Bitte erneut versuchen.');
          setStatus('ready');
          return;
        }
        processTranscript(text);
      } catch (e: any) {
        setError('Offline-Spracherkennung fehlgeschlagen: ' + (e?.message ?? e));
        setStatus('ready');
      } finally {
        setTranscribing(false);
      }
      return;
    }
    if (Capacitor.isNativePlatform()) {
      if (nativeRef.current) { SpeechRecognition.stop().catch(() => {}); }
      setPressed(false);
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setPressed(false);
    if (status === 'recording') setStatus('ready');
  };

  // Drücken → erst kurzer Piepton, danach beginnt die Aufnahme (wie beim Funkgerät).
  const handlePointerDown = async (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (status !== 'ready' && status !== 'recording') return;
    if (pressedRef.current || transcribing || phase === 'answer') return; // Gegenstelle spricht
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    pressedRef.current = true;
    setPressed(true);
    setError(null);
    setBeeping(true);
    await playBeep();
    setBeeping(false);
    if (pressedRef.current) {
      startRecording(); // nur sprechen, wenn der Knopf nach dem Piepton noch gehalten wird
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    pressedRef.current = false;
    setPressed(false);
    setBeeping(false);
    stopRecording();
  };

  const handleClose = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    whistleRecRef.current?.release();
    onClose();
  };

  if (!isOpen) return null;

  const pttLabel = phase === 'answer' ? 'GEGENSTELLE SPRICHT …' : transcribing ? 'WIRD AUSGEWERTET …' : beeping ? 'PIEP …' : pressed ? 'SPRECHEN …' : 'HALTEN ZUM SPRECHEN';
  const pttSub = phase === 'answer' ? 'Bitte warten, bis die Gegenstelle fertig ist' : transcribing ? 'Offline-Spracherkennung läuft' : beeping ? 'gleich sprechen' : pressed ? 'Loslassen, wenn fertig' : 'Gedrückt halten – kurzer Piepton, dann sprechen';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 compact:p-0 overflow-y-auto">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 compact:p-2 compact:rounded-none compact:min-h-full compact:border-0 max-w-md w-full shadow-2xl m-auto">
        <div className="flex items-center justify-between mb-6 compact:mb-2">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            {isTraining ? 'Funk-Training' : 'Funk-Gespräch'}
          </h3>
          <button onClick={handleClose} className="text-[#a3a3a3] hover:text-white w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {status !== 'reveal' && (
          isTraining ? (
            <div className="mb-6 p-4 compact:mb-2 compact:p-2 compact:text-sm bg-[#1f2a37] border border-[#2f4256] rounded-lg">
              <div className="text-sm text-[#9db4d0] mb-2 flex items-center gap-2">
                <ClipboardList size={16} /> Melde sinngemäß folgenden Inhalt – formuliere den Funkspruch selbst:
              </div>
              <div className="text-[#e5e5e5] whitespace-pre-line">
                {briefing || 'Formuliere die passende Funkmeldung zur aktuellen Lage.'}
              </div>
              {callSplit && phase === 'call' && (
                <div className="mt-2 text-sm text-amber-300">
                  Zuerst nur {callSplit.callee} anrufen und warten, bis sich die Gegenstelle meldet.
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 p-4 compact:mb-2 compact:p-2 bg-[#262626] border border-[#444] rounded-lg">
              <div className="text-sm text-[#a3a3a3] mb-1 compact:hidden">
                {!callSplit ? 'Sprechen Sie diese Phrase:' : phase === 'message' ? '2. Nachricht durchgeben:' : '1. Anrufen – dann auf Antwort warten:'}
              </div>
              <div className="text-[#e5e5e5] italic text-center text-lg compact:text-sm">„{activeHint}"</div>
            </div>
          )
        )}

        <div className="text-center">
          {status === 'init' && !error && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
              {loadPercent !== null ? (
                <>
                  <div className="text-[#a3a3a3]">Offline-Spracherkennung wird geladen… {loadPercent} %</div>
                  <div className="text-xs text-[#666]">Einmalig ca. 17 MB, danach im Browser gespeichert.</div>
                </>
              ) : (
                <>
                  <div className="text-[#a3a3a3]">Mikrofon wird vorbereitet…</div>
                  <div className="text-xs text-[#666]">Bitte den Zugriff im Browser-Dialog erlauben.</div>
                </>
              )}
            </div>
          )}

          {status === 'init' && error && (
            <button
              onClick={prepareMic}
              className="w-full py-3 bg-[#262626] border border-[#444] hover:bg-[#333] text-white rounded-xl font-semibold"
            >
              Erneut versuchen
            </button>
          )}

          {(status === 'ready' || status === 'recording') && (
            <div className="py-2">
              {transcript && (
                <div className="mb-4 text-left">
                  <div className="text-sm text-[#a3a3a3] mb-2">Erkannt:</div>
                  <div className="p-3 bg-[#262626] border border-[#444] rounded-lg text-[#e5e5e5]">
                    „{transcript}"
                  </div>
                </div>
              )}

              {phase === 'answer' && callSplit && (
                <div className="mb-3 p-4 compact:p-2 rounded-lg border bg-[#1f2a37] border-[#2f4256] text-left">
                  <div className="text-sm text-[#9db4d0] mb-1 flex items-center gap-2">
                    <span className="animate-pulse">📻</span> {callSplit.callee} meldet sich …
                  </div>
                  <div className="text-[#e5e5e5] italic">„{callSplit.answer}“</div>
                </div>
              )}

              {/* PTT button — stays mounted during recording so pointer events fire correctly */}
              <button
                disabled={phase === 'answer'}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full min-h-[180px] compact:min-h-[120px] rounded-xl font-semibold flex flex-col items-center justify-center gap-3 compact:gap-1 transition-all duration-75 select-none touch-none text-white"
                style={{
                  backgroundColor: phase === 'answer' ? '#3f3f46' : pressed ? '#7f1d1d' : '#dc2626',
                  transform: pressed ? 'scale(0.96)' : 'scale(1)',
                  boxShadow: pressed ? 'inset 0 4px 12px rgba(0,0,0,0.5)' : '0 4px 20px rgba(220,38,38,0.3)',
                  cursor: 'pointer',
                }}
              >
                <div className={`rounded-full p-4 compact:p-2 ${beeping ? 'bg-amber-600 animate-pulse' : pressed ? 'bg-red-900 animate-pulse' : 'bg-red-700'}`}>
                  <Mic size={44} className="compact:w-7 compact:h-7" />
                </div>
                <span className="text-xl compact:text-base font-bold">{pttLabel}</span>
                <span className="text-sm opacity-70 compact:hidden">{pttSub}</span>
              </button>

              <div className="mt-3 text-xs text-[#666] text-center compact:hidden">
                Gedrückt halten · nach dem Piepton sprechen · Loslassen zum Senden
              </div>
              {engine === 'whistle' && (
                <div className="mt-1 text-xs text-[#666] text-center">Offline-Spracherkennung aktiv</div>
              )}
              {notice && (
                <div className="mt-3 p-3 text-sm text-amber-300 bg-amber-900/20 border border-amber-700 rounded-lg text-left">
                  {notice}
                </div>
              )}
            </div>
          )}

          {status === 'done' && transcript && (
            <div className="py-4">
              <div className="text-sm text-[#a3a3a3] mb-2">Erkannt:</div>
              <div className="p-4 bg-[#262626] border border-[#444] rounded-lg text-[#e5e5e5] mb-4">
                „{transcript}"
              </div>
              <div className="animate-pulse text-green-400">Wertung…</div>
            </div>
          )}

          {status === 'reveal' && (
            <div className="py-2 text-left">
              <div className="text-sm text-[#a3a3a3] mb-1">Dein Funkspruch:</div>
              <div className="p-3 bg-[#262626] border border-[#444] rounded-lg text-[#e5e5e5] mb-4">
                „{transcript || '—'}"
              </div>

              <div className="mb-4">
                <div className="text-sm text-[#a3a3a3] mb-2">Kernbegriffe:</div>
                <div className="flex flex-wrap gap-2">
                  {activeExpected.map(p => {
                    const hit = phraseMatches(transcript, p);
                    return (
                      <span
                        key={p}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                          hit ? 'bg-green-900/30 text-green-300 border-green-800' : 'bg-[#2a2a2a] text-[#888] border-[#444]'
                        }`}
                      >
                        {hit ? <CheckCircle2 size={12} /> : <XCircle size={12} />}{p}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className={`mb-4 p-3 rounded-lg border ${accepted ? 'bg-green-900/20 border-green-700' : 'bg-amber-900/20 border-amber-700'}`}>
                <div className={`text-sm font-medium ${accepted ? 'text-green-300' : 'text-amber-300'}`}>
                  {accepted
                    ? (feedbackSuccess || '✅ Inhaltlich vollständig.')
                    : (feedbackFailure || '⚠️ Noch nicht vollständig – vergleiche mit dem Muster.')}
                </div>
              </div>

              <div className="mb-4 p-4 bg-[#10240f] border border-green-900 rounded-lg">
                <div className="text-sm text-[#9db09d] mb-1">So lautet der korrekte Funkspruch:</div>
                <div className="text-[#e5e5e5] italic text-lg">„{hint}"</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setStatus('ready'); setTranscript(''); setError(null); setAccepted(false); }}
                  className="flex-1 py-3 rounded-xl font-semibold bg-[#262626] border border-[#444] text-[#e5e5e5] hover:bg-[#333] flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> Nochmal
                </button>
                <button
                  onClick={() => onResult(accepted, transcript)}
                  className="flex-1 py-3 rounded-xl font-semibold bg-[#dc2626] hover:bg-[#b91c1c] text-white flex items-center justify-center gap-2"
                >
                  Weiter <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 text-red-400 p-4 bg-red-900/20 rounded-lg mt-4 text-left">
              <ShieldAlert size={20} className="shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
