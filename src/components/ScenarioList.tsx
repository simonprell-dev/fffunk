import { useMemo, useState } from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import { Scenario, PlayerRole } from '../types/story';
import { getCategoryLabel } from '../lib/community-scenarios';

interface Props {
  scenarios: Scenario[];
  onSelect: (scenario: Scenario) => void;
  onCreate: () => void;
  onDeleteLocal: (scenarioId: string) => void;
}

interface FolderEntry {
  id: string;
  label: string;
  scenarios: Scenario[];
}

function getRoleBadge(role: PlayerRole): { label: string; cls: string } {
  if (role.startsWith('gruppenführer')) return { label: 'Gruppenführer', cls: 'bg-red-900/40 text-red-300 border border-red-800' };
  if (role === 'truppführer') return { label: 'Truppführer', cls: 'bg-orange-900/40 text-orange-300 border border-orange-800' };
  if (role === 'atemschutzüberwachung') return { label: 'Atemschutz', cls: 'bg-blue-900/40 text-blue-300 border border-blue-800' };
  if (role === 'einsatzleit') return { label: 'Leitstelle', cls: 'bg-purple-900/40 text-purple-300 border border-purple-800' };
  return { label: role, cls: 'bg-[#333] text-[#a3a3a3]' };
}

function getScenarioFolder(scenario: Scenario): string {
  if (scenario.community?.category) return scenario.community.category;
  const text = `${scenario.id} ${scenario.title} ${scenario.description}`.toLowerCase();
  if (text.includes('verkehr')) return 'verkehr';
  if (text.includes('wasser')) return 'wasser';
  if (text.includes('thl') || text.includes('hilfe')) return 'thl';
  if (text.includes('funk') || text.includes('alarm')) return 'funk';
  if (text.includes('brand') || text.includes('lage')) return 'brand';
  return 'sonstige';
}

export default function ScenarioList({ scenarios, onSelect, onCreate, onDeleteLocal }: Props) {
  const folders = useMemo<FolderEntry[]>(() => {
    const grouped = new Map<string, Scenario[]>();
    scenarios.forEach(scenario => {
      const folder = getScenarioFolder(scenario);
      grouped.set(folder, [...(grouped.get(folder) ?? []), scenario]);
    });

    return Array.from(grouped.entries())
      .map(([id, folderScenarios]) => ({
        id,
        label: getCategoryLabel(id),
        scenarios: folderScenarios.sort((a, b) => a.title.localeCompare(b.title, 'de')),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de'));
  }, [scenarios]);

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const activeFolder = folders.find(folder => folder.id === activeFolderId) ?? folders[0];

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-[#a3a3a3]">Szenarien werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Trainings-Szenarien</h2>
          <p className="text-[#a3a3a3]">Ordner auswählen und Szenario mit Karte oder Pfeil starten.</p>
        </div>
        <button
          onClick={onCreate}
          className="shrink-0 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg px-4 py-2 font-semibold"
        >
          Szenario erstellen
        </button>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-4 items-start">
        <aside className="bg-[#111] border border-[#333] rounded-lg p-2">
          <div className="px-2 py-2 text-xs uppercase tracking-wide text-[#777]">Ordner</div>
          <div className="space-y-1">
            {folders.map(folder => {
              const active = folder.id === activeFolder?.id;
              const Icon = active ? FolderOpen : Folder;
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                    active
                      ? 'bg-[#dc2626] text-white'
                      : 'text-[#d4d4d4] hover:bg-[#262626]'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{folder.label}</span>
                  </span>
                  <span className={`text-xs ${active ? 'text-white/80' : 'text-[#777]'}`}>{folder.scenarios.length}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{activeFolder?.label}</h3>
              <p className="text-xs text-[#777]">{activeFolder?.scenarios.length ?? 0} Szenarien in diesem Ordner</p>
            </div>
          </div>

          <div className="grid gap-4">
            {(activeFolder?.scenarios ?? []).map((scenario) => {
              const badge = getRoleBadge(scenario.playerRole);
              const radioTurns = Object.values(scenario.nodes).reduce(
                (n, node) => n + node.actions.filter(a => !!a.radioCall).length,
                0
              );
              const folder = getScenarioFolder(scenario);

              return (
                <div
                  key={scenario.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(scenario)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(scenario);
                    }
                  }}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 hover:border-[#dc2626] hover:bg-[#262626] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#333] text-[#d4d4d4] border border-[#444]">
                          {getCategoryLabel(folder)}
                        </span>
                        {scenario.community?.source === 'local' && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-800">
                            Lokal
                          </span>
                        )}
                        {scenario.community?.source === 'community' && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-800">
                            Community
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-[#e5e5e5]">{scenario.title}</h3>
                      <p className="text-sm text-[#a3a3a3] mt-1">{scenario.description}</p>
                      <div className="mt-2 text-xs text-[#666]">
                        {radioTurns} Funk-Runden
                        {scenario.community?.authorName && ` · von ${scenario.community.authorName}`}
                      </div>
                      {scenario.community?.source === 'local' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={event => {
                              event.stopPropagation();
                              onDeleteLocal(scenario.id);
                            }}
                            className="px-3 py-2 rounded-lg bg-[#261a1a] hover:bg-red-900/30 text-red-300 text-sm"
                          >
                            Lokal löschen
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={event => {
                        event.stopPropagation();
                        onSelect(scenario);
                      }}
                      className="text-[#dc2626] shrink-0 mt-1 p-2 rounded-lg hover:bg-[#331f1f]"
                      aria-label={`${scenario.title} starten`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-8 p-4 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-[#a3a3a3]">
        <strong className="block mb-2 text-[#e5e5e5]">Hinweis zum Datenschutz:</strong>
        Alle Audiodaten bleiben lokal auf Ihrem Gerät. Lokale Szenarien bleiben spielbar, bis Sie sie löschen.
      </div>
    </div>
  );
}
