import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Progress } from '@/types/story';
import { loadProgress, saveProgress, upsertScenarioProgress } from '@/lib/storage';

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
        const visited = currentProgress?.nodesVisited || [];
        // We'll need to read the scenario's startingNodeId from somewhere; for now skip
        set({
          currentScenarioId: id,
          currentNodeId: null // let caller set it
        });
      },

      advanceNode: (nodeId) => {
        const { currentScenarioId, progress } = get();
        if (!currentScenarioId) return;
        const currentProgress = progress[currentScenarioId];
        const newVisited = [...(currentProgress?.nodesVisited || []), nodeId];
        set({
          currentNodeId: nodeId,
          progress: upsertScenarioProgress(progress, currentScenarioId, { nodesVisited: newVisited })
        });
      },

      completeScenario: (score) => {
        const { currentScenarioId, progress } = get();
        if (!currentScenarioId) return;
        const current = progress[currentScenarioId];
        const best = current ? Math.max(current.bestScore ?? 0, score) : score;
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
