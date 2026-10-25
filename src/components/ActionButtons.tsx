import { memo } from 'react';
import { Radio } from 'lucide-react';
import type { Action } from '@/types/story';

interface Props {
  actions: Action[];
  onSelect: (action: Action) => void;
}

export const ActionButtons = memo(function ActionButtons({ actions, onSelect }: Props) {
  return (
    // Kompakt: Knöpfe bleiben am unteren Rand erreichbar, auch bei langem Text
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 compact:gap-1.5 compact:sticky compact:bottom-0 compact:bg-[#0a0a0a] compact:py-1.5">
      {actions.map((action) => {
        const isRadio = !!action.radioCall;
        return (
          <button
            key={action.id}
            onClick={() => onSelect(action)}
            className={`
              flex items-center gap-2 px-5 py-3 compact:px-2 compact:py-1.5 compact:text-sm rounded-lg font-medium text-left transition-all
              ${isRadio
                ? 'bg-fire-600 hover:bg-fire-500 text-white shadow-md hover:shadow-lg'
                : 'bg-dark-700 hover:bg-dark-600 text-gray-200 border border-dark-500'}
              cursor-pointer
            `}
          >
            <Radio className="w-4 h-4 shrink-0 compact:hidden" />
            <span className="flex-1 min-w-0">{action.label}</span>
            {isRadio && <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded shrink-0">🎤</span>}
          </button>
        );
      })}
    </div>
  );
});
