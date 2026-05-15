import { useMemo, useState } from 'react';
import { Copy, ExternalLink, FileDown, Plus, Save, Trash2, Upload } from 'lucide-react';
import { Action, PlayerRole, Scenario } from '../types/story';
import {
  ScenarioDraft,
  categoryOptions,
  createScenarioFromDraft,
  createSharePackage,
  decodeSharePackage,
  encodeSharePackage,
  slugify,
} from '../lib/community-scenarios';
import { buildShareUrl, publishCommunityScenario } from '../lib/community-api';

interface Props {
  onSave: (scenario: Scenario) => void;
  onImport: (scenario: Scenario) => void;
  onClose: () => void;
  onPublished?: () => void;
  initialScenario?: Scenario;
}

const roleOptions: Array<{ value: PlayerRole; label: string }> = [
  { value: 'gruppenführer_a', label: 'Gruppenführer' },
  { value: 'truppführer', label: 'Truppführer' },
  { value: 'atemschutzüberwachung', label: 'Atemschutzüberwachung' },
  { value: 'einsatzleit', label: 'Einsatzleitung' },
];

const emptyStep = {
  prompt: '',
  expectedPhrases: '',
  hint: '',
  feedbackFailure: '',
};

const KNOWN_CATEGORIES = new Set(['brand', 'thl', 'verkehr', 'wasser', 'funk', 'sonstige']);

function scenarioToDraft(scenario: Scenario): ScenarioDraft {
  const steps: ScenarioDraft['steps'] = [];
  let nodeId: string | undefined = scenario.startingNodeId;

  while (nodeId && nodeId !== '__exit__' && nodeId !== 'n_end') {
    const node: Scenario['nodes'][string] | undefined = scenario.nodes[nodeId];
    if (!node) break;
    const radioAction: Action | undefined = node.actions.find((a: Action) => a.radioCall);
    if (!radioAction?.radioCall) break;
    steps.push({
      prompt: node.narrative || '',
      expectedPhrases: radioAction.radioCall.expectedPhrases.join(', '),
      hint: radioAction.radioCall.hint,
      feedbackFailure: radioAction.radioCall.feedbackFailure || '',
    });
    nodeId = radioAction.radioCall.onSuccess;
  }

  const cat = scenario.community?.category || 'sonstige';
  return {
    id: scenario.id,
    title: scenario.title,
    description: scenario.description,
    playerRole: scenario.playerRole,
    category: KNOWN_CATEGORIES.has(cat) ? cat : 'eigene',
    authorName: scenario.community?.authorName || '',
    steps: steps.length > 0 ? steps : [{ ...emptyStep }],
  };
}

function createInitialDraft(): ScenarioDraft {
  return {
    id: '',
    title: '',
    description: '',
    playerRole: 'truppführer',
    category: 'sonstige',
    authorName: '',
    steps: [
      {
        prompt: '**Gruppenführer:** Gruppenführer für Wassertrupp.\n\nAntworten Sie korrekt auf den Anruf.',
        expectedPhrases: 'Wassertrupp, hört',
        hint: 'Wassertrupp hört.',
        feedbackFailure: 'Antworten Sie mit Rufname und „hört".',
      },
      { ...emptyStep },
    ],
  };
}

