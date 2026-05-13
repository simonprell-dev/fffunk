export type PlayerRole =
  | 'gruppenführer_a'
  | 'gruppenführer_b'
  | 'gruppenführer_c'
  | 'gruppenführer_d'
  | 'gruppenführer_e'
  | 'gruppenführer_f'
  | 'einsatzleit';

export interface StoryNode {
  id: string;
  role: PlayerRole;
  narrative: string;
  narrativeMarkdown?: string;
  actions: Action[];
}

export interface Action {
  id: string;
  label: string;
  icon?: string;
  nextNodeId?: string;
  radioCall?: RadioCall;
  auto?: boolean;
}

export interface RadioCall {
  expectedPhrases: string[];
  hint: string;
  onSuccess: string;
  onFailure: string;
  allowPartial?: boolean;
  feedbackSuccess?: string;
  feedbackFailure?: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  startingNodeId: string;
  playerRole: PlayerRole;
  nodes: Record<string, StoryNode>;
}

export interface Transcription {
  text: string;
  confidence?: number;
  language?: string;
}

export interface Progress {
  scenarioId: string;
  completed: boolean;
  bestScore: number;
  history: string[];
  timestamp: number;
}
