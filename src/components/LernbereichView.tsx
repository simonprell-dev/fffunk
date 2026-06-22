import { useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

// Explizite Dark-Theme-Renderer (kein Tailwind-Typography-Plugin im Projekt).
const mdComponents: Components = {
  h1: ({ children }) => <h2 className="text-xl font-bold text-white mt-6 mb-3">{children}</h2>,
  h2: ({ children }) => <h2 className="text-xl font-bold text-white mt-6 mb-3 pb-1 border-b border-[#2a2a2a]">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-bold text-white mt-5 mb-2">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold text-[#e5e5e5] mt-4 mb-1">{children}</h4>,
  p: ({ children }) => <p className="mb-3 leading-relaxed text-[#d4d4d4]">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1 text-[#d4d4d4] marker:text-[#dc2626]">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-1 text-[#d4d4d4] marker:text-[#dc2626]">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-[#e5e5e5]">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#dc2626] underline hover:text-[#ef4444]">{children}</a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[#dc2626] bg-[#222] rounded-r-lg px-4 py-2 my-3 text-[#cfcfcf] [&>p]:mb-0">{children}</blockquote>
  ),
  hr: () => <hr className="border-[#333] my-5" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-[#333]">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => <th className="border border-[#333] bg-[#222] px-3 py-2 text-left font-semibold text-white">{children}</th>,
  td: ({ children }) => <td className="border border-[#333] px-3 py-2 text-[#d4d4d4] align-top">{children}</td>,
  pre: ({ children }) => (
    <pre className="bg-[#0a0a0a] border border-[#333] rounded-lg p-3 my-3 overflow-x-auto text-sm text-[#e5e5e5] font-mono whitespace-pre">{children}</pre>
  ),
  code: ({ className, children }) => {
    const text = String(children ?? '');
    const isBlock = /language-/.test(className || '') || text.includes('\n');
    if (isBlock) return <code className="font-mono text-sm text-[#e5e5e5]">{children}</code>;
    return <code className="bg-[#0a0a0a] border border-[#333] px-1.5 py-0.5 rounded text-[0.85em] font-mono text-[#e8b4b4]">{children}</code>;
  },
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

        <section className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-sm min-w-0">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#2a2a2a]">
            <span className="text-[#dc2626]"><ActiveIcon size={22} /></span>
            <h3 className="text-xl font-bold">{active.title}</h3>
          </div>
          <div className="max-w-none text-[#d4d4d4]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {body}
            </ReactMarkdown>
          </div>
        </section>
      </div>
    </div>
  );
}
