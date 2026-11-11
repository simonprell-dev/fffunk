// Konto: Anmeldung per E-Mail-Code, Spielstand und der eigene Wehr-Code.
import { useEffect, useState } from 'react';
import {
  fordereCodeAn, holeWehrcode, loescheKonto, meldeAb, meldeAn, setzeName, speichereRufnamen, useKonto, type Konto,
} from '../lib/konto';
import ortsnamen from '../../scripts/ortsnamen.json';

const eingabe = 'w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#dc2626]';
const knopf = 'px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50';
const rot = `${knopf} bg-[#dc2626] hover:bg-[#b91c1c] text-white`;
const grau = `${knopf} bg-[#262626] border border-[#444] hover:bg-[#333] text-[#e5e5e5]`;

/** Anmeldeformular: E-Mail → Code aus der E-Mail. `vorgabe`: aus dem Anmelde-Link (#login=…). */
export function Anmeldung({ vorgabe, hinweis }: { vorgabe?: { email: string; code: string }; hinweis?: string }) {
  const [email, setEmail] = useState(vorgabe?.email ?? '');
  const [code, setCode] = useState(vorgabe?.code ?? '');
  const [schritt, setSchritt] = useState<'email' | 'code'>(vorgabe ? 'code' : 'email');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const anfordern = async () => {
    setLaedt(true); setFehler(null);
    try {
      const r = await fordereCodeAn(email.trim());
      if (r.testCode) setCode(r.testCode); // nur auf Testservern ohne E-Mail-Versand
      setSchritt('code');
    } catch (e) { setFehler((e as Error).message); } finally { setLaedt(false); }
  };
  const anmelden = async (c = code) => {
    setLaedt(true); setFehler(null);
    try { await meldeAn(email.trim(), c); } catch (e) { setFehler((e as Error).message); } finally { setLaedt(false); }
  };
  // Anmelde-Link aus der E-Mail: sofort anmelden
  useEffect(() => { if (vorgabe) void anmelden(vorgabe.code); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 space-y-4 max-w-md mx-auto">
      <div>
        <h2 className="text-lg font-bold">Anmelden</h2>
        <p className="text-sm text-[#a3a3a3] mt-1">{hinweis ?? 'Mit Konto wird dein Spielstand gespeichert, und du kannst Gruppenübungen anlegen.'} Kein Passwort: Du bekommst einen Code per E-Mail.</p>
      </div>
      {schritt === 'email' ? (
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); void anfordern(); }}>
          <input type="email" required autoComplete="email" placeholder="E-Mail-Adresse" value={email} onChange={e => setEmail(e.target.value)} className={eingabe} />
          <button type="submit" disabled={laedt || !email.includes('@')} className={`${rot} w-full`}>{laedt ? 'Sende …' : 'Code zuschicken'}</button>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); void anmelden(); }}>
          <p className="text-sm text-[#d4d4d4]">Wir haben einen 6-stelligen Code an <strong>{email}</strong> geschickt. Er gilt 15 Minuten.</p>
          <input inputMode="numeric" autoComplete="one-time-code" placeholder="6-stelliger Code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className={`${eingabe} font-mono text-lg tracking-widest text-center`} />
          <button type="submit" disabled={laedt || code.length !== 6} className={`${rot} w-full`}>{laedt ? 'Prüfe …' : 'Anmelden'}</button>
          <button type="button" onClick={() => { setSchritt('email'); setCode(''); setFehler(null); }} className="text-xs text-[#a3a3a3] hover:text-white w-full">Andere Adresse oder neuen Code anfordern</button>
        </form>
      )}
      {fehler && <div className="text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-lg p-3">{fehler}</div>}
      <p className="text-xs text-[#666]">Gespeichert werden deine E-Mail-Adresse, dein Name (freiwillig) und deine abgeschlossenen Übungen. Du kannst das Konto jederzeit löschen.</p>
    </div>
  );
}

const rufText = (r: Record<string, string>) => Object.entries(r).map(([k, v]) => `${k} = ${v}`).join('\n');
function parseRuf(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const zeile of text.split('\n')) {
    const i = zeile.indexOf('=');
    if (i < 0) continue;
    const alt = zeile.slice(0, i).trim(), neu = zeile.slice(i + 1).trim();
    if (alt && neu) out[alt] = neu;
  }
  return out;
}

