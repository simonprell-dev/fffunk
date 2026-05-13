import { useEffect, useState } from 'react';
import { Scenario } from './types/story';
import { StoryEngine } from './lib/story-engine';
import { AudioEngine } from './lib/audio-engine';
import ScenarioList from './components/ScenarioList';
import PracticeScreen from './components/PracticeScreen';
import ScenarioEditor from './components/ScenarioEditor';
import { deleteLocalScenario, loadLocalScenarios, upsertLocalScenario } from './lib/community-scenarios';

type View = 'list' | 'editor' | 'practice';
type ScenarioFolderIndex = {
  builtin?: Record<string, string[]>;
  community?: Record<string, string[]>;
};

function App() {
  const [builtInScenarios, setBuiltInScenarios] = useState<Scenario[]>([]);
  const [localScenarios, setLocalScenarios] = useState<Scenario[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [engine, setEngine] = useState<StoryEngine | null>(null);
  const [view, setView] = useState<View>('list');
  const [audio] = useState(() => new AudioEngine());
  const [radioHissEnabled, setRadioHissEnabled] = useState(() => {
    return localStorage.getItem('fffunk_radio_hiss_enabled') !== 'false';
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === '#editor') {
        setEngine(null);
        setSelectedScenario(null);
        setView('editor');
        return;
      }

      if (window.location.hash === '' || window.location.hash === '#scenarios') {
        setEngine(null);
        setSelectedScenario(null);
        setView('list');
      }
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  useEffect(() => {
    audio.setRadioHissEnabled(radioHissEnabled);
    localStorage.setItem('fffunk_radio_hiss_enabled', String(radioHissEnabled));
  }, [audio, radioHissEnabled]);

  useEffect(() => {
    setLocalScenarios(loadLocalScenarios());
  }, []);

  useEffect(() => {
    setLoadError(null);

    const loadJson = async <T,>(url: string): Promise<T> => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json() as Promise<T>;
    };

    const loadScenarioFolders = async (): Promise<Scenario[]> => {
      const index = await loadJson<ScenarioFolderIndex>('/scenarios/index.json');
      const builtinPaths = Object.values(index.builtin ?? {}).flat();
      const communityPaths = Object.values(index.community ?? {}).flat();

      const builtin = await Promise.all(
        builtinPaths.map(path => loadJson<Scenario>(path.startsWith('/') ? path : `/scenarios/${path}`))
      );

      const community = await Promise.all(
        communityPaths.map(path => loadJson<Scenario>(path.startsWith('/') ? path : `/scenarios/${path}`))
      );

      return [
        ...builtin,
        ...community.map(scenario => ({
          ...scenario,
          community: {
            authorName: scenario.community?.authorName || 'Community',
            category: scenario.community?.category || 'sonstige',
            source: 'community' as const,
            status: 'merged' as const,
            createdAt: scenario.community?.createdAt || new Date().toISOString(),
            updatedAt: scenario.community?.updatedAt || new Date().toISOString(),
            shareId: scenario.community?.shareId,
          },
        })),
      ];
    };

    loadScenarioFolders()
      .catch(() => loadJson<unknown>('/scenarios/default.json').then(data => Array.isArray(data) ? data as Scenario[] : []))
      .then((loaded) => {
        setBuiltInScenarios(loaded);
      })
      .catch(err => {
        setLoadError('Fehler beim Laden: ' + err.message);
        setBuiltInScenarios([]);
      });
  }, []);

  useEffect(() => {
    const localIds = new Set(localScenarios.map(scenario => scenario.id));
    setScenarios([
      ...localScenarios,
      ...builtInScenarios.filter(scenario => !localIds.has(scenario.id)),
    ]);
  }, [builtInScenarios, localScenarios]);

  const openList = () => {
    setEngine(null);
    setSelectedScenario(null);
    setView('list');
    window.history.replaceState(null, '', '#scenarios');
  };

  const openEditor = () => {
    setEngine(null);
    setSelectedScenario(null);
    setView('editor');
    window.history.replaceState(null, '', '#editor');
  };

  const startScenario = (scenario: Scenario) => {
    const eng = new StoryEngine(scenario);
    setEngine(eng);
    setSelectedScenario(scenario);
    setView('practice');
    window.history.replaceState(null, '', '#practice');
  };

  const saveLocalScenario = (scenario: Scenario) => {
    setLocalScenarios(upsertLocalScenario(scenario));
  };

  const removeLocalScenario = (scenarioId: string) => {
    setLocalScenarios(deleteLocalScenario(scenarioId));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans">
      <header className="bg-[#1a1a1a] border-b border-[#333] p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <a href="#scenarios" onClick={openList} className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-[#dc2626] rounded flex items-center justify-center font-bold text-white">F</div>
            <h1 className="text-xl font-bold tracking-tight">FFFunk</h1>
            <span className="text-xs text-[#a3a3a3] ml-1 hidden sm:inline">Feuerwehr-Funk-Trainer</span>
          </a>

          <nav className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2 text-[#a3a3a3] hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={radioHissEnabled}
                onChange={event => setRadioHissEnabled(event.target.checked)}
                className="accent-[#dc2626]"
              />
              Rauschen
            </label>

            {view !== 'practice' && (
              <>
                <a href="#scenarios" onClick={openList} className="text-[#a3a3a3] hover:text-white">Szenarien</a>
                <a href="#editor" onClick={openEditor} className="text-[#a3a3a3] hover:text-white">Editor</a>
              </>
            )}

            {view === 'practice' && (
              <button onClick={openList} className="text-[#a3a3a3] hover:text-white">
                Zurück
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4">
        {loadError && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 p-4 rounded-lg mb-4">
            {loadError}
          </div>
        )}

        {view === 'editor' ? (
          <ScenarioEditor
            onSave={saveLocalScenario}
            onImport={saveLocalScenario}
            onClose={openList}
          />
        ) : view === 'practice' && engine && selectedScenario ? (
          <PracticeScreen
            scenario={selectedScenario}
            engine={engine}
            audio={audio}
            onExit={openList}
          />
        ) : !loadError && scenarios.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-[#a3a3a3]">Szenarien werden geladen...</div>
          </div>
        ) : (
          <ScenarioList
            scenarios={scenarios}
            onSelect={startScenario}
            onCreate={openEditor}
            onDeleteLocal={removeLocalScenario}
          />
        )}
      </main>

      <footer className="text-center p-4 text-xs text-[#a3a3a3]">
        FFFunk v0.1 · Community-Szenarien laufen lokal und können per Export geteilt werden.
      </footer>
    </div>
  );
}

export default App;
