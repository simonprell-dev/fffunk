import { describe, expect, it } from 'vitest';
import type { Scenario } from '../types/story';
import { sortFolderScenarios } from './scenario-order';

const sc = (title: string, chapters = false): Scenario => ({
  id: title, title, description: '', startingNodeId: 'n', playerRole: 'truppmann', nodes: {},
  chapters: chapters ? [{ id: 'k', title: 'K', startNodeId: 'n', endNodeId: 'n' }] : undefined,
});

describe('sortFolderScenarios', () => {
  it('stellt Grundausbildungen (Kapitel) an den Anfang, sonst alphabetisch', () => {
    const sorted = sortFolderScenarios([sc('Brand'), sc('THW Grundausbildung Sprechfunk', true), sc('Anmarsch')]);
    expect(sorted.map(s => s.title)).toEqual(['THW Grundausbildung Sprechfunk', 'Anmarsch', 'Brand']);
  });
});
