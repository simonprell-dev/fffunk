/**
 * Storage – simple localStorage wrapper for progress
 */

import type { Progress } from '@/types/story';

const PROGRESS_KEY = 'fffunk_progress_v1';

export function loadProgress(): Record<string, Progress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(map: Record<string, Progress>): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
}

export function getScenarioProgress(map: Record<string, Progress>, scenarioId: string): Progress | null {
  return map[scenarioId] || null;
}

export function upsertScenarioProgress(
  map: Record<string, Progress>,
  scenarioId: string,
  updates: Partial<Progress>
): Record<string, Progress> {
  const existing = map[scenarioId] || {
    scenarioId,
    completed: false,
    bestScore: 0,
    history: [],
    timestamp: Date.now()
  };
  const merged = { ...existing, ...updates, timestamp: Date.now() };
  return { ...map, [scenarioId]: merged };
}

export function clearAllProgress(): void {
  localStorage.removeItem(PROGRESS_KEY);
}
