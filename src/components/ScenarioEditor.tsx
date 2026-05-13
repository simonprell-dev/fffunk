import { useMemo, useState } from 'react';
import { Copy, FileDown, Plus, Save, Trash2, Upload } from 'lucide-react';
import { PlayerRole, Scenario } from '../types/story';
import {
  ScenarioDraft,
  createScenarioFromDraft,
  createSharePackage,
  decodeSharePackage,
  encodeSharePackage,
  slugify,
} from '../lib/community-scenarios';

interface Props {
  onSave: (scenario: Scenario) => void;
  onImport: (scenario: Scenario) => void;
  onClose: () => void;
}

const roleOptions: Array<{ value: PlayerRole; label: string }> = [
  { value: 'gruppenführer_a', label: 'Gruppenführer' },
  { value: 'truppführer', label: 'Truppführer' },
  { value: 'atemschutzüberwachung', label: 'Atemschutzüberwachung' },
  { value: 'einsatzleit', label: 'Einsatzleitung' },
];

const emptyStep = {
  prompt: '',
  expectedPhrases: [''],
  hint: '',
  feedbackFailure: '',
};

function createInitialDraft(): ScenarioDraft {
  return {
    id: '',
    title: '',
    description: '',
    playerRole: 'truppführer',
    authorName: '',
    notifyContact: '',
    steps: [
      {
        prompt: '**Gruppenführer:** Gruppenführer für Wassertrupp.\n\nAntworten Sie korrekt auf den Anruf.',
        expectedPhrases: ['Wassertrupp', 'hört'],
        hint: 'Wassertrupp hört.',
        feedbackFailure: 'Antworten Sie mit Rufname und „hört“.',
      },
      { ...emptyStep },
    ],
  };
}

export default function ScenarioEditor({ onSave, onImport, onClose }: Props) {
  const [draft, setDraft] = useState<ScenarioDraft>(() => createInitialDraft());
  const [savedScenario, setSavedScenario] = useState<Scenario | null>(null);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const sharePackage = useMemo(() => {
    if (!savedScenario) return null;
    return createSharePackage(savedScenario);
  }, [savedScenario]);

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

  const handleSave = () => {
    if (!draft.title.trim()) {
      setMessage('Bitte einen Titel eintragen.');
      return;
    }
    if (!draft.description.trim()) {
      setMessage('Bitte eine kurze Beschreibung eintragen.');
      return;
    }
    if (draft.steps.filter(step => step.prompt.trim() && step.hint.trim()).length === 0) {
      setMessage('Bitte mindestens einen Funk-Schritt anlegen.');
      return;
    }

    const scenario = createScenarioFromDraft({
      ...draft,
      id: draft.id || slugify(draft.title),
    });
    setSavedScenario(scenario);
    onSave(scenario);
    setMessage('Szenario lokal gespeichert. Es ist sofort in der Übersicht spielbar.');
  };

  const copyShareCode = async () => {
    if (!shareCode) return;
    await navigator.clipboard.writeText(shareCode);
    setMessage('Teilencode kopiert. Er kann z.B. per WhatsApp verschickt und hier wieder eingefügt werden.');
  };

  const downloadJson = () => {
    if (!sharePackage) return;
    const blob = new Blob([`${JSON.stringify(sharePackage.scenario, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sharePackage.scenario.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`JSON exportiert. Ziel für PR: ${sharePackage.suggestedPath}`);
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
          notifyContact: parsed.scenario.community?.notifyContact,
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
      setMessage(error instanceof Error ? error.message : 'Import fehlgeschlagen.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Szenario-Editor</h2>
          <p className="text-sm text-[#a3a3a3] mt-1">
            Lokale Szenarien funktionieren sofort auf diesem Gerät. Für Community-PRs exportieren Sie die JSON-Datei in den angegebenen Ordner.
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
          <span className="text-sm text-[#a3a3a3]">Ersteller</span>
          <input value={draft.authorName} onChange={e => setDraft({ ...draft, authorName: e.target.value })} className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm text-[#a3a3a3]">Benachrichtigung bei Merge</span>
          <input value={draft.notifyContact} onChange={e => setDraft({ ...draft, notifyContact: e.target.value })} placeholder="GitHub-Name oder E-Mail, keine Pflicht" className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
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
              <input value={step.expectedPhrases.join(', ')} onChange={e => updateStep(index, { expectedPhrases: e.target.value.split(',') })} className="mt-1 w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2" />
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
        <button onClick={copyShareCode} disabled={!shareCode} className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[#262626] border border-[#444] hover:bg-[#333] disabled:opacity-40">
          <Copy size={18} /> Teilencode kopieren
        </button>
        <button onClick={downloadJson} disabled={!sharePackage} className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[#262626] border border-[#444] hover:bg-[#333] disabled:opacity-40">
          <FileDown size={18} /> JSON für PR
        </button>
      </div>

      {sharePackage && (
        <div className="bg-[#111] border border-[#333] rounded-lg p-4 text-sm space-y-2">
          <div><span className="text-[#a3a3a3]">Community-Pfad:</span> <code>{sharePackage.suggestedPath}</code></div>
          <div><span className="text-[#a3a3a3]">PR-Titel:</span> {sharePackage.prTitle}</div>
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
