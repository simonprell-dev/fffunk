import { Scenario, PlayerRole } from '../types/story';

const STORAGE_KEY = 'fffunk_community_scenarios_v1';
const GITHUB_REPO_URL = 'https://github.com/simonprell-dev/fffunk';

export interface ScenarioDraftStep {
  prompt: string;
  expectedPhrases: string;
  hint: string;
  feedbackFailure: string;
}

export interface ScenarioDraft {
  id: string;
  title: string;
  description: string;
  playerRole: PlayerRole;
  category: string;
  authorName: string;
  steps: ScenarioDraftStep[];
}

export interface ScenarioSharePackage {
  format: 'fffunk-community-scenario';
  version: 1;
  scenario: Scenario;
  suggestedPath: string;
  prTitle: string;
  prBody: string;
  publishUrl: string;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const categoryOptions = [
  { value: 'brand', label: 'Brand' },
  { value: 'thl', label: 'THL' },
  { value: 'verkehr', label: 'Verkehr' },
  { value: 'wasser', label: 'Wasseraufbau' },
  { value: 'funk', label: 'Funkgrundlagen' },
  { value: 'sonstige', label: 'Sonstige' },
  { value: 'eigene', label: 'Eigene Kategorie' },
];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'community-szenario';
}

export function getCategoryLabel(category: string): string {
  return categoryOptions.find(option => option.value === category)?.label || category;
}

function parseExpectedPhrases(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map(phrase => phrase.trim())
    .filter(Boolean);
}

function createShareId(id: string): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${id}-${Date.now()}`;
}

export function createScenarioFromDraft(draft: ScenarioDraft): Scenario {
  const now = new Date().toISOString();
  const id = slugify(draft.id || draft.title);
  const category = slugify(draft.category || 'sonstige');
  const steps = draft.steps.filter(step => step.prompt.trim() && step.hint.trim());

  const nodes: Scenario['nodes'] = {};
  steps.forEach((step, index) => {
    const nodeId = `n_step_${index + 1}`;
    const failId = `n_step_${index + 1}_fail`;
    const nextNodeId = index === steps.length - 1 ? 'n_end' : `n_step_${index + 2}`;

    nodes[nodeId] = {
      id: nodeId,
      role: draft.playerRole,
      narrative: step.prompt.trim(),
      actions: [
        {
          id: `radio_step_${index + 1}`,
          label: 'Funk-Meldung sprechen',
          radioCall: {
            expectedPhrases: parseExpectedPhrases(step.expectedPhrases),
            hint: step.hint.trim(),
            onSuccess: nextNodeId,
            onFailure: failId,
            feedbackSuccess: 'Funkmeldung korrekt.',
            feedbackFailure: step.feedbackFailure.trim() || 'Wiederholen Sie die Meldung mit den erwarteten Kernbegriffen.',
          },
        },
      ],
    };

    nodes[failId] = {
      id: failId,
      role: draft.playerRole,
      narrative: `**Feedback:** ${step.feedbackFailure.trim() || 'Die Funkmeldung war noch nicht vollständig.'}\n\nBeispiel: *„${step.hint.trim()}“*`,
      actions: [
        { id: 'retry', label: 'Erneut versuchen', nextNodeId: nodeId },
      ],
    };
  });

  nodes.n_end = {
    id: 'n_end',
    role: draft.playerRole,
    narrative: '**Übung abgeschlossen!**\n\nDas Community-Szenario wurde erfolgreich durchgespielt.',
    actions: [
      { id: 'restart', label: 'Noch einmal trainieren', nextNodeId: steps.length > 0 ? 'n_step_1' : 'n_end' },
      { id: 'exit', label: 'Zur Übersicht', nextNodeId: '__exit__' },
    ],
  };

  return {
    id,
    title: draft.title.trim(),
    description: draft.description.trim(),
    startingNodeId: steps.length > 0 ? 'n_step_1' : 'n_end',
    playerRole: draft.playerRole,
    nodes,
    community: {
      authorName: draft.authorName.trim() || 'Unbekannt',
      category,
      source: 'local',
      status: 'local',
      createdAt: now,
      updatedAt: now,
      shareId: createShareId(id),
    },
  };
}

export function loadLocalScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalScenarios(scenarios: Scenario[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function upsertLocalScenario(scenario: Scenario): Scenario[] {
  const local = loadLocalScenarios();
  const next = [
    scenario,
    ...local.filter(item => item.id !== scenario.id),
  ];
  saveLocalScenarios(next);
  return next;
}

export function deleteLocalScenario(id: string): Scenario[] {
  const next = loadLocalScenarios().filter(item => item.id !== id);
  saveLocalScenarios(next);
  return next;
}

export function createSharePackage(scenario: Scenario): ScenarioSharePackage {
  const safeId = slugify(scenario.id);
  const category = slugify(scenario.community?.category || 'sonstige');
  const suggestedPath = `public/scenarios/community/${category}/${safeId}.json`;
  const encodedPath = suggestedPath.split('/').map(encodeURIComponent).join('/');

  return {
    format: 'fffunk-community-scenario',
    version: 1,
    scenario,
    suggestedPath,
    publishUrl: `${GITHUB_REPO_URL}/new/main?filename=${encodedPath}`,
    prTitle: `Community-Szenario: ${scenario.title}`,
    prBody: [
      `## Szenario`,
      scenario.title,
      '',
      `## Ersteller`,
      scenario.community?.authorName || 'Unbekannt',
      '',
      `## Kategorie`,
      category,
      '',
      `## Datei`,
      suggestedPath,
    ].join('\n'),
  };
}

export function encodeSharePackage(pkg: ScenarioSharePackage): string {
  const bytes = textEncoder.encode(JSON.stringify(pkg));
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return `fffunk:${btoa(binary)}`;
}

export function decodeSharePackage(value: string): ScenarioSharePackage {
  const trimmed = value.trim();
  const payload = trimmed.startsWith('fffunk:') ? trimmed.slice('fffunk:'.length) : trimmed;
  const binary = atob(payload);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  const parsed = JSON.parse(textDecoder.decode(bytes));

  if (parsed?.format !== 'fffunk-community-scenario' || parsed?.version !== 1 || !parsed?.scenario) {
    throw new Error('Ungültiges FFFunk-Szenarioformat.');
  }

  return parsed;
}
