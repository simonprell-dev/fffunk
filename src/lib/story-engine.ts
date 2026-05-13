import { Scenario, StoryNode, Progress } from '../types/story';

/**
 * StoryEngine – instance per scenario. Manages current node, progress tracking,
 * and navigation through the story graph. Does NOT handle loading scenarios
 * from storage/network – that's done in App.tsx.
 */
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
}
