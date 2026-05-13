import { Scenario, StoryNode, Progress } from '../types/story';

export class StoryEngine {
  private scenario: Scenario;
  private currentNodeId: string;
  private history: string[] = [];
  private progress: Progress;
  private startTime: number = 0;

  constructor(scenario: Scenario) {
    this.scenario = scenario;
    this.currentNodeId = scenario.startingNodeId;
    this.startTime = Date.now();

    const saved = this.loadProgress(scenario.id);
    if (saved) {
      this.progress = saved;
    } else {
      this.progress = {
        scenarioId: scenario.id,
        completed: false,
        score: 0,
        nodesVisited: [],
        timestamp: Date.now(),
      };
    }
  }

  getScenario(): Scenario {
    return this.scenario;
  }

  getCurrentNode(): StoryNode {
    return this.scenario.nodes[this.currentNodeId];
  }

  getCurrentNodeId(): string {
    return this.currentNodeId;
  }

  getProgress(): Progress {
    return this.progress;
  }

  goTo(nodeId: string): boolean {
    if (!this.scenario.nodes[nodeId]) {
      console.warn(`Node ${nodeId} not found`);
      return false;
    }
    this.currentNodeId = nodeId;
    this.history.push(nodeId);
    this.progress.nodesVisited.push(nodeId);
    this.saveProgress();
    return true;
  }

  completeNode(scoreDelta: number = 10): void {
    this.progress.score += scoreDelta;
    const node = this.getCurrentNode();
    if (node.id.includes('end') || node.id.includes('complete') || node.id === 'finale') {
      this.progress.completed = true;
    }
    this.saveProgress();
  }

  reset(): void {
    this.currentNodeId = this.scenario.startingNodeId;
    this.history = [];
    this.progress = {
      scenarioId: this.scenario.id,
      completed: false,
      score: 0,
      nodesVisited: [],
      timestamp: Date.now(),
    };
    this.startTime = Date.now();
    this.saveProgress();
  }

  getElapsedSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private saveProgress(): void {
    try {
      const key = `fffunk_progress_${this.scenario.id}`;
      localStorage.setItem(key, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Failed to save progress', e);
    }
  }

  private loadProgress(scenarioId: string): Progress | null {
    try {
      const key = `fffunk_progress_${scenarioId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as Progress;
      }
    } catch (e) {
      console.warn('Failed to load progress', e);
    }
    return null;
  }

  static async loadScenarios(): Promise<Scenario[]> {
    // Try remote scenarios (user-provided)
    try {
      const remoteResp = await fetch('/scenarios/remote.json');
      if (remoteResp.ok) {
        const remote = await remoteResp.json();
        console.log('Loaded remote scenarios from /scenarios/remote.json');
        if (Array.isArray(remote)) return remote as Scenario[];
        if (remote.scenarios) return remote.scenarios as Scenario[];
        return [];
      }
    } catch (e) {
      console.warn('Could not load remote scenarios, falling back to default', e);
    }

    // Fallback: bundled default scenarios (served from public/)
    try {
      const resp = await fetch('/scenarios/default.json');
      if (resp.ok) {
        const data = await resp.json();
        const rawList = Array.isArray(data) ? data : [];
        return rawList.map((item: any) => ({
          ...item,
          playerRole: item.playerRole as any,
        })) as Scenario[];
      }
    } catch (e) {
      console.warn('Could not load default scenarios via fetch', e);
    }

    // Last resort: direct import (works in Vite dev but not always)
    try {
      const module = await import('../data/story_scenarios.json', { assert: { type: 'json' } });
      const rawList = module.default || module;
      return (Array.isArray(rawList) ? rawList : []).map((item: any) => ({
        ...item,
        playerRole: item.playerRole as any,
      })) as Scenario[];
    } catch (e) {
      console.error('Could not load any scenarios', e);
      return [];
    }
  }
}
