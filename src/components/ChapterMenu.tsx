import { CheckCircle2, Play } from 'lucide-react';
import type { Chapter } from '../types/story';
import { resumeChapter, type ChapterProgress } from '../lib/chapter-progress';

interface Props {
  chapters: Chapter[];
  progress: ChapterProgress;
  onStart: (chapter: Chapter) => void;
}

// Kapitelauswahl vor Kapitel-Szenarien: „Weiter mit …“ oben, darunter alle Kapitel mit ✓.
export default function ChapterMenu({ chapters, progress, onStart }: Props) {
  const resume = resumeChapter(chapters, progress);
  const number = (c: Chapter) => chapters.indexOf(c) + 1;
  const primary = resume ?? chapters[0];
  const primaryLabel = !resume
    ? `Nochmal von vorn: Kapitel 1`
    : progress.done.length === 0 && !progress.last
      ? `Los geht’s: Kapitel 1`
      : `Weiter mit Kapitel ${number(resume)}: ${resume.title}`;

  return (
    <div className="space-y-4 compact:space-y-2">
      <button
        onClick={() => onStart(primary)}
        className="w-full flex items-center gap-2 px-5 py-3 compact:px-2 compact:py-1.5 compact:text-sm rounded-lg font-semibold text-left bg-[#dc2626] hover:bg-[#b91c1c] text-white min-w-0"
      >
        <Play size={16} className="shrink-0" />
        <span className="truncate">{primaryLabel}</span>
      </button>

      <div className="bg-[#111] border border-[#333] rounded-lg p-2 compact:p-1 min-w-0">
        <div className="px-2 py-2 compact:py-1 text-xs uppercase tracking-wide text-[#777]">Kapitel</div>
        <div className="space-y-1">
          {chapters.map((c, idx) => {
            const done = progress.done.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => onStart(c)}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 compact:px-2 compact:py-1.5 text-left text-sm text-[#d4d4d4] hover:bg-[#262626] min-w-0"
              >
                <span className="text-xs font-mono w-5 shrink-0 text-[#666]">{idx + 1}.</span>
                <span className="truncate flex-1 min-w-0">{c.title}</span>
                {done && <CheckCircle2 size={16} className="shrink-0 text-green-500" aria-label="abgeschlossen" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
