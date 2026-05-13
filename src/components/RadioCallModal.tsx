import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { AudioEngine } from '../lib/audio-engine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResult: (success: boolean, transcript: string) => void;
  expectedPhrases: string[];  // list of acceptable phrases
  hint: string;              // example phrase to show user
  audio: AudioEngine;
}

export default function RadioCallModal({ isOpen, onClose, onResult, expectedPhrases, hint, audio }: Props) {
  const [status, setStatus] = useState<'idle' | 'countdown' | 'ready' | 'recording' | 'processing' | 'done'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Start countdown then get ready
  useEffect(() => {
    if (isOpen && status === 'idle') {
      setStatus('countdown');
      setCountdown(3);
      let remaining = 3;
      countdownRef.current = setInterval(() => {
        remaining--;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(countdownRef.current!);
          setStatus('ready');
        }
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isOpen, status]);

  const startRecording = () => {
    setStatus('recording');
    setError(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Spracherkennung nicht verfügbar (nur Chrome/Edge)');
      setStatus('idle');
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.lang = 'de-DE';
    recognizer.continuous = false;
    recognizer.interimResults = false;

    recognizer.onstart = () => {
      console.log('[PTT] Recognition started');
    };

    recognizer.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('[PTT] Transcribed:', transcript);
      setTranscript(transcript);
      setStatus('done');
      recognitionRef.current = null;

      // Evaluate against expected phrases (case-insensitive substring match)
      const accepted = expectedPhrases.some((phrase: string) =>
        transcript.toLowerCase().includes(phrase.toLowerCase())
      );
      onResult(accepted, transcript);
    };

    recognizer.onerror = (e: any) => {
      console.error('[PTT] Recognition error:', e.error);
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
      setStatus('idle');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    // onresult will handle evaluation
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
          <div className="text-[#e5e5e5] font-radio italic text-center text-lg">„{hint}“</div>
        </div>

        {/* Status & PTT Button */}
        <div className="text-center">
          {status === 'idle' && (
            <button
              onClick={() => setStatus('idle')}
              className="w-full py-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Mic size={24} />
              Funk beginnen
            </button>
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

          {status === 'processing' && (
            <div className="py-8 flex flex-col items-center">
              <Loader2 className="animate-spin text-[#dc2626] mb-4" size={48} />
              <div>Spracherkennung läuft…</div>
            </div>
          )}

          {status === 'done' && transcript && (
            <div className="py-4">
              <div className="text-sm text-[#a3a3a3] mb-2">Erkannt:</div>
              <div className="p-4 bg-[#262626] border border-[#444] rounded-lg font-radio text-[#e5e5e5] mb-4">
                „{transcript}“
              </div>
              <div className="animate-pulse text-green-400">Wertung…</div>
            </div>
          )}

          {error && (
            <div className="text-red-400 p-4 bg-red-900/20 rounded-lg mb-4">{error}</div>
          )}
        </div>

        {/* Hinweis */}
        {status === 'ready' && (
          <div className="mt-4 text-xs text-[#a3a3a3] text-center">
            Drücken Sie den Button und sprechen Sie deutlich. Loslassen, wenn Sie fertig sind.
          </div>
        )}
      </div>
    </div>
  );
}