export default function ScenarioEditor({ onSave, onImport, onClose, onPublished, initialScenario }: Props) {
  const initDraft = initialScenario ? scenarioToDraft(initialScenario) : createInitialDraft();
  const initCategory = initDraft.category === 'eigene' ? 'eigene' : (initDraft.category || 'sonstige');
  const initCustom = !KNOWN_CATEGORIES.has(initDraft.category) ? (initialScenario?.community?.category || '') : '';

  const [draft, setDraft] = useState<ScenarioDraft>(initDraft);
  const [categoryMode, setCategoryMode] = useState(initCategory);
  const [customCategory, setCustomCategory] = useState(initCustom);
  const [savedScenario, setSavedScenario] = useState<Scenario | null>(initialScenario ?? null);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedShareId, setPublishedShareId] = useState<string | null>(null);

  const currentDraft = useMemo(() => ({
    ...draft,
    category: categoryMode === 'eigene' ? customCategory : categoryMode,
  }), [categoryMode, customCategory, draft]);

  const previewScenario = useMemo(() => {
    if (!draft.title.trim() || !draft.description.trim()) return savedScenario;
    return createScenarioFromDraft({
      ...currentDraft,
      id: draft.id || slugify(draft.title),
    });
  }, [currentDraft, draft.description, draft.id, draft.title, savedScenario]);

  const sharePackage = useMemo(() => {
    if (!previewScenario) return null;
    return createSharePackage(previewScenario);
  }, [previewScenario]);

  const shareCode = useMemo(() => {
    if (!sharePackage) return '';
    return encodeSharePackage(sharePackage);
  }, [sharePackage]);

  const updateStep = (index: number, patch: Partial<ScenarioDraft['steps'][number]>) => {
    setDraft(current => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => stepIndex === index ? { ...step, ...patch } : step),
    }));
  };

  const addStep = () => {
    setDraft(current => ({ ...current, steps: [...current.steps, { ...emptyStep }] }));
  };

  const removeStep = (index: number) => {
    setDraft(current => ({ ...current, steps: current.steps.filter((_, stepIndex) => stepIndex !== index) }));
  };

  const buildScenario = (): Scenario | null => {
    if (!draft.title.trim()) {
      setMessage('Bitte einen Titel eintragen.');
      return null;
    }
    if (!draft.description.trim()) {
      setMessage('Bitte eine kurze Beschreibung eintragen.');
      return null;
    }
    if (categoryMode === 'eigene' && !customCategory.trim()) {
      setMessage('Bitte einen Namen für die eigene Kategorie eintragen.');
      return null;
    }
    if (draft.steps.filter(step => step.prompt.trim() && step.hint.trim()).length === 0) {
      setMessage('Bitte mindestens einen Funk-Schritt anlegen.');
      return null;
    }

    return createScenarioFromDraft({
      ...currentDraft,
      id: draft.id || slugify(draft.title),
    });
  };

  const handleSave = () => {
    const scenario = buildScenario();
    if (!scenario) return;
    setSavedScenario(scenario);
    onSave(scenario);
    setMessage('Szenario lokal gespeichert. Es ist sofort in der Übersicht spielbar.');
  };

  const copyText = async (value: string, success: string) => {
    await navigator.clipboard.writeText(value);
    setMessage(success);
  };

  const copyShareCode = async () => {
    if (!shareCode) return;
    await copyText(shareCode, 'Teilencode kopiert. Er kann z.B. per WhatsApp verschickt und hier wieder eingefügt werden.');
  };

  const downloadJson = () => {
    const scenario = buildScenario();
    if (!scenario) return;
    const pkg = createSharePackage(scenario);
    const blob = new Blob([`${JSON.stringify(pkg.scenario, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pkg.scenario.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSavedScenario(scenario);
    onSave(scenario);
    setMessage(`JSON exportiert. Ziel für PR: ${pkg.suggestedPath}`);
  };

  const publishToCommunity = async () => {
    const scenario = buildScenario();
    if (!scenario) return;

    setPublishing(true);
    setPublishedShareId(null);
    setMessage('Szenario wird veröffentlicht...');

    setSavedScenario(scenario);
    onSave(scenario);

    try {
      const { shareId } = await publishCommunityScenario(scenario);
      setPublishedShareId(shareId);
      setMessage('Szenario veröffentlicht! Teile den Link mit anderen.');
      onPublished?.();
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'API nicht erreichbar.';
      setMessage(`Veröffentlichen fehlgeschlagen: ${detail}`);
    } finally {
      setPublishing(false);
    }
  };

  const importScenario = () => {
    try {
      const trimmed = importText.trim();
      const parsed = trimmed.startsWith('{')
        ? { scenario: JSON.parse(trimmed) as Scenario }
        : decodeSharePackage(trimmed);

      onImport({
        ...parsed.scenario,
        community: {
          authorName: parsed.scenario.community?.authorName || 'Importiert',
          category: parsed.scenario.community?.category || 'sonstige',
          source: 'local',
          status: 'local',
          createdAt: parsed.scenario.community?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          shareId: parsed.scenario.community?.shareId,
        },
      });
      setImportText('');
      setMessage('Szenario importiert und lokal gespeichert.');
    } catch (error) {
      setMessage('Import fehlgeschlagen: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{initialScenario ? 'Szenario bearbeiten' : 'Szenario-Editor'}</h2>
          <p className="text-sm text-[#a3a3a3] mt-1">
            Lokale Szenarien funktionieren sofort. Für Pull Requests wird der passende Community-Ordner aus der Kategorie erzeugt.
          </p>
        </div>
        <button onClick={onClose} className="px-3 py-2 rounded-lg bg-[#262626] border border-[#444] hover:bg-[#333]">
          Übersicht
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-lg border border-[#444] bg-[#1a1a1a] text-sm text-[#e5e5e5]">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-[#a3a3a3]">Titel</span>
          <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-[#a3a3a3]">ID</span>
          <input value={draft.id} onChange={e => setDraft({ ...draft, id: e.target.value })} placeholder="automatisch aus Titel" className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm text-[#a3a3a3]">Beschreibung</span>
          <input value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-[#a3a3a3]">Rolle</span>
          <select value={draft.playerRole} onChange={e => setDraft({ ...draft, playerRole: e.target.value as PlayerRole })} className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2">
            {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-[#a3a3a3]">Kategorie / Ordner</span>
          <select value={categoryMode} onChange={e => setCategoryMode(e.target.value)} className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2">
            {categoryOptions.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
        </label>
        {categoryMode === 'eigene' && (
          <label className="block md:col-span-2">
            <span className="text-sm text-[#a3a3a3]">Eigener Ordnername</span>
            <input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="z.B. gefahrgut" className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
          </label>
        )}
        <label className="block md:col-span-2">
          <span className="text-sm text-[#a3a3a3]">Ersteller</span>
          <input value={draft.authorName} onChange={e => setDraft({ ...draft, authorName: e.target.value })} className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Funk-Schritte</h3>
          <button onClick={addStep} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#262626] border border-[#444] hover:bg-[#333]">
            <Plus size={16} /> Schritt
          </button>
        </div>

        {draft.steps.map((step, index) => (
          <div key={index} className="border border-[#333] bg-[#1a1a1a] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Schritt {index + 1}</div>
              <button onClick={() => removeStep(index)} className="p-2 rounded bg-[#261a1a] text-red-300 hover:bg-red-900/30" title="Schritt löschen">
                <Trash2 size={16} />
              </button>
            </div>
            <label className="block">
              <span className="text-sm text-[#a3a3a3]">Ansage / Lage</span>
              <textarea value={step.prompt} onChange={e => updateStep(index, { prompt: e.target.value })} rows={4} className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-[#a3a3a3]">Erwartete Schlüsselbegriffe, kommagetrennt</span>
              <textarea value={step.expectedPhrases} onChange={e => updateStep(index, { expectedPhrases: e.target.value })} rows={2} placeholder="z.B. Wassertrupp, hört, Verteiler" className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-[#a3a3a3]">Beispiel-Funkspruch</span>
              <input value={step.hint} onChange={e => updateStep(index, { hint: e.target.value })} className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-[#a3a3a3]">Feedback bei falscher Meldung</span>
              <input value={step.feedbackFailure} onChange={e => updateStep(index, { feedbackFailure: e.target.value })} className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={handleSave} className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold">
          <Save size={18} /> Lokal speichern
        </button>
        <button
          onClick={publishToCommunity}
          disabled={publishing}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[#262626] border border-[#444] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ExternalLink size={18} /> {publishing ? 'Wird veröffentlicht...' : 'In Community veröffentlichen'}
        </button>
        <button onClick={copyShareCode} disabled={!shareCode} className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[#262626] border border-[#444] hover:bg-[#333] disabled:opacity-40">
          <Copy size={18} /> Teilencode kopieren
        </button>
        <button onClick={downloadJson} className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[#262626] border border-[#444] hover:bg-[#333]">
          <FileDown size={18} /> JSON herunterladen
        </button>
      </div>

      {publishedShareId && (
        <div className="bg-[#111] border border-[#2d5a27] rounded-lg p-4 text-sm space-y-3">
          <div className="font-semibold text-emerald-400">Szenario veröffentlicht!</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-xs break-all text-[#a3a3a3]">
              {buildShareUrl(publishedShareId)}
            </code>
            <button
              onClick={() => copyText(buildShareUrl(publishedShareId), 'Community-Link kopiert!')}
              className="shrink-0 p-2 rounded-lg bg-[#262626] border border-[#444] hover:bg-[#333]"
              title="Link kopieren"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="border border-[#333] bg-[#1a1a1a] rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-semibold">Szenario importieren</h3>
        <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={5} placeholder="fffunk:... oder JSON einfügen" className="w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
        <button onClick={importScenario} className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[#262626] border border-[#444] hover:bg-[#333]">
          <Upload size={18} /> Importieren
        </button>
      </div>
    </div>
  );
}
