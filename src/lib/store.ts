import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Progress } from '@/types/story';
import { loadProgress, saveProgress, upsertScenarioProgress } from '@/lib/storage';
import allScenarios from '@/data/scenarios.json?raw';

const initialProgress = loadProgress();

interface AppState {
  progress: Record<string, Progress>;
  currentScenarioId: string | null;
  currentNodeId: string | null;
  setCurrentScenario: (id: string) => void;
  advanceNode: (nodeId: string) => void;
  completeScenario: (score: number) => void;
  resetProgress: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      currentScenarioId: null,
      currentNodeId: null,

      setCurrentScenario: (id) => {
        const currentProgress = get().progress[id];
        const history = currentProgress?.history || [];
        const defaultScenario = JSON.parse(allScenarios)[0];
        const startNode = history[history.length - 1] || defaultScenario?.startingNodeId || 'start';
        set({
          currentScenarioId: id,
          currentNodeId: startNode
        });
      },

      advanceNode: (nodeId) => {
        const { currentScenarioId, progress } = get();
        if (!currentScenarioId) return;
        const currentProgress = progress[currentScenarioId];
        const newHistory = [...(currentProgress?.history || []), nodeId];
        set({
          currentNodeId: nodeId,
          progress: upsertScenarioProgress(progress, currentScenarioId, { history: newHistory })
        });
      },

      completeScenario: (score) => {
        const { currentScenarioId, progress } = get();
        if (!currentScenarioId) return;
        const current = progress[currentScenarioId];
        const best = current ? Math.max(current.bestScore, score) : score;
        set({
          progress: upsertScenarioProgress(progress, currentScenarioId, {
            completed: true,
            bestScore: best
          }),
          currentScenarioId: null,
          currentNodeId: null
        });
      },

      resetProgress: () => {
        set({ progress: {}, currentScenarioId: null, currentNodeId: null });
        saveProgress({});
      }
    }),
    {
      name: 'fffunk-storage',
      getStorage: () => localStorage
    }
  )
);
