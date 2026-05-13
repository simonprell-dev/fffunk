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

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  // Reset state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setCountdown(3);
      setTranscript('');
      setError(null);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Run countdown when status transitions to 'countdown'
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
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const phraseMatches = (spokenText: string, phrase: string): boolean => {
    const spoken = normalizeSpeech(spokenText);
    const expected = normalizeSpeech(phrase);
    if (!expected) return false;

    if (spoken.includes(expected)) return true;

    const expectedWords = expected.split(' ').filter(word => word.length > 1);
    if (expectedWords.length <= 1) {
      return spoken.split(' ').includes(expected);
    }

    return expectedWords.every(word => spoken.split(' ').includes(word));
  };

  const isAcceptedTransmission = (spokenText: string): boolean => {
    const relevantPhrases = expectedPhrases.filter(phrase => normalizeSpeech(phrase).length > 0);
    if (relevantPhrases.length === 0) return true;

    const matches = relevantPhrases.filter(phrase => phraseMatches(spokenText, phrase)).length;
    const requiredMatches = Math.min(relevantPhrases.length, 2);

    return matches >= requiredMatches;
  };

  const handleStart = async () => {
    setError(null);
    setStatus('requesting');

    // Check Speech Recognition API availability first
    if (!getSpeechRecognition()) {
      if (!window.isSecureContext) {
        setError('Spracherkennung erfordert HTTPS oder localhost. Bitte öffnen Sie die App über localhost statt über eine IP-Adresse.');
      } else {
        setError(
          'Web Speech API nicht gefunden. Mögliche Ursachen: (1) Sie verwenden Chromium ohne Google-Dienste, (2) die API wurde über chrome://flags deaktiviert. Bitte nutzen Sie Google Chrome.'
        );
      }
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
      // Permission granted — release stream immediately, SpeechRecognition handles it
      stream.getTracks().forEach(t => t.stop());
      setStatus('countdown');
    } catch (e: any) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError(
          'Mikrofon-Zugriff verweigert. Bitte klicken Sie auf das Schloss-Symbol in der Adressleiste und erlauben Sie den Mikrofon-Zugriff, dann laden Sie die Seite neu.'
        );
      } else if (e.name === 'NotFoundError') {
        setError('Kein Mikrofon gefunden. Bitte schließen Sie ein Mikrofon an und versuchen Sie es erneut.');
      } else {
        setError('Mikrofon-Zugriff fehlgeschlagen: ' + e.message);
      }
      setStatus('idle');
    }
  };

  const startRecording = () => {
    setStatus('recording');
    setError(null);

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError('Spracherkennung nicht verfügbar. Bitte laden Sie die Seite neu.');
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

      const accepted = isAcceptedTransmission(text);
      if (accepted) {
        setStatus('done');
        onResult(true, text);
        return;
      }

      setError(feedbackFailure || `Nicht ganz richtig. Erwartet wird sinngemäß: ${hint}`);
      setStatus('ready');
    };

    recognizer.onerror = (e: any) => {
      let msg = 'Spracherkennung fehlgeschlagen';
      if (e.error === 'not-allowed') {
        msg = 'Mikrofon-Zugriff verweigert. Bitte erlauben Sie Mikrofon-Zugriff in den Browser-Einstellungen.';
      } else if (e.error === 'no-speech') {
        msg = 'Keine Sprache erkannt. Bitte lauter und deutlicher sprechen.';
      } else if (e.error === 'audio-capture') {
        msg = 'Mikrofon nicht gefunden. Bitte prüfen Sie Ihre Audio-Einstellungen.';
      } else if (e.error === 'network') {
        msg = 'Netzwerkfehler bei der Spracherkennung. Bitte Internetverbindung prüfen.';
      }
      setError(msg);
      setStatus('ready');
      recognitionRef.current = null;
    };

    try {
      recognizer.start();
      recognitionRef.current = recognizer;
    } catch (e: any) {
      setError('Start fehlgeschlagen: ' + e.message);
      setStatus('ready');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  const handleClose = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-[#dc2626]">📻</span> Funk-Gespräch
          </h3>
          <button onClick={handleClose} className="text-[#a3a3a3] hover:text-white">✕</button>
        </div>

        {/* Hint */}
        <div className="mb-6 p-4 bg-[#262626] border border-[#444] rounded-lg">
          <div className="text-sm text-[#a3a3a3] mb-1">Sprechen Sie diese Phrase:</div>
          <div className="text-[#e5e5e5] font-radio italic text-center text-lg">„{hint}"</div>
        </div>

        {/* Status & PTT Button */}
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

          {status === 'ready' && (
            <div className="py-4">
              <div className="mb-4 text-[#e5e5e5] font-mono">Bereit zum Senden</div>
              {transcript && (
                <div className="mb-4 text-left">
                  <div className="text-sm text-[#a3a3a3] mb-2">Erkannt:</div>
                  <div className="p-3 bg-[#262626] border border-[#444] rounded-lg font-radio text-[#e5e5e5]">
                    „{transcript}"
                  </div>
                </div>
              )}
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className="w-full py-8 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl font-semibold flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ minHeight: '160px' }}
              >
                <Mic size={48} />
                <span className="text-xl">GEDRÜCKT HALTEN ZUM SPRECHEN</span>
                <span className="text-sm opacity-75">Loslassen, wenn fertig</span>
              </button>
            </div>
          )}

          {status === 'recording' && (
            <div className="py-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#dc2626] animate-pulse flex items-center justify-center mb-4">
                <Mic size={40} className="text-white" />
              </div>
              <div className="text-[#e5e5e5] font-mono animate-pulse">SENDEN…</div>
              <div className="text-sm text-[#a3a3a3] mt-2">Loslassen, um zu senden</div>
            </div>
          )}

          {status === 'done' && transcript && (
            <div className="py-4">
              <div className="text-sm text-[#a3a3a3] mb-2">Erkannt:</div>
              <div className="p-4 bg-[#262626] border border-[#444] rounded-lg font-radio text-[#e5e5e5] mb-4">
                „{transcript}"
              </div>
              <div className="animate-pulse text-green-400">Wertung…</div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 text-red-400 p-4 bg-red-900/20 rounded-lg mb-4 text-left">
              <ShieldAlert size={20} className="shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {status === 'ready' && (
          <div className="mt-4 text-xs text-[#a3a3a3] text-center">
            Drücken Sie den Button und sprechen Sie deutlich. Loslassen, wenn Sie fertig sind.
          </div>
        )}
      </div>
    </div>
  );
}
