import { useEffect, useRef, useState } from 'react';
import { Scenario } from './types/story';
import { StoryEngine } from './lib/story-engine';
import { AudioEngine } from './lib/audio-engine';
import ScenarioList from './components/ScenarioList';
import PracticeScreen from './components/PracticeScreen';
import ScenarioEditor from './components/ScenarioEditor';
import { decodeSharePackage, deleteLocalScenario, loadLocalScenarios, upsertLocalScenario } from './lib/community-scenarios';

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
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [elevenLabsKey, setElevenLabsKey] = useState(() => localStorage.getItem('fffunk_elevenlabs_key') ?? '');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(() => localStorage.getItem('fffunk_elevenlabs_voice_id') ?? '');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash;

      if (hash.startsWith('#import=')) {
        try {
          const code = decodeURIComponent(hash.slice('#import='.length));
          const pkg = decodeSharePackage(code);
          upsertLocalScenario(pkg.scenario);
          setLocalScenarios(loadLocalScenarios());
          window.history.replaceState(null, '', '#scenarios');
        } catch {
          setLoadError('Vorschau-Link konnte nicht geladen werden.');
        }
        setEngine(null);
        setSelectedScenario(null);
        setView('list');
        return;
      }

      if (hash === '#editor') {
        setEngine(null);
        setSelectedScenario(null);
        setView('editor');
        return;
      }

      if (hash === '' || hash === '#scenarios') {
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
    if (!showSettings) return;
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  useEffect(() => {
    localStorage.setItem('fffunk_elevenlabs_key', elevenLabsKey);
    localStorage.setItem('fffunk_elevenlabs_voice_id', elevenLabsVoiceId);
    audio.configure({ apiKey: elevenLabsKey || null, voiceId: elevenLabsVoiceId || undefined });
  }, [audio, elevenLabsKey, elevenLabsVoiceId]);

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

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(s => !s)}
                title="Einstellungen"
                className={`w-8 h-8 flex items-center justify-center rounded hover:bg-[#2a2a2a] transition-colors ${showSettings ? 'bg-[#2a2a2a] text-white' : 'text-[#a3a3a3]'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>

              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-[#2a2a2a]">
                    <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Einstellungen</span>
                  </div>

                  <div className="p-4 flex flex-col gap-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-[#e5e5e5]">Funk-Rauschen</span>
                      <input
                        type="checkbox"
                        checked={radioHissEnabled}
                        onChange={e => setRadioHissEnabled(e.target.checked)}
                        className="accent-[#dc2626] w-4 h-4"
                      />
                    </label>

                    <div className="border-t border-[#2a2a2a] pt-4 flex flex-col gap-3">
                      <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Sprachsynthese (TTS)</span>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[#a3a3a3]">Piper-Server URL</label>
                        <input
                          type="text"
                          placeholder="http://localhost:5000 (leer = Browser-TTS)"
                          value={elevenLabsKey}
                          onChange={e => setElevenLabsKey(e.target.value)}
                          className="bg-[#111] border border-[#444] rounded px-2 py-1.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#dc2626]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[#a3a3a3]">Stimme / Voice</label>
                        <input
                          type="text"
                          placeholder="de_DE-thorsten-medium"
                          value={elevenLabsVoiceId}
                          onChange={e => setElevenLabsVoiceId(e.target.value)}
                          className="bg-[#111] border border-[#444] rounded px-2 py-1.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#dc2626]"
                        />
                      </div>

                      <p className="text-xs text-[#555]">Piper läuft lokal oder auf Railway · kostenlos · bessere Qualität als Browser-TTS</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
