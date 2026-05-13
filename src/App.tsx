import { useState, useEffect } from 'react';
import { Scenario } from './types/story';
import { StoryEngine } from './lib/story-engine';
import { AudioEngine } from './lib/audio-engine';
import ScenarioList from './components/ScenarioList';
import PracticeScreen from './components/PracticeScreen';

function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [engine, setEngine] = useState<StoryEngine | null>(null);
  const [audio] = useState(() => new AudioEngine());

  // Load scenarios on mount – use fetch only (no dynamic import)
  useEffect(() => {
    console.log('[App] Mount: Loading scenarios...');
    fetch('/scenarios/default.json')
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((data: any[]) => {
        console.log('[App] Fetched scenarios:', data.length);
        // Cast playerRole safely
        const casted = data.map((s: any) => ({
          ...s,
          playerRole: s.playerRole as any,
        }));
        setScenarios(casted);
      })
      .catch(err => {
        console.error('[App] Fetch failed:', err);
        // Fallback: empty array
        setScenarios([]);
      });
  }, []);

  const startScenario = (scenario: Scenario) => {
    const eng = new StoryEngine(scenario);
    setEngine(eng);
    setSelectedScenario(scenario);
  };

  const exitScenario = () => {
    setEngine(null);
    setSelectedScenario(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#333] p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#dc2626] rounded flex items-center justify-center font-bold text-white">F</div>
            <h1 className="text-xl font-bold tracking-tight">FFFunk</h1>
            <span className="text-xs text-[#a3a3a3] ml-1">Feuerwehr-Funk-Trainer</span>
          </div>
          {engine && (
            <button onClick={exitScenario} className="text-sm text-[#a3a3a3] hover:text-white">
              ← Zurück zur Übersicht
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4">
        {!engine ? (
          scenarios.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-[#a3a3a3]">Szenarien werden geladen…</div>
            </div>
          ) : (
            <ScenarioList
              scenarios={scenarios}
              onSelect={startScenario}
            />
          )
        ) : (
          <PracticeScreen
            scenario={selectedScenario!}
            engine={engine!}
            audio={audio}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center p-4 text-xs text-[#a3a3a3]">
        FFFunk v0.1 — Basierend auf „Sprechfunkübungen im TMO-Betrieb“ – Staatliche Feuerwehrschule Würzburg
      </footer>
    </div>
  );
}

export default App;
