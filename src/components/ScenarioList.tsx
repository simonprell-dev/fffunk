import { Scenario, PlayerRole } from '../types/story';

interface Props {
  scenarios: Scenario[];
  onSelect: (scenario: Scenario) => void;
  onCreate: () => void;
  onDeleteLocal: (scenarioId: string) => void;
}

function getRoleBadge(role: PlayerRole): { label: string; cls: string } {
  if (role.startsWith('gruppenführer')) return { label: 'Gruppenführer', cls: 'bg-red-900/40 text-red-300 border border-red-800' };
  if (role === 'truppführer') return { label: 'Truppführer', cls: 'bg-orange-900/40 text-orange-300 border border-orange-800' };
  if (role === 'atemschutzüberwachung') return { label: 'Atemschutz', cls: 'bg-blue-900/40 text-blue-300 border border-blue-800' };
  if (role === 'einsatzleit') return { label: 'Leitstelle', cls: 'bg-purple-900/40 text-purple-300 border border-purple-800' };
  return { label: role, cls: 'bg-[#333] text-[#a3a3a3]' };
}

export default function ScenarioList({ scenarios, onSelect, onCreate, onDeleteLocal }: Props) {
  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-[#a3a3a3]">Szenarien werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Trainings-Szenarien</h2>
            <p className="text-[#a3a3a3]">
              Wählen Sie ein Szenario und sprechen Sie die Funk-Meldungen deutlich ins Mikrofon.
            </p>
          </div>
          <button
            onClick={onCreate}
            className="shrink-0 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg px-4 py-2 font-semibold"
          >
            Szenario erstellen
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {scenarios.map((scenario) => {
          const badge = getRoleBadge(scenario.playerRole);
          const radioTurns = Object.values(scenario.nodes).reduce(
            (n, node) => n + node.actions.filter(a => !!a.radioCall).length,
            0
          );

          return (
            <div
              key={scenario.id}
              className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 hover:border-[#dc2626] hover:bg-[#262626] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {scenario.community?.source === 'local' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-800">
                        Lokal
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[#e5e5e5]">{scenario.title}</h3>
                  <p className="text-sm text-[#a3a3a3] mt-1">{scenario.description}</p>
                  <div className="mt-2 text-xs text-[#666]">
                    {radioTurns} Funk-Runden
                    {scenario.community?.authorName && ` · von ${scenario.community.authorName}`}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => onSelect(scenario)}
                      className="px-3 py-2 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-semibold"
                    >
                      Starten
                    </button>
                    {scenario.community?.source === 'local' && (
                      <button
                        onClick={() => onDeleteLocal(scenario.id)}
                        className="px-3 py-2 rounded-lg bg-[#261a1a] hover:bg-red-900/30 text-red-300 text-sm"
                      >
                        Lokal löschen
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-[#dc2626] shrink-0 mt-1" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-[#a3a3a3]">
        <strong className="block mb-2 text-[#e5e5e5]">Hinweis zum Datenschutz:</strong>
        Alle Audiodaten bleiben lokal auf Ihrem Gerät. Community-Szenarien werden erst durch Export/Import oder PR geteilt.
      </div>
    </div>
  );
}
