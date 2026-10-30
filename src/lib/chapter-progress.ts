// Fortschritt in Kapitel-Szenarien (z. B. Grundausbildung): nur auf dem Gerät, ohne Konto.
import type { Chapter } from '../types/story';

export interface ChapterProgress {
  done: string[];
  /** Zuletzt gestartetes Kapitel – Grundlage für „Weiter mit …“. */
  last?: string;
}

const key = (scenarioId: string) => `fffunk_chapters_${scenarioId}`;

export function loadChapterProgress(scenarioId: string): ChapterProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(key(scenarioId)) ?? 'null');
    if (!raw || !Array.isArray(raw.done)) return { done: [] };
    const p: ChapterProgress = { done: raw.done.filter((d: unknown) => typeof d === 'string') };
    if (typeof raw.last === 'string') p.last = raw.last;
    return p;
  } catch {
    return { done: [] };
  }
}

function save(scenarioId: string, p: ChapterProgress): ChapterProgress {
  try {
    localStorage.setItem(key(scenarioId), JSON.stringify(p));
  } catch { /* ohne Speicher geht es weiter, nur ohne ✓ */ }
  return p;
}

export function markChapterStarted(scenarioId: string, chapterId: string): ChapterProgress {
  return save(scenarioId, { ...loadChapterProgress(scenarioId), last: chapterId });
}

export function markChapterDone(scenarioId: string, chapterId: string): ChapterProgress {
  const p = loadChapterProgress(scenarioId);
  const done = p.done.includes(chapterId) ? p.done : [...p.done, chapterId];
  return save(scenarioId, { done, last: chapterId });
}

/** Erstes offenes Kapitel ab dem zuletzt gespielten (inklusive), sonst das erste offene; alles erledigt → null. */
export function resumeChapter(chapters: Chapter[], p: ChapterProgress): Chapter | null {
  const from = Math.max(0, chapters.findIndex(c => c.id === p.last));
  const ordered = [...chapters.slice(from), ...chapters.slice(0, from)];
  return ordered.find(c => !p.done.includes(c.id)) ?? null;
}

export function nextChapter(chapters: Chapter[], chapterId: string): Chapter | null {
  const i = chapters.findIndex(c => c.id === chapterId);
  return i >= 0 ? chapters[i + 1] ?? null : null;
}

export function chapterEndingAt(chapters: Chapter[], nodeId: string): Chapter | null {
  return chapters.find(c => c.endNodeId === nodeId) ?? null;
}
