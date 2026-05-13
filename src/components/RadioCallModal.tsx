import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { AudioEngine } from '../lib/audio-engine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResult: (success: boolean, transcript: string) => void;
  prompt: string;  // expected phrase(s) shown to user
  audio: AudioEngine;
}

export default function RadioCallModal({ isOpen, onClose, onResult, prompt, audio }: Props) {
  const [status, setStatus] = useState<'idle' | 'countdown' | 'recording' | 'processing' | 'done'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown then record
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
          startRecording();
        }
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = async () => {
    setStatus('recording');
    const ok = await audio.startRecording();
    if (!ok) {
      setError('Mikrofon-Zugriff verweigert');
      setStatus('idle');
      return;
    }
    // Auto-stop after 5 seconds
    setTimeout(async () => {
      const blob = await audio.stopRecording();
      if (blob) {
        setStatus('processing');
        try {
          const result = await audio.transcribeLive('de-DE');
          setTranscript(result.text);
          setStatus('done');
          // Simple match: check if any expected phrase is substring
          const expectedList = prompt.split('|');
          const accepted = expectedList.some((phrase) =>
            result.text.toLowerCase().includes(phrase.toLowerCase())
          );
          onResult(accepted, result.text);
        } catch (e: any) {
          setError(e.message || 'Transkription fehlgeschlagen');
          setStatus('idle');
        }
      } else {
        setError('Aufnahme fehlgeschlagen');
        setStatus('idle');
      }
    }, 5000);
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
          <button onClick={onClose} className="text-[#a3a3a3] hover:text-white">✕</button>
        </div>

        {/* Hint */}
        <div className="mb-6 p-4 bg-[#262626] border border-[#444] rounded-lg">
          <div className="text-sm text-[#a3a3a3] mb-1">Erwartet (Beispiel):</div>
          <div className="text-[#e5e5e5] font-radio italic">„{prompt}“</div>
        </div>

        {/* Status */}
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
              <div className="text-[#a3a3a3]">Aufnahme startet in…</div>
            </div>
          )}

          {status === 'recording' && (
            <div className="py-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#dc2626] animate-pulse flex items-center justify-center mb-4">
                <Mic size={40} className="text-white" />
              </div>
              <div className="text-[#e5e5e5] font-mono">Sprechen Sie jetzt…</div>
              <div className="text-sm text-[#a3a3a3] mt-2">5 Sekunden</div>
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
            <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">{error}</div>
          )}
        </div>

        {/* Manual stop */}
        {status === 'recording' && (
          <button
            onClick={async () => {
              if (countdownRef.current) clearInterval(countdownRef.current);
              const blob = await audio.stopRecording();
              // Force process result (same as auto path) – skip for now
            }}
            className="mt-6 w-full py-3 border border-[#333] rounded-lg text-[#a3a3a3] hover:bg-[#262626] flex items-center justify-center gap-2"
          >
            <Square size={18} />
            Vorzeitig beenden
          </button>
        )}
      </div>
    </div>
  );
}
