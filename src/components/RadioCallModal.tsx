import { useState, useEffect, useRef } from 'react';
import { Mic, StopCircle, Loader2 } from 'lucide-react';
import { RadioDispatcherTTS } from '@/lib/radio-tts';

interface Props {
  isOpen: boolean;
  hint: string;
  onRecord: () => Promise<void>;
  onCancel: () => void;
  isRecording: boolean;
}

export function RadioCallModal({ isOpen, hint, onRecord, onCancel, isRecording }: Props) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const tts = new RadioDispatcherTTS();
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (isOpen && !hasSpoken.current) {
      hasSpoken.current = true;
      tts.speak(hint, { mode: 'dispatch', pitch: 0.9 }).then(() => {
        setTimeout(() => onRecord(), 500);
      });
    }
    if (!isOpen) {
      hasSpoken.current = false;
    }
  }, [isOpen, hint, onRecord]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-800 border border-fire-500 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isRecording ? 'bg-fire-500 animate-radio-pulse' : 'bg-dark-600'}`}>
            {isRecording ? (
              <Mic className="w-10 h-10 text-white" />
            ) : (
              <Loader2 className="w-8 h-8 text-fire-400 animate-spin" />
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2">
          {isRecording ? 'Aufnahme läuft…' : 'Vorbereitung…'}
        </h3>

        <p className="text-dark-300 mb-6 text-sm">
          {isRecording ? 'Sprechen Sie jetzt deutlich in Ihr Mikrofon.' : 'Bitte warten…'}
        </p>

        {isRecording && (
          <button
            onClick={onCancel}
            className="w-full py-3 bg-dark-700 hover:bg-red-900/30 text-red-400 rounded-lg border border-red-900/50 flex items-center justify-center gap-2"
          >
            <StopCircle className="w-5 h-5" />
            Aufnahme abbrechen
          </button>
        )}
      </div>
    </div>
  );
}
