import { useEffect, useRef, useState } from 'react';
import { ApiScenarioEntry, Scenario } from './types/story';
import { StoryEngine } from './lib/story-engine';
import { AudioEngine } from './lib/audio-engine';
import ScenarioList from './components/ScenarioList';
import PracticeScreen from './components/PracticeScreen';
import ScenarioEditor from './components/ScenarioEditor';
import { decodeSharePackage, deleteLocalScenario, loadLocalScenarios, upsertLocalScenario } from './lib/community-scenarios';
import { fetchCommunityScenarios, fetchCommunityScenario } from './lib/community-api';

interface LicenseData {
  organizationName: string;
  rufnamen: Record<string, string>;
}

type View = 'list' | 'editor' | 'practice';
type ScenarioFolderIndex = {
  builtin?: Record<string, string[]>;
  community?: Record<string, string[]>;
};

function App() {
  const [builtInScenarios, setBuiltInScenarios] = useState<Scenario[]>([]);
  const [localScenarios, setLocalScenarios] = useState<Scenario[]>([]);
  const [licenseScenarios, setLicenseScenarios] = useState<Scenario[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [apiScenarios, setApiScenarios] = useState<ApiScenarioEntry[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [engine, setEngine] = useState<StoryEngine | null>(null);
  const [view, setView] = useState<View>('list');
  const [editScenario, setEditScenario] = useState<Scenario | undefined>();
  const [audio] = useState(() => new AudioEngine());
  const [radioHissEnabled, setRadioHissEnabled] = useState(() => {
    return localStorage.getItem('fffunk_radio_hiss_enabled') !== 'false';
  });
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [licenseCode, setLicenseCode] = useState(() => localStorage.getItem('fffunk_license_code') || '');
  const [licenseInput, setLicenseInput] = useState(() => localStorage.getItem('fffunk_license_code') || '');
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  // Hash routing
  useEffect(() => {
    const applyHash = async () => {
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
        setEngine(null); setSelectedScenario(null); setView('list');
        return;
      }

      if (hash.startsWith('#community=')) {
        const shareId = hash.slice('#community='.length);
        try {
          const entry = await fetchCommunityScenario(shareId);
          if (entry) {
            window.history.replaceState(null, '', '#scenarios');
            startScenario(entry.scenario);
            return;
          }
        } catch { /* ignore */ }
        window.history.replaceState(null, '', '#scenarios');
        setView('list');
        return;
      }

      if (hash === '#editor') {
        setEngine(null); setSelectedScenario(null); setView('editor');
        return;
      }

      if (hash === '' || hash === '#scenarios') {
        setEngine(null); setSelectedScenario(null); setView('list');
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
    if (!licenseCode) { setLicenseData(null); setLicenseScenarios([]); return; }
    fetch(`/api/license/${encodeURIComponent(licenseCode)}`)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error || 'Unbekannter Code')))
      .then(async (data: LicenseData) => {
        setLicenseData(data);
        setLicenseError(null);
        const scenariosRes = await fetch(`/api/license/${encodeURIComponent(licenseCode)}/scenarios`);
        const assignedScenarios: Scenario[] = scenariosRes.ok ? await scenariosRes.json() : [];
        setLicenseScenarios(assignedScenarios.map(scenario => ({
          ...scenario,
          community: {
            authorName: scenario.community?.authorName || data.organizationName,
            category: scenario.community?.category || 'sonstige',
            source: 'license',
            status: scenario.community?.status || 'merged',
            createdAt: scenario.community?.createdAt || new Date().toISOString(),
            updatedAt: scenario.community?.updatedAt || new Date().toISOString(),
            shareId: scenario.community?.shareId,
            thankCount: scenario.community?.thankCount,
          },
        })));
      })
      .catch((e: unknown) => { setLicenseData(null); setLicenseScenarios([]); setLicenseError(String(e)); });
  }, [licenseCode]);

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
    setLocalScenarios(loadLocalScenarios());
  }, []);

  // Load built-in scenarios from index.json
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
        builtinPaths.map(p => loadJson<Scenario>(p.startsWith('/') ? p : `/scenarios/${p}`))
      );
      const community = await Promise.all(
        communityPaths.map(p => loadJson<Scenario>(p.startsWith('/') ? p : `/scenarios/${p}`))
      );

      return [
        ...builtin,
        ...community.map(s => ({
          ...s,
          community: {
            authorName: s.community?.authorName || 'Community',
            category: s.community?.category || 'sonstige',
            source: 'community' as const,
            status: 'merged' as const,
            createdAt: s.community?.createdAt || new Date().toISOString(),
            updatedAt: s.community?.updatedAt || new Date().toISOString(),
            shareId: s.community?.shareId,
          },
        })),
      ];
    };

    loadScenarioFolders()
      .then(setBuiltInScenarios)
      .catch(err => { setLoadError('Fehler beim Laden: ' + err.message); setBuiltInScenarios([]); });
  }, []);

  // Load API community scenarios
  useEffect(() => {
    fetchCommunityScenarios().then(setApiScenarios).catch(() => {});
  }, []);

  useEffect(() => {
    const localIds = new Set(localScenarios.map(s => s.id));
    const licenseIds = new Set(licenseScenarios.map(s => s.id));
    setScenarios([
      ...localScenarios,
      ...licenseScenarios.filter(s => !localIds.has(s.id)),
      ...builtInScenarios.filter(s => !localIds.has(s.id) && !licenseIds.has(s.id)),
    ]);
  }, [builtInScenarios, licenseScenarios, localScenarios]);

  const openList = () => {
    audio.stop();
    setEngine(null); setSelectedScenario(null); setEditScenario(undefined);
    setView('list');
    window.history.replaceState(null, '', '#scenarios');
  };

  const openEditor = (scenario?: Scenario) => {
    audio.stop();
    setEngine(null); setSelectedScenario(null); setEditScenario(scenario);
    setView('editor');
    window.history.replaceState(null, '', '#editor');
  };

  const startScenario = (scenario: Scenario) => {
    const eng = new StoryEngine(scenario);
    setEngine(eng); setSelectedScenario(scenario); setView('practice');
    window.history.replaceState(null, '', '#practice');
  };

  const saveLocalScenario = (scenario: Scenario) => {
    setLocalScenarios(upsertLocalScenario(scenario));
  };

  const removeLocalScenario = (scenarioId: string) => {
    setLocalScenarios(deleteLocalScenario(scenarioId));
  };

  const refreshApiScenarios = () => {
    fetchCommunityScenarios().then(setApiScenarios).catch(() => {});
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
                <a href="#editor" onClick={() => openEditor()} className="text-[#a3a3a3] hover:text-white">Editor</a>
              </>
            )}
            {view === 'practice' && (
              <button onClick={openList} className="text-[#a3a3a3] hover:text-white">Zurück</button>
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
                  <div className="p-4 space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-[#e5e5e5]">Funk-Rauschen</span>
                      <input
                        type="checkbox"
                        checked={radioHissEnabled}
                        onChange={e => setRadioHissEnabled(e.target.checked)}
                        className="accent-[#dc2626] w-4 h-4"
                      />
                    </label>
                    <div className="border-t border-[#2a2a2a] pt-4">
                      <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Wehr-Code</div>
                      {licenseData && (
                        <div className="text-xs text-emerald-400 mb-2 flex items-center gap-1">
                          <span>✓</span>
                          <span className="font-medium">{licenseData.organizationName}</span>
                        </div>
                      )}
                      {licenseError && (
                        <div className="text-xs text-red-400 mb-2">{licenseError}</div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={licenseInput}
                          onChange={e => setLicenseInput(e.target.value.toUpperCase())}
                          placeholder="XXXX-XXXX"
                          className="flex-1 bg-[#111] border border-[#444] rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#dc2626]"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              localStorage.setItem('fffunk_license_code', licenseInput);
                              setLicenseCode(licenseInput);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (!licenseInput) {
                              localStorage.removeItem('fffunk_license_code');
                              setLicenseCode('');
                            } else {
                              localStorage.setItem('fffunk_license_code', licenseInput);
                              setLicenseCode(licenseInput);
                            }
                          }}
                          className="px-2 py-1 text-xs bg-[#262626] border border-[#444] rounded hover:bg-[#333]"
                        >
                          {licenseInput ? 'Übernehmen' : 'Zurücksetzen'}
                        </button>
                      </div>
                      <p className="text-xs text-[#555] mt-1">Code von Ihrer Feuerwehr eingeben</p>
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
          <div className="bg-red-900/20 border border-red-700 text-red-200 p-4 rounded-lg mb-4">{loadError}</div>
        )}

        {view === 'editor' ? (
          <ScenarioEditor
            key={editScenario?.id ?? 'new'}
            onSave={saveLocalScenario}
            onImport={saveLocalScenario}
            onClose={openList}
            onPublished={refreshApiScenarios}
            initialScenario={editScenario}
          />
        ) : view === 'practice' && engine && selectedScenario ? (
          <PracticeScreen scenario={selectedScenario} engine={engine} audio={audio} onExit={openList} rufnamen={licenseData?.rufnamen} />
        ) : !loadError && scenarios.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-[#a3a3a3]">Szenarien werden geladen...</div>
          </div>
        ) : (
          <ScenarioList
            scenarios={scenarios}
            apiScenarios={apiScenarios}
            onSelect={startScenario}
            onCreate={() => openEditor()}
            onDeleteLocal={removeLocalScenario}
            onEditLocal={openEditor}
            onApiScenariosChange={setApiScenarios}
          />
        )}
      </main>

      <footer className="text-center p-4 text-xs text-[#a3a3a3]">
        FFFunk · Community-Szenarien werden auf dem Server gespeichert.
      </footer>
    </div>
  );
}

export default App;
