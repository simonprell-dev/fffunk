import { useState, useEffect, useRef } from 'react';
import { Mic, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResult: (success: boolean, transcript: string) => void;
  expectedPhrases: string[];
  hint: string;
  feedbackFailure?: string;
}

type Status = 'idle' | 'requesting' | 'countdown' | 'ready' | 'recording' | 'done';

export default function RadioCallModal({ isOpen, onClose, onResult, expectedPhrases, hint, feedbackFailure }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [countdown, setCountdown] = useState(3);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pressed, setPressed] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setCountdown(3);
      setTranscript('');
      setError(null);
      setPressed(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  useEffect(() => {
    if (status !== 'countdown') return;
    let remaining = 3;
    setCountdown(remaining);
    countdownRef.current = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        setStatus('ready');
      }
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status]);

  const getSpeechRecognition = () =>
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;

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

  const handleStart = async () => {
    setError(null);
    setStatus('requesting');

    if (!getSpeechRecognition()) {
      setError(
        !window.isSecureContext
          ? 'Spracherkennung erfordert HTTPS. Bitte öffnen Sie die App über die richtige URL.'
          : 'Web Speech API nicht verfügbar. Bitte Google Chrome verwenden.'
      );
      setStatus('idle');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Mikrofon-Zugriff wird in diesem Browser nicht unterstützt. Bitte Chrome oder Edge verwenden.');
      setStatus('idle');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setStatus('countdown');
    } catch (e: any) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben und Seite neu laden.');
      } else if (e.name === 'NotFoundError') {
        setError('Kein Mikrofon gefunden.');
      } else {
        setError('Mikrofon-Zugriff fehlgeschlagen: ' + e.message);
      }
      setStatus('idle');
    }
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

      if (isAcceptedTransmission(text)) {
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
      recognitionRef.current = null;
    };

    try {
      recognizer.start();
      recognitionRef.current = recognizer;
    } catch (e: any) {
      setError('Start fehlgeschlagen: ' + e.message);
      setStatus('ready');
      setPressed(false);
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

  // Unified pointer handler — works for mouse and touch, with pointer capture
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (status !== 'ready' && status !== 'recording') return;
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    setPressed(true);
    startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    stopRecording();
  };

  const handleClose = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            Funk-Gespräch
          </h3>
          <button onClick={handleClose} className="text-[#a3a3a3] hover:text-white w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <div className="mb-6 p-4 bg-[#262626] border border-[#444] rounded-lg">
          <div className="text-sm text-[#a3a3a3] mb-1">Sprechen Sie diese Phrase:</div>
          <div className="text-[#e5e5e5] italic text-center text-lg">„{hint}"</div>
        </div>

        <div className="text-center">
          {status === 'idle' && (
            <button
              onClick={handleStart}
              className="w-full py-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Mic size={24} />
              Funk beginnen
            </button>
          )}

          {status === 'requesting' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
              <div className="text-[#a3a3a3]">Mikrofon-Zugriff wird angefragt…</div>
              <div className="text-xs text-[#666]">Bitte erlauben Sie den Zugriff im Browser-Dialog.</div>
            </div>
          )}

          {status === 'countdown' && (
            <div className="py-8">
              <div className="text-6xl font-bold text-[#dc2626] mb-2">{countdown}</div>
              <div className="text-[#a3a3a3]">Bereit machen…</div>
            </div>
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
                <div className={`rounded-full p-4 ${pressed ? 'bg-red-900 animate-pulse' : 'bg-red-700'}`}>
                  <Mic size={44} />
                </div>
                <span className="text-xl font-bold">
                  {pressed ? 'SENDET…' : 'HALTEN ZUM SPRECHEN'}
                </span>
                <span className="text-sm opacity-70">
                  {pressed ? 'Loslassen, wenn fertig' : 'Gedrückt halten und sprechen'}
                </span>
              </button>

              <div className="mt-3 text-xs text-[#666] text-center">
                Den Knopf gedrückt halten und sprechen · Loslassen zum Senden
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
