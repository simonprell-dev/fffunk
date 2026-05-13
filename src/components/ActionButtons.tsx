import { memo } from 'react';
import { Radio } from 'lucide-react';
import type { Action } from '@/types/story';

interface Props {
  actions: Action[];
  onSelect: (action: Action) => void;
}

export const ActionButtons = memo(function ActionButtons({ actions, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => {
        const isRadio = !!action.radioCall;
        return (
          <button
            key={action.id}
            onClick={() => onSelect(action)}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all
              ${isRadio
                ? 'bg-fire-600 hover:bg-fire-500 text-white shadow-md hover:shadow-lg'
                : 'bg-dark-700 hover:bg-dark-600 text-gray-200 border border-dark-500'}
              cursor-pointer
            `}
          >
            <Radio className="w-4 h-4" />
            <span>{action.label}</span>
            {isRadio && <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded">🎤</span>}
          </button>
        );
      })}
    </div>
  );
});
