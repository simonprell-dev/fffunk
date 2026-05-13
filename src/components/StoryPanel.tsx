import { memo } from 'react';
import { Radio } from 'lucide-react';
import type { StoryNode } from '@/types/story';

interface Props {
  node: StoryNode;
  isSpeaking: boolean;
  onSpeak: () => void;
}

export const StoryPanel = memo(function StoryPanel({ node, isSpeaking, onSpeak }: Props) {
  const isFeedback = node.narrativeMarkdown?.includes('__FEEDBACK__');
  const cleanNarrative = isFeedback
    ? node.narrativeMarkdown?.replace('__FEEDBACK__', '').trim()
    : node.narrativeMarkdown;

  return (
    <div className={`bg-dark-800 rounded-xl p-6 border ${isFeedback ? 'border-yellow-500' : 'border-dark-600'}`}>
      <div className="flex items-start gap-3 mb-3">
        <Radio className={`w-5 h-5 mt-1 flex-shrink-0 ${isFeedback ? 'text-yellow-500' : 'text-fire-500'}`} />
        <div className="flex-1">
          {isFeedback ? (
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-yellow-500">Rückmeldung</h3>
              <p className="text-dark-200 leading-relaxed whitespace-pre-wrap">{cleanNarrative}</p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">Einsatzleitstelle</h3>
              <div className="text-dark-100 leading-relaxed whitespace-pre-wrap">
                {cleanNarrative}
              </div>
            </>
          )}
        </div>
      </div>

      {!isFeedback && node.narrativeMarkdown && (
        <button
          onClick={onSpeak}
          disabled={isSpeaking}
          className="mt-3 text-sm text-fire-400 hover:text-fire-300 flex items-center gap-1 disabled:opacity-50"
        >
          {isSpeaking ? '🔊 …' : '🔈 Text vorlesen'}
        </button>
      )}
    </div>
  );
});
