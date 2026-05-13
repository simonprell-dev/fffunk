import ReactMarkdown from 'react-markdown';

interface Props {
  narrative: string;
}

export default function NarrativePanel({ narrative }: Props) {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 leading-relaxed shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-1 text-[#dc2626]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        </div>
        <div className="flex-1 prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-0">{children}</p>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
            }}
          >
            {narrative}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
