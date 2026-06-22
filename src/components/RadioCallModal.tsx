import { useState, useEffect, useRef } from 'react';
import { Mic, ShieldAlert, ClipboardList, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';

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
}

type Status = 'init' | 'ready' | 'recording' | 'done' | 'reveal';

export default function RadioCallModal({ isOpen, onClose, onResult, expectedPhrases, hint, feedbackFailure, feedbackSuccess, briefing, mode = 'guided' }: Props) {
  const isTraining = mode === 'training';
  const [status, setStatus] = useState<Status>('init');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pressed, setPressed] = useState(false);   // Knopf gedrückt (Piepton oder Aufnahme)
  const [beeping, setBeeping] = useState(false);    // kurzer Freigabe-Piepton läuft
  const [accepted, setAccepted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const pressedRef = useRef(false);
  const beepCtxRef = useRef<AudioContext | null>(null);

  const getSpeechRecognition = () =>
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;

  // Mikrofon direkt beim Öffnen vorbereiten → kein "Funk beginnen"-Knopf nötig.
  const prepareMic = async () => {
    setError(null);
    setStatus('init');
    if (!getSpeechRecognition()) {
      setError(!window.isSecureContext
        ? 'Spracherkennung erfordert HTTPS. Bitte über die richtige URL öffnen.'
        : 'Web Speech API nicht verfügbar. Bitte Google Chrome verwenden.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Mikrofon-Zugriff wird in diesem Browser nicht unterstützt. Bitte Chrome oder Edge verwenden.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setStatus('ready');
    } catch (e: any) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Mikrofon-Zugriff verweigert. Bitte im Browser erlauben und erneut versuchen.');
      } else if (e.name === 'NotFoundError') {
        setError('Kein Mikrofon gefunden.');
      } else {
        setError('Mikrofon-Zugriff fehlgeschlagen: ' + (e?.message ?? e));
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setError(null);
      setPressed(false);
      setBeeping(false);
      setAccepted(false);
      pressedRef.current = false;
      prepareMic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* ignore */ } }
      if (beepCtxRef.current) { try { beepCtxRef.current.close(); } catch { /* ignore */ } }
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
    const relevantPhrases = expectedPhrases.filter(phrase => normalizeSpeech(phrase).length > 0);
    if (relevantPhrases.length === 0) return true;
    const matches = relevantPhrases.filter(phrase => phraseMatches(spokenText, phrase)).length;
    return matches >= Math.min(relevantPhrases.length, 2);
  };

  const startRecording = () => {
    if (recognitionRef.current) return; // already recording
    setStatus('recording');
    setError(null);

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError('Spracherkennung nicht verfügbar.');
      setStatus('ready');
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.lang = 'de-DE';
    recognizer.continuous = false;
    recognizer.interimResults = false;

    recognizer.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      recognitionRef.current = null;
      setPressed(false);
      pressedRef.current = false;

      const ok = isAcceptedTransmission(text);

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

    recognizer.onerror = (e: any) => {
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

  const stopRecording = () => {
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
    if (pressedRef.current) return;
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
    onClose();
  };

  if (!isOpen) return null;

  const pttLabel = beeping ? 'PIEP …' : pressed ? 'SPRECHEN …' : 'HALTEN ZUM SPRECHEN';
  const pttSub = beeping ? 'gleich sprechen' : pressed ? 'Loslassen, wenn fertig' : 'Gedrückt halten – kurzer Piepton, dann sprechen';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            {isTraining ? 'Funk-Training' : 'Funk-Gespräch'}
          </h3>
          <button onClick={handleClose} className="text-[#a3a3a3] hover:text-white w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {status !== 'reveal' && (
          isTraining ? (
            <div className="mb-6 p-4 bg-[#1f2a37] border border-[#2f4256] rounded-lg">
              <div className="text-sm text-[#9db4d0] mb-2 flex items-center gap-2">
                <ClipboardList size={16} /> Melde sinngemäß folgenden Inhalt – formuliere den Funkspruch selbst:
              </div>
              <div className="text-[#e5e5e5] whitespace-pre-line">
                {briefing || 'Formuliere die passende Funkmeldung zur aktuellen Lage.'}
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-[#262626] border border-[#444] rounded-lg">
              <div className="text-sm text-[#a3a3a3] mb-1">Sprechen Sie diese Phrase:</div>
              <div className="text-[#e5e5e5] italic text-center text-lg">„{hint}"</div>
            </div>
          )
        )}

        <div className="text-center">
          {status === 'init' && !error && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
              <div className="text-[#a3a3a3]">Mikrofon wird vorbereitet…</div>
              <div className="text-xs text-[#666]">Bitte den Zugriff im Browser-Dialog erlauben.</div>
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

              {/* PTT button — stays mounted during recording so pointer events fire correctly */}
              <button
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full rounded-xl font-semibold flex flex-col items-center justify-center gap-3 transition-all duration-75 select-none touch-none text-white"
                style={{
                  minHeight: '180px',
                  backgroundColor: pressed ? '#7f1d1d' : '#dc2626',
                  transform: pressed ? 'scale(0.96)' : 'scale(1)',
                  boxShadow: pressed ? 'inset 0 4px 12px rgba(0,0,0,0.5)' : '0 4px 20px rgba(220,38,38,0.3)',
                  cursor: 'pointer',
                }}
              >
                <div className={`rounded-full p-4 ${beeping ? 'bg-amber-600 animate-pulse' : pressed ? 'bg-red-900 animate-pulse' : 'bg-red-700'}`}>
                  <Mic size={44} />
                </div>
                <span className="text-xl font-bold">{pttLabel}</span>
                <span className="text-sm opacity-70">{pttSub}</span>
              </button>

              <div className="mt-3 text-xs text-[#666] text-center">
                Gedrückt halten · nach dem Piepton sprechen · Loslassen zum Senden
              </div>
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
                  {expectedPhrases.map(p => {
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
