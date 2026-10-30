import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Chapter } from '../types/story';
import {
  chapterEndingAt, loadChapterProgress, markChapterDone, markChapterStarted, nextChapter, resumeChapter,
} from './chapter-progress';

function memoryStorage(): Storage {
  let data: Record<string, string> = {};
  return {
    get length() { return Object.keys(data).length; },
    key: i => Object.keys(data)[i] ?? null,
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: k => { delete data[k]; },
    clear: () => { data = {}; },
  };
}

const ch: Chapter[] = [
  { id: 'a', title: 'A', startNodeId: 'a_start', endNodeId: 'a_end' },
  { id: 'b', title: 'B', startNodeId: 'b_start', endNodeId: 'b_end' },
  { id: 'c', title: 'C', startNodeId: 'c_start', endNodeId: 'c_end' },
];

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
});

describe('loadChapterProgress', () => {
  it('liefert leeren Fortschritt ohne Speicherinhalt', () => {
    expect(loadChapterProgress('s')).toEqual({ done: [] });
  });

  it('verwirft kaputtes JSON', () => {
    localStorage.setItem('fffunk_chapters_s', 'kaputt');
    expect(loadChapterProgress('s')).toEqual({ done: [] });
  });

  it('verwirft done, das kein Array ist', () => {
    localStorage.setItem('fffunk_chapters_s', '{"done":"x"}');
    expect(loadChapterProgress('s')).toEqual({ done: [] });
  });

  it('wirft nicht, wenn localStorage fehlt', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadChapterProgress('s')).toEqual({ done: [] });
  });
});

describe('markChapterDone / markChapterStarted', () => {
  it('ist idempotent und setzt last', () => {
    markChapterDone('s', 'a');
    const p = markChapterDone('s', 'a');
    expect(p).toEqual({ done: ['a'], last: 'a' });
    expect(loadChapterProgress('s')).toEqual({ done: ['a'], last: 'a' });
  });

  it('wirft nicht, wenn setItem wirft', () => {
    localStorage.setItem = () => { throw new Error('voll'); };
    expect(() => markChapterDone('s', 'a')).not.toThrow();
  });

  it('markChapterStarted setzt nur last', () => {
    markChapterDone('s', 'a');
    expect(markChapterStarted('s', 'b')).toEqual({ done: ['a'], last: 'b' });
  });
});

describe('resumeChapter', () => {
  it('beginnt ohne Fortschritt mit dem ersten Kapitel', () => {
    expect(resumeChapter(ch, { done: [] })?.id).toBe('a');
  });
  it('geht nach dem erledigten letzten Kapitel weiter', () => {
    expect(resumeChapter(ch, { done: ['a'], last: 'a' })?.id).toBe('b');
  });
  it('bleibt beim angefangenen, nicht erledigten Kapitel', () => {
    expect(resumeChapter(ch, { done: [], last: 'b' })?.id).toBe('b');
  });
  it('liefert null, wenn alles erledigt ist', () => {
    expect(resumeChapter(ch, { done: ['a', 'b', 'c'] })).toBeNull();
  });
  it('ignoriert unbekannte Kapitel-IDs', () => {
    expect(resumeChapter(ch, { done: ['zz'], last: 'zz' })?.id).toBe('a');
  });
  it('springt nach dem letzten Kapitel zum ersten offenen zurück', () => {
    expect(resumeChapter(ch, { done: ['b', 'c'], last: 'c' })?.id).toBe('a');
  });
});

describe('nextChapter / chapterEndingAt', () => {
  it('liefert das folgende Kapitel', () => {
    expect(nextChapter(ch, 'a')?.id).toBe('b');
  });
  it('liefert null nach dem letzten Kapitel', () => {
    expect(nextChapter(ch, 'c')).toBeNull();
  });
  it('findet das Kapitel zu einem Endknoten', () => {
    expect(chapterEndingAt(ch, 'b_end')?.id).toBe('b');
  });
  it('liefert null für andere Knoten', () => {
    expect(chapterEndingAt(ch, 'b_start')).toBeNull();
  });
});
