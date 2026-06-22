import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Radio, MessagesSquare, Type, ListOrdered, Tag, ClipboardList,
  AlertTriangle, ShieldCheck, BookOpen, GraduationCap, type LucideIcon,
} from 'lucide-react';
import { lernChapters } from '../lib/lern-content';
import { applyRufnamen } from '../lib/rufnamen';

interface Props {
  rufnamen?: Record<string, string>;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Radio, MessagesSquare, Type, ListOrdered, Tag, ClipboardList,
  AlertTriangle, ShieldCheck, BookOpen, GraduationCap,
};

export default function LernbereichView({ rufnamen }: Props) {
  const [activeId, setActiveId] = useState<string>(lernChapters[0]?.id ?? '');
  const ruf = rufnamen ?? {};
  const active = lernChapters.find(c => c.id === activeId) ?? lernChapters[0];

  if (!active) {
    return <div className="text-[#a3a3a3]">Keine Lerninhalte verfügbar.</div>;
  }

  const ActiveIcon = ICON_MAP[active.icon] ?? BookOpen;
  const body = applyRufnamen(active.body, ruf);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 bg-[#dc2626] rounded-lg flex items-center justify-center text-white">
          <GraduationCap size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Lernbereich</h2>
          <p className="text-[#a3a3a3]">Theorie zum Feuerwehr-Sprechfunk – vom ersten Funkspruch bis zum Mayday.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-4 items-start">
        <aside className="bg-[#111] border border-[#333] rounded-lg p-2">
          <div className="px-2 py-2 text-xs uppercase tracking-wide text-[#777]">Kapitel</div>
          <div className="space-y-1">
            {lernChapters.map((chapter, idx) => {
              const isActive = chapter.id === active.id;
              const Icon = ICON_MAP[chapter.icon] ?? BookOpen;
              return (
                <button
                  key={chapter.id}
                  onClick={() => setActiveId(chapter.id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                    isActive ? 'bg-[#dc2626] text-white' : 'text-[#d4d4d4] hover:bg-[#262626]'
                  }`}
                >
                  <span className={`text-xs font-mono w-5 shrink-0 ${isActive ? 'text-white/80' : 'text-[#666]'}`}>
                    {idx + 1}.
                  </span>
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{chapter.title}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#2a2a2a]">
            <span className="text-[#dc2626]"><ActiveIcon size={22} /></span>
            <h3 className="text-xl font-bold">{active.title}</h3>
          </div>
          <div className="prose prose-invert max-w-none prose-headings:text-white prose-strong:text-white prose-a:text-[#dc2626] prose-table:text-sm">
            <ReactMarkdown>{body}</ReactMarkdown>
          </div>
        </section>
      </div>
    </div>
  );
}
