import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle2, XCircle, Volume2, RotateCcw, ArrowRight } from 'lucide-react';
import { fehlerQuiz, FehlerQuizItem } from '../lib/fehler-quiz';
import { applyRufnamen } from '../lib/rufnamen';
import { AudioEngine } from '../lib/audio-engine';

interface Props {
  audio: AudioEngine;
  rufnamen?: Record<string, string>;
}

interface Round {
  item: FehlerQuizItem;
  /** Anzeige-Reihenfolge der Optionen (Indizes in item.options). */
  order: number[];
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const newRounds = (): Round[] =>
  shuffle(fehlerQuiz).map(item => ({ item, order: shuffle(item.options.map((_, i) => i)) }));

// „Fehler finden“: fehlerhaften Funkspruch anhören, Fehler erkennen – ohne Mikrofon.
export default function FehlerFindenView({ audio, rufnamen }: Props) {
  const [rounds, setRounds] = useState<Round[]>(newRounds);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const ruf = rufnamen ?? {};

  const round = rounds[index];
  const done = index >= rounds.length;
  const loc = (text: string) => applyRufnamen(text, ruf);
  const spoken = useMemo(() => (round ? loc(round.item.spoken) : ''), // eslint-disable-line react-hooks/exhaustive-deps
    [round, rufnamen]);

  // Funkspruch beim Anzeigen automatisch abspielen; beim Verlassen Ausgabe stoppen.
  useEffect(() => {
    if (spoken) audio.speakRadio(spoken).catch(() => {});
  }, [spoken, audio]);
  useEffect(() => () => audio.stop(), [audio]);

  const pick = (optionIndex: number) => {
    if (picked !== null || !round) return;
    setPicked(optionIndex);
    if (optionIndex === round.item.correct) setScore(s => s + 1);
  };

  const next = () => {
    audio.stop();
    setPicked(null);
    setIndex(i => i + 1);
  };

  const restart = () => {
    audio.stop();
    setRounds(newRounds());
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  if (done) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 compact:p-3 text-center space-y-4">
        <div className="text-4xl">{score === rounds.length ? '🏆' : '📻'}</div>
        <div className="text-xl font-bold">{score} von {rounds.length} Fehlern erkannt</div>
        <p className="text-[#a3a3a3] text-sm">
          {score === rounds.length ? 'Perfekt – du funkst sauber.' : 'Schau dir die Erklärungen im Lernbereich noch einmal an und versuch es erneut.'}
        </p>
        <button onClick={restart} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold">
          <RotateCcw size={16} /> Neue Runde
        </button>
      </div>
    );
  }

  const { item, order } = round;
  const answered = picked !== null;
  const right = picked === item.correct;

  return (
    <div className="space-y-4 compact:space-y-2">
      <div className="flex items-center justify-between text-sm text-[#a3a3a3]">
        <span>Funkspruch {index + 1} von {rounds.length}</span>
        <span className="font-mono text-[#dc2626]">Punkte: {score}</span>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 compact:p-2 space-y-3 compact:space-y-2">
        <p className="text-sm text-[#a3a3a3]">{loc(item.situation)}</p>
        <div className="flex items-start gap-3">
          <button
            onClick={() => audio.speakRadio(spoken).catch(() => {})}
            title="Noch einmal anhören"
            className="shrink-0 w-10 h-10 compact:w-8 compact:h-8 rounded-full bg-[#262626] border border-[#444] hover:bg-[#333] flex items-center justify-center text-[#e5e5e5]"
          >
            <Volume2 size={18} />
          </button>
          <div className="text-lg compact:text-sm italic text-[#e5e5e5]">„{spoken}“</div>
        </div>
      </div>

      <div className="text-sm font-semibold text-[#e5e5e5]">Was ist an diesem Funkspruch falsch?</div>
      <div className="flex flex-col gap-2 compact:gap-1.5">
        {order.map(optionIndex => {
          const isCorrect = optionIndex === item.correct;
          const isPicked = optionIndex === picked;
          const state = !answered ? 'idle' : isCorrect ? 'correct' : isPicked ? 'wrong' : 'other';
          return (
            <button
              key={optionIndex}
              onClick={() => pick(optionIndex)}
              disabled={answered}
              className={`flex items-start gap-2 text-left rounded-lg border px-4 py-3 compact:px-2 compact:py-1.5 compact:text-sm transition-colors ${
                state === 'idle' ? 'bg-[#262626] border-[#444] hover:bg-[#333] text-[#e5e5e5]'
                : state === 'correct' ? 'bg-green-900/30 border-green-700 text-green-200'
                : state === 'wrong' ? 'bg-red-900/30 border-red-700 text-red-200'
                : 'bg-[#1a1a1a] border-[#333] text-[#777]'
              }`}
            >
              {state === 'correct' && <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
              {state === 'wrong' && <XCircle size={18} className="shrink-0 mt-0.5" />}
              <span>{loc(item.options[optionIndex])}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`rounded-lg border p-4 compact:p-2 compact:text-sm space-y-3 ${right ? 'bg-green-900/10 border-green-800' : 'bg-amber-900/10 border-amber-800'}`}>
          <div className={`font-semibold ${right ? 'text-green-300' : 'text-amber-300'}`}>
            {right ? '✅ Richtig erkannt!' : '⚠️ Nicht ganz – der eigentliche Fehler:'}
          </div>
          <div className="text-[#d4d4d4] [&_strong]:text-white">
            <ReactMarkdown>{loc(item.explanation)}</ReactMarkdown>
          </div>
          <div className="flex items-start gap-3 p-3 compact:p-2 bg-[#10240f] border border-green-900 rounded-lg">
            <button
              onClick={() => audio.speakRadio(loc(item.corrected)).catch(() => {})}
              title="Richtige Fassung anhören"
              className="shrink-0 w-8 h-8 rounded-full bg-[#1a2e1a] border border-green-900 hover:bg-[#223a22] flex items-center justify-center text-green-300"
            >
              <Volume2 size={16} />
            </button>
            <div>
              <div className="text-xs text-[#9db09d] mb-0.5">So ist es richtig:</div>
              <div className="italic text-[#e5e5e5]">„{loc(item.corrected)}“</div>
            </div>
          </div>
          <button onClick={next} className="w-full inline-flex items-center justify-center gap-2 py-3 compact:py-2 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold">
            {index + 1 < rounds.length ? <>Nächster Funkspruch <ArrowRight size={16} /></> : 'Auswertung'}
          </button>
        </div>
      )}
    </div>
  );
}
