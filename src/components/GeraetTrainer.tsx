// Übungsprogramm „Funkgerät bedienen“: Bedienkonzept wählen, Übungen nacheinander am simulierten Gerät lösen.
import { useState } from 'react';
import Funkgeraet, { useFunkgeraet } from './Funkgeraet';
import { KONZEPTE, type DeviceEvent, type DeviceState, type KonzeptId } from '../lib/funkgeraet';
import { getKonzept, setKonzept } from '../lib/funkgeraet-settings';
import { UEBUNGEN, loadErledigt, markErledigt } from '../lib/geraet-uebungen';

export default function GeraetTrainer() {
  const [konzept, setKonzeptState] = useState<KonzeptId>(getKonzept);
  const [erledigt, setErledigt] = useState<string[]>(() => loadErledigt(konzept));
  const [aktiv, setAktiv] = useState(() => UEBUNGEN.find(u => !loadErledigt(konzept).includes(u.id)) ?? UEBUNGEN[0]);
  const [schritt, setSchritt] = useState(0);
  const [hilfe, setHilfe] = useState(false);
  const [fehler, setFehler] = useState(0);
  const fertig = schritt >= aktiv.schritte.length;

  const onEvent = (e: DeviceEvent, s: DeviceState) => {
    if (fertig) return;
    const ziel = aktiv.schritte[schritt];
    if (ziel.ziel(e, s)) {
      if (ziel.danach) geraet.setState({ ...s, display: [s.display[0], ziel.danach] });
      const next = schritt + 1;
      setSchritt(next);
      setHilfe(false);
      setFehler(0);
      if (next >= aktiv.schritte.length) setErledigt(markErledigt(konzept, aktiv.id));
    } else if (e.type === 'rejected' || e.type === 'status' || e.type === 'group') {
      // nach zwei Fehlversuchen die Anleitung von selbst zeigen
      setFehler(f => { if (f + 1 >= 2) setHilfe(true); return f + 1; });
    }
  };
  const geraet = useFunkgeraet(() => aktiv.start(konzept), onEvent);

  const starte = (id: string, k = konzept) => {
    const u = UEBUNGEN.find(x => x.id === id)!;
    setAktiv(u);
    setSchritt(0);
    setHilfe(false);
    setFehler(0);
    geraet.setState(u.start(k));
  };

  const wechsleKonzept = (k: KonzeptId) => {
    setKonzept(k);
    setKonzeptState(k);
    setErledigt(loadErledigt(k));
    starte(aktiv.id, k);
  };

  const naechste = UEBUNGEN[UEBUNGEN.indexOf(aktiv) + 1];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Funkgerät bedienen</h2>
        <p className="text-sm text-[#a3a3a3]">
          Einschalten, Tastensperre, Gruppe wechseln, Status und Notruf – am Gerät, das ihr wirklich habt.
          Die Einstellung gilt auch für die Szenarien.
        </p>
      </div>

      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[#a3a3a3]">Euer Funkgerät:</span>
        <select
          value={konzept}
          onChange={e => wechsleKonzept(e.target.value as KonzeptId)}
          className="bg-[#111] border border-[#444] rounded px-2 py-1 focus:outline-none focus:border-[#dc2626]"
          aria-label="Bedienkonzept"
        >
          {Object.values(KONZEPTE).map(k => <option key={k.id} value={k.id}>{k.name} – {k.geraete}</option>)}
        </select>
      </label>

      <div className="flex flex-wrap gap-1.5" role="list" aria-label="Übungen">
        {UEBUNGEN.map((u, i) => (
          <button
            key={u.id}
            onClick={() => starte(u.id)}
            className={`text-xs px-2.5 py-1.5 rounded-full border ${u.id === aktiv.id ? 'bg-[#dc2626] border-[#dc2626] text-white' : 'bg-[#1a1a1a] border-[#333] text-[#d4d4d4] hover:border-[#666]'}`}
          >
            {erledigt.includes(u.id) ? '✓ ' : `${i + 1}. `}{u.titel}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#333]">
            <div className="text-xs uppercase tracking-wider text-[#a3a3a3] mb-1">Lage</div>
            <p>{aktiv.lage}</p>
          </div>
          {aktiv.schritte.map((s, i) => (
            <div key={i} className={`p-3 rounded-lg border text-sm ${i < schritt ? 'border-green-700 bg-green-900/20 text-green-200' : i === schritt ? 'border-[#dc2626] bg-[#1a1a1a]' : 'border-[#333] text-[#737373]'}`}>
              {i < schritt ? '✓ ' : `${i + 1}. `}{s.text}
            </div>
          ))}
          {!fertig && (
            <button onClick={() => setHilfe(h => !h)} className="text-sm text-[#60a5fa] hover:underline">
              {hilfe ? 'Anleitung ausblenden' : 'Wie geht das?'}
            </button>
          )}
          {hilfe && !fertig && (
            <div className="p-3 rounded-lg bg-[#1f2a37] border border-[#2f4256] text-sm text-[#cbd5e1]" data-testid="anleitung">
              <strong>{KONZEPTE[konzept].name}:</strong> {KONZEPTE[konzept].anleitung[aktiv.schritte[schritt].hilfe]}
            </div>
          )}
          {fertig && (
            <div className="p-4 rounded-lg border border-green-700 bg-green-900/20 text-green-200 space-y-3">
              <div className="font-semibold">Geschafft! 🎉</div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => starte(aktiv.id)} className="px-3 py-1.5 rounded bg-[#262626] border border-[#444] text-sm text-white">🔄 Nochmal</button>
                {naechste && <button onClick={() => starte(naechste.id)} className="px-3 py-1.5 rounded bg-[#dc2626] text-sm text-white">Nächste Übung ▶</button>}
              </div>
            </div>
          )}
          <p className="text-xs text-[#737373]">
            Kurz tippen = kurzer Druck, gedrückt halten = langer Druck (die Anzeige zählt mit). Gruppennamen sind Beispiele nach bayerischem Schema –
            Tastenbelegung und Gruppen hängen von der Programmierung eures Landkreises ab.
          </p>
        </div>
        <Funkgeraet state={geraet.state} onPress={geraet.press} />
      </div>
    </div>
  );
}