function Wehrcode({ konto, onLizenz, aktiverCode }: { konto: Konto; onLizenz: (code: string) => void; aktiverCode: string }) {
  const [organisation, setOrganisation] = useState('');
  const [text, setText] = useState(() => rufText(konto.wehrcode?.rufnamen ?? {}));
  const [status, setStatus] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const tue = async (f: () => Promise<unknown>, ok: string) => {
    setFehler(null); setStatus(null);
    try { await f(); setStatus(ok); } catch (e) { setFehler((e as Error).message); }
  };

  if (konto.wehrcode) {
    const w = konto.wehrcode;
    const vorlage = () => {
      const schon = parseRuf(text);
      const neu = (ortsnamen as { name: string }[]).filter(o => !(o.name in schon)).map(o => `${o.name} = `).join('\n');
      setText(t => (t.trim() ? `${t.trim()}\n${neu}` : neu));
    };
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xl font-bold text-emerald-400">{w.code}</span>
          <span className="text-sm text-[#d4d4d4]">{w.organisation}</span>
          {aktiverCode === w.code
            ? <span className="text-xs text-emerald-400">✓ in dieser App aktiv</span>
            : <button onClick={() => onLizenz(w.code)} className={grau}>In dieser App verwenden</button>}
        </div>
        <p className="text-sm text-[#a3a3a3]">Gib den Code an deine Kameradinnen und Kameraden weiter (Einstellungen → Wehr-Code). Alle Szenarien verwenden dann eure Rufnamen.</p>
        <label className="block text-sm text-[#d4d4d4]">Eure Rufnamen – je Zeile „Name im Szenario = euer Name“</label>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8} spellCheck={false} placeholder={'Florian Neuhaus 42/1 = Florian Musterdorf 40/1\nNeuhaus = Musterdorf'} className={`${eingabe} font-mono text-xs`} />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void tue(() => speichereRufnamen(parseRuf(text)), 'Rufnamen gespeichert.')} className={rot}>Rufnamen speichern</button>
          <button onClick={vorlage} className={grau}>Namen aus den Szenarien einfügen</button>
        </div>
        {status && <div className="text-sm text-emerald-400">{status}</div>}
        {fehler && <div className="text-sm text-red-300">{fehler}</div>}
      </div>
    );
  }

  if (!konto.schwelle) return <p className="text-sm text-[#a3a3a3]">Einen Wehr-Code mit euren eigenen Rufnamen richte ich auf Anfrage ein (siehe Einstellungen).</p>;
  const fehlen = Math.max(0, konto.schwelle - konto.spiele);
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#a3a3a3]">Mit einem Wehr-Code erscheinen in allen Szenarien eure eigenen Rufnamen. Nach {konto.schwelle} abgeschlossenen Übungen schaltest du ihn hier selbst frei.</p>
      <div>
        <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
          <div className="h-full bg-[#dc2626]" style={{ width: `${Math.min(100, (100 * konto.spiele) / konto.schwelle)}%` }} />
        </div>
        <div className="text-xs text-[#a3a3a3] mt-1">{konto.spiele} von {konto.schwelle} Übungen{fehlen ? ` – noch ${fehlen}` : ' – geschafft!'}</div>
      </div>
      {!fehlen && (
        <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void tue(() => holeWehrcode(organisation), 'Wehr-Code angelegt.'); }}>
          <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Name eurer Wehr / Organisation" className={`${eingabe} flex-1 min-w-[12rem]`} />
          <button type="submit" disabled={organisation.trim().length < 3} className={rot}>Wehr-Code freischalten</button>
        </form>
      )}
      {fehler && <div className="text-sm text-red-300">{fehler}</div>}
    </div>
  );
}

interface Props {
  /** Wehr-Code in dieser App aktivieren. */
  onLizenz: (code: string) => void;
  aktiverCode: string;
  loginVorgabe?: { email: string; code: string };
  /** Titel der Szenarien für den Verlauf. */
  titel?: (szenarioId: string) => string | undefined;
}

export default function KontoView({ onLizenz, aktiverCode, loginVorgabe, titel }: Props) {
  const { konto, laedt } = useKonto();
  const [name, setName] = useState('');
  useEffect(() => { setName(konto?.name ?? ''); }, [konto?.name]);

  if (laedt) return <div className="text-center py-12 text-[#a3a3a3] animate-pulse">Konto wird geladen …</div>;
  if (!konto) return <Anmeldung vorgabe={loginVorgabe} />;

  const karte = 'bg-[#1a1a1a] border border-[#333] rounded-xl p-5 space-y-3';
  return (
    <div className="space-y-4">
      <div className={karte}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Dein Konto</h2>
            <div className="text-sm text-[#a3a3a3]">{konto.email}</div>
          </div>
          <button onClick={() => void meldeAb()} className={grau}>Abmelden</button>
        </div>
        <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void setzeName(name); }}>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Name (erscheint bei Gruppenübungen)" className={`${eingabe} flex-1 min-w-[12rem]`} />
          <button type="submit" disabled={name === konto.name} className={grau}>Speichern</button>
        </form>
      </div>

      <div className={karte}>
        <h3 className="font-bold">Spielstand</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-[#111] rounded-lg p-3"><div className="text-3xl font-bold text-[#dc2626]">{konto.spiele}</div><div className="text-xs text-[#a3a3a3]">abgeschlossene Übungen</div></div>
          <div className="bg-[#111] rounded-lg p-3"><div className="text-3xl font-bold text-[#dc2626]">{konto.gruppenspiele}</div><div className="text-xs text-[#a3a3a3]">davon in der Gruppe</div></div>
        </div>
        {konto.verlauf.length > 0 && (
          <ul className="text-sm divide-y divide-[#262626]">
            {konto.verlauf.slice(0, 10).map(s => {
              const id = s.szenarioId.replace(/^gruppe:/, '');
              return (
                <li key={`${s.szenarioId}${s.tag}${s.art}`} className="py-1.5 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{titel?.(id) ?? id}{s.art === 'gruppe' && <span className="ml-2 text-xs text-[#9db4d0]">Gruppe</span>}</span>
                  <span className="shrink-0 text-xs text-[#a3a3a3]">{s.punkte != null && <span className="font-mono text-[#e5e5e5] mr-2">{s.punkte}{s.art === 'gruppe' ? ' %' : ' P.'}</span>}{s.tag.split('-').reverse().join('.')}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-[#666]">Gezählt wird jedes abgeschlossene Szenario einmal pro Tag.</p>
      </div>

      <div className={karte}>
        <h3 className="font-bold">Wehr-Code</h3>
        <Wehrcode konto={konto} onLizenz={onLizenz} aktiverCode={aktiverCode} />
      </div>

      <div className="text-center">
        <button
          onClick={() => { if (window.confirm('Konto mit Spielstand und eigenen Gruppenübungen endgültig löschen?')) void loescheKonto(); }}
          className="text-xs text-[#a3a3a3] hover:text-red-400 underline"
        >Konto löschen</button>
      </div>
    </div>
  );
}
