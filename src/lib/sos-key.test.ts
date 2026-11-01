import { describe, expect, it } from 'vitest';
import type { Scenario } from '../types/story';
import { handlesSosKey } from './sos-key';

const scenario = (actions: Scenario['nodes'][string]['actions'], chapters?: Scenario['chapters']): Scenario => ({
  id: 's', title: 'S', description: '', startingNodeId: 'n', playerRole: 'rettungsdienst', chapters,
  nodes: { n: { id: 'n', role: 'rettungsdienst', narrative: '', actions } },
});

describe('handlesSosKey', () => {
  it('erkennt Szenarien mit eigener Notruftasten-Aktion', () => {
    expect(handlesSosKey(scenario([{ id: 'a', label: 'Notruf', nextNodeId: 'n', key: 'sos' }]))).toBe(true);
  });

  it('Kapitel-Szenarien werten die Taste selbst aus', () => {
    expect(handlesSosKey(scenario([], [{ id: 'k', title: 'K', startNodeId: 'n', endNodeId: 'n' }]))).toBe(true);
  });

  it('andere Szenarien überlassen die Taste der App', () => {
    expect(handlesSosKey(scenario([{ id: 'a', label: 'Weiter', nextNodeId: 'n' }]))).toBe(false);
    expect(handlesSosKey(null)).toBe(false);
  });
});
