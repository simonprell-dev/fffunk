import { Scenario } from '../types/story';

interface Props {
  scenarios: Scenario[];
  onSelect: (scenario: Scenario) => void;
}

export default function ScenarioList({ scenarios, onSelect }: Props) {
  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-[#a3a3a3]">Szenarien werden geladen…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Trainings-Szenarien</h2>
        <p className="text-[#a3a3a3]">
          Wählen Sie ein Szenario, um Ihre Funk-Kenntnisse zu trainieren.
          Folgen Sie den Anweisungen und sprechen Sie clearly in das Mikrofon.
        </p>
      </div>

      <div className="grid gap-4">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-left hover:border-[#dc2626] hover:bg-[#262626] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#e5e5e5]">{scenario.title}</h3>
                <p className="text-sm text-[#a3a3a3] mt-1">{scenario.description}</p>
                <div className="mt-2 text-xs text-[#a3a3a3]">
                  {/* Count user turns that have radioCall */}
                  {(() => {
                    let radioTurns = 0;
                    Object.values(scenario.nodes).forEach(node => {
                      node.actions.forEach(action => {
                        if (action.radioCall) radioTurns++;
                      });
                    });
                    return `${radioTurns} Funk-Runden`;
                  })()}
                </div>
              </div>
              <div className="text-[#dc2626]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-[#a3a3a3]">
        <strong className="block mb-2 text-[#e5e5e5]">Hinweis zum Datenschutz:</strong>
        Alle Audiodaten bleiben lokal auf Ihrem Gerät. Es werden keine personenbezogenen Daten übertragen oder gespeichert.
      </div>
    </div>
  );
}
