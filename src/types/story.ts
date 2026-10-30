export type PlayerRole =
  | 'gruppenführer_a'
  | 'gruppenführer_b'
  | 'gruppenführer_c'
  | 'gruppenführer_d'
  | 'gruppenführer_e'
  | 'gruppenführer_f'
  | 'truppführer'
  | 'truppmann'
  | 'atemschutzüberwachung'
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
  /** 'sos': die Notruftaste des Funkgeräts löst diese Aktion ebenfalls aus. */
  key?: 'sos';
}

export interface RadioCall {
  expectedPhrases: string[];
  hint: string;
  /** Nur der Inhalt der Meldung (was zu melden ist) – für den Trainingsmodus,
   *  in dem der fertige Funkspruch (hint) erst nach dem Versuch aufgedeckt wird. */
  briefing?: string;
  onSuccess: string;
  onFailure: string;
  allowPartial?: boolean;
  feedbackSuccess?: string;
  feedbackFailure?: string;
  /** Antwort der angefunkten Stelle nach Erfolg, bevor der nächste Schritt erscheint.
   *  Fehlt sie, wird sie aus dem nächsten Schritt bzw. dem Anruf abgeleitet; "" = keine Antwort. */
  response?: string;
}

/** Einzeln startbarer Abschnitt eines Szenarios (z. B. Grundausbildung). */
export interface Chapter {
  id: string;
  title: string;
  startNodeId: string;
  /** Erreichen dieses Knotens schließt das Kapitel ab. */
  endNodeId: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  startingNodeId: string;
  playerRole: PlayerRole;
  nodes: Record<string, StoryNode>;
  /** Gesetzt → statt der Geschichte erscheint zuerst die Kapitelauswahl. */
  chapters?: Chapter[];
  /** Ordner der eingebauten Szenarien (Schlüssel aus public/scenarios/index.json). */
  category?: string;
  community?: CommunityScenarioMeta;
}

export interface CommunityScenarioMeta {
  authorName: string;
  category?: string;
  source?: 'local' | 'community' | 'community-api' | 'license';
  status?: 'local' | 'submitted' | 'merged';
  createdAt: string;
  updatedAt: string;
  shareId?: string;
  thankCount?: number;
}

export interface ApiScenarioEntry {
  shareId: string;
  id: string;
  title: string;
  description: string;
  authorName: string;
  category: string;
  thankCount: number;
  publishedAt: string;
  scenario: Scenario;
}

export interface Transcription {
  text: string;
  confidence?: number;
  language?: string;
}

export interface Progress {
  scenarioId: string;
  completed: boolean;
  score: number;
  bestScore?: number;
  bestTimeMs?: number;
  nodesVisited: string[];
  history?: any[];
  timestamp: number;
}
