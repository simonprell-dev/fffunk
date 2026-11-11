// Gruppenübung aus Sicht der Übungsleitung: anlegen, Positionen vergeben, Übung verfolgen, auswerten.
import { useEffect, useMemo, useState } from 'react';
import { szenarienFuer } from '../data/gruppen';
import { ORGS, type OrgId, type Sicht, type SichtSlot, type UebungsOptionen } from '../types/gruppe';
import { MAX_TEILNEHMER, MIN_TEILNEHMER, bauePlan, teileAuf } from '../lib/gruppen-plan';
import { legeUebungAn, meineUebungen, positionsLink, useUebung, zufallsLink, type UebungKurz } from '../lib/gruppen-client';
import { useKonto } from '../lib/konto';
import { Anmeldung } from './KontoView';
import QrCode from './QrCode';

const karte = 'bg-[#1a1a1a] border border-[#333] rounded-xl p-4';
const knopf = 'px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50';
const rot = `${knopf} bg-[#dc2626] hover:bg-[#b91c1c] text-white`;
const grau = `${knopf} bg-[#262626] border border-[#444] hover:bg-[#333] text-[#e5e5e5]`;
const klein = 'px-2 py-1 rounded text-xs bg-[#262626] border border-[#444] hover:bg-[#333] text-[#e5e5e5]';

const ART: Record<string, string> = { anruf: 'Anruf', antwort: 'Antwort', meldung: 'Meldung', quittung: 'Quittung', notruf: 'Notruf' };
const uhr = (ms: number) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

async function kopiere(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

function Schalter({ an, onChange, titel, text }: { an: boolean; onChange: (an: boolean) => void; titel: string; text: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={an} onChange={e => onChange(e.target.checked)} className="accent-[#dc2626] w-4 h-4 mt-1 shrink-0" />
      <span><span className="text-sm font-medium text-[#e5e5e5]">{titel}</span><span className="block text-xs text-[#a3a3a3]">{text}</span></span>
    </label>
  );
}

function Optionen({ o, onChange }: { o: UebungsOptionen; onChange: (o: UebungsOptionen) => void }) {
  return (
    <div className="space-y-3">
      <Schalter an={o.funk} onChange={funk => onChange({ ...o, funk })} titel="Virtuelles Funkgerät"
        text="Ohne echte Funkgeräte: Alle funken über die App – mit Sprechtaste, Notruftaste und Gruppenwahl. Höchstens 6 Stunden aktiv." />
      <Schalter an={o.anonym} onChange={anonym => onChange({ ...o, anonym })} titel="Anonyme Auswertung"
        text="Du siehst die Ergebnisse ohne Namen und Positionen. Jede Person sieht nur ihr eigenes Ergebnis." />
      <Schalter an={o.muster} onChange={muster => onChange({ ...o, muster })} titel="Muster-Funkspruch anzeigen"
        text="Aus: Die Teilnehmenden sehen nur Stichpunkte und formulieren selbst (schwerer)." />
    </div>
  );
}

// ── Übung anlegen ─────────────────────────────────────────────────────────────────────────

function Anlegen({ rufnamen, onCode }: { rufnamen?: Record<string, string>; onCode: (code: string) => void }) {
  const [org, setOrg] = useState<OrgId>(() => (localStorage.getItem('fffunk_gruppe_org') as OrgId) || 'feuerwehr');
  const [n, setN] = useState(() => Number(localStorage.getItem('fffunk_gruppe_n')) || 6);
  const [szenarioId, setSzenarioId] = useState('');
  const [versatz, setVersatz] = useState(0);
  const [optionen, setOptionen] = useState<UebungsOptionen>({ funk: false, anonym: false, muster: true });
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [alte, setAlte] = useState<UebungKurz[]>([]);

  const szenarien = useMemo(() => szenarienFuer(ORGS[org] ? org : 'feuerwehr'), [org]);
  const szenario = szenarien.find(s => s.id === szenarioId) ?? szenarien[0];
  const groessen = teileAuf(n);
  useEffect(() => { meineUebungen().then(setAlte).catch(() => {}); }, []);
  useEffect(() => { localStorage.setItem('fffunk_gruppe_org', org); localStorage.setItem('fffunk_gruppe_n', String(n)); }, [org, n]);

  const anlegen = async () => {
    if (!szenario) return;
    setLaedt(true); setFehler(null);
    try { onCode(await legeUebungAn(bauePlan(szenario, n, { versatz, rufnamen }), optionen)); }
    catch (e) { setFehler((e as Error).message); setLaedt(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Gruppenübung</h2>
        <p className="text-sm text-[#a3a3a3]">2 bis 20 Personen funken gemeinsam – jede mit eigenem Handy und eigener Position. Die App hört mit und wertet jeden Funkspruch aus.</p>
      </div>

      <div className={`${karte} space-y-4`}>
        <div>
          <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">1 · Organisation</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(ORGS) as OrgId[]).map(o => (
              <button key={o} onClick={() => { setOrg(o); setSzenarioId(''); setVersatz(0); }}
                className={`py-2 rounded-lg text-sm font-semibold border ${o === org ? 'bg-[#dc2626] border-[#dc2626] text-white' : 'bg-[#262626] border-[#444] text-[#d4d4d4] hover:bg-[#333]'}`}>{ORGS[o]}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">2 · Wie viele sind da?</div>
          <div className="flex items-center gap-3">
            <button onClick={() => setN(v => Math.max(MIN_TEILNEHMER, v - 1))} className={`${grau} w-11 text-lg`} aria-label="Eine Person weniger">−</button>
            <div className="text-3xl font-bold font-mono w-12 text-center" data-testid="anzahl">{n}</div>
            <button onClick={() => setN(v => Math.min(MAX_TEILNEHMER, v + 1))} className={`${grau} w-11 text-lg`} aria-label="Eine Person mehr">+</button>
            <input type="range" min={MIN_TEILNEHMER} max={MAX_TEILNEHMER} value={n} onChange={e => setN(Number(e.target.value))} className="flex-1 accent-[#dc2626]" aria-label="Teilnehmerzahl" />
          </div>
          <div className="text-xs text-[#a3a3a3] mt-2">
            {groessen.length === 1 ? 'Ein Abschnitt' : `${groessen.length} Abschnitte, die gleichzeitig funken`}: {groessen.join(' · ')} Personen
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">3 · Szenario</div>
          <div className="space-y-2">
            {szenarien.map(s => (
              <button key={s.id} onClick={() => { setSzenarioId(s.id); setVersatz(0); }}
                className={`w-full text-left p-3 rounded-lg border ${s.id === szenario?.id ? 'border-[#dc2626] bg-[#dc2626]/10' : 'border-[#333] bg-[#141414] hover:border-[#555]'}`}>
                <div className="font-semibold text-sm">{s.titel}</div>
                <div className="text-xs text-[#a3a3a3] mt-0.5">{s.beschreibung}</div>
              </button>
            ))}
            {!szenarien.length && <div className="text-sm text-[#a3a3a3]">Für diese Organisation gibt es noch keine Gruppenszenarien.</div>}
          </div>
          {szenario && (
            <div className="mt-3">
              <label className="text-xs text-[#a3a3a3]">Besetzte Abschnitte{groessen.length < szenario.abschnitte.length ? ' – beginnen bei:' : ':'}</label>
              {groessen.length < szenario.abschnitte.length && (
                <select value={versatz} onChange={e => setVersatz(Number(e.target.value))} className="ml-2 bg-[#111] border border-[#444] rounded px-2 py-1 text-xs">
                  {szenario.abschnitte.map((a, i) => <option key={a.id} value={i}>{a.name}</option>)}
                </select>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {groessen.map((g, i) => {
                  const a = szenario.abschnitte[(versatz + i) % szenario.abschnitte.length];
                  return <span key={a.id} className="text-xs px-2 py-1 rounded bg-[#1f2a37] border border-[#2f4256] text-[#9db4d0]">{a.name} · {g} Pers. · {a.gruppe}</span>;
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">4 · Einstellungen</div>
          <Optionen o={optionen} onChange={setOptionen} />
        </div>

        {fehler && <div className="text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-lg p-3">{fehler}</div>}
        <button onClick={() => void anlegen()} disabled={laedt || !szenario} className={`${rot} w-full py-3`}>{laedt ? 'Lege an …' : 'Übung anlegen und Zugänge erzeugen'}</button>
      </div>

      {alte.length > 0 && (
        <div className={karte}>
          <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Deine letzten Übungen</div>
          <ul className="divide-y divide-[#262626] text-sm">
            {alte.slice(0, 8).map(u => (
              <li key={u.code} className="py-2 flex items-center justify-between gap-3">
                <span className="min-w-0 truncate"><span className="font-mono text-[#a3a3a3] mr-2">{u.code}</span>{u.titel} <span className="text-xs text-[#a3a3a3]">· {u.teilnehmer} Pers. · {new Date(u.erstellt).toLocaleDateString('de-DE')}</span></span>
                <button onClick={() => onCode(u.code)} className={klein}>{u.phase === 'ende' ? 'Auswertung' : 'Öffnen'}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Zugang zu einer Position (QR + Link) ──────────────────────────────────────────────────

function Zugang({ titel, text, link, onClose }: { titel: string; text: string; link: string; onClose: () => void }) {
  const [kopiert, setKopiert] = useState(false);
  const teilen = async () => { try { await navigator.share({ title: 'FFFunk Gruppenübung', text, url: link }); } catch { /* abgebrochen */ } };
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 max-w-sm w-full space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div><div className="font-bold">{titel}</div><div className="text-xs text-[#a3a3a3]">{text}</div></div>
          <button onClick={onClose} className="text-[#a3a3a3] hover:text-white w-8 h-8" aria-label="Schließen">✕</button>
        </div>
        <QrCode text={link} className="w-full h-auto" />
        <div className="text-xs font-mono break-all bg-[#111] border border-[#333] rounded p-2 select-all">{link}</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={async () => { setKopiert(await kopiere(link)); }} className={grau}>{kopiert ? '✓ Kopiert' : 'Link kopieren'}</button>
          {typeof navigator.share === 'function' && <button onClick={() => void teilen()} className={grau}>Teilen …</button>}
          <a href={`mailto:?subject=${encodeURIComponent('FFFunk Gruppenübung: ' + titel)}&body=${encodeURIComponent(`${text}\n\n${link}`)}`} className={grau}>Per E-Mail</a>
        </div>
      </div>
    </div>
  );
}

// ── Lobby: Positionen vergeben ────────────────────────────────────────────────────────────

function Lobby({ s, sende }: { s: Sicht; sende: (n: Record<string, unknown>) => boolean }) {
  const [zugang, setZugang] = useState<{ titel: string; text: string; link: string } | null>(null);
  const [kopiert, setKopiert] = useState(false);
  const abschnitte = [...new Set(s.slots.map(x => x.abschnitt))];
  const besetzt = s.slots.filter(x => x.besetzt).length;
  const personen = [
    ...(s.wartende ?? []).map(w => ({ tn: w.tn, name: w.name || 'Ohne Namen', wo: 'wartet' })),
    ...s.slots.filter(x => x.tn).map(x => ({ tn: x.tn!, name: x.name || 'Ohne Namen', wo: x.rolle })),
  ];
  const link = zufallsLink(s.code);
  const alleLinks = () => [
    `FFFunk Gruppenübung „${s.titel}“ – Code ${s.code}`,
    `Zufällige Position: ${link}`,
    '',
    ...s.slots.map(x => `${x.abschnitt} – ${x.rolle} (${x.rufname}): ${positionsLink(s.code, x.token ?? '')}`),
  ].join('\n');
  const posZugang = (x: SichtSlot) => setZugang({
    titel: `${x.rolle} – ${x.rufname}`,
    text: `Deine Position in der Übung „${s.titel}“: ${x.rolle} im Abschnitt ${x.abschnitt}.`,
    link: positionsLink(s.code, x.token ?? ''),
  });

  return (
    <div className="space-y-4">
      <div className={`${karte} flex flex-col sm:flex-row gap-4 items-center`}>
        <QrCode text={link} className="w-44 h-44 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
          <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Zufallslink für alle</div>
          <div className="text-4xl font-mono font-bold tracking-widest" data-testid="uebung-code">{s.code}</div>
          <div className="text-xs text-[#a3a3a3]">QR-Code scannen oder in der App unter „Gruppe“ den Code eingeben. Jede Person bekommt eine freie Position zugelost.</div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button onClick={() => setZugang({ titel: 'Zufällige Position', text: `Mach mit bei der Funkübung „${s.titel}“ – du bekommst eine Position zugelost.`, link })} className={grau}>Groß anzeigen / teilen</button>
            <button onClick={async () => { setKopiert(await kopiere(alleLinks())); }} className={grau}>{kopiert ? '✓ Kopiert' : 'Alle Links kopieren'}</button>
          </div>
        </div>
      </div>

      {(s.wartende?.length ?? 0) > 0 && (
        <div className="p-3 rounded-lg border border-amber-700 bg-amber-900/20 text-sm text-amber-200">
          <strong>{s.wartende!.length} ohne Position:</strong> {s.wartende!.map(w => w.name || 'Ohne Namen').join(', ')} – unten einer Position zuweisen.
        </div>
      )}

      {abschnitte.map(a => (
        <div key={a} className={karte}>
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="font-bold">{a}</h3>
            <span className="text-xs font-mono text-[#9db4d0]">{s.slots.find(x => x.abschnitt === a)?.gruppe}</span>
          </div>
          <ul className="divide-y divide-[#262626]">
            {s.slots.filter(x => x.abschnitt === a).map(x => (
              <li key={x.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-2" data-testid={`slot-${x.id}`}>
                <div className="min-w-0 flex-1 basis-40">
                  <div className="text-sm font-semibold">{x.rolle}</div>
                  <div className="text-xs text-[#a3a3a3] font-mono">{x.rufname}</div>
                </div>
                <div className="text-sm basis-28">
                  {x.besetzt
                    ? <span className="text-emerald-400"><span className={x.online ? '' : 'opacity-40'}>●</span> {x.name || 'Ohne Namen'}</span>
                    : <span className="text-[#a3a3a3]">{x.fest ? 'reserviert' : 'frei'}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-[#a3a3a3] cursor-pointer" title="Diese Position wird nicht verlost – du vergibst sie per Link oder Auswahl.">
                    <input type="checkbox" checked={x.fest} onChange={e => sende({ t: 'fest', slot: x.id, fest: e.target.checked })} className="accent-[#dc2626]" /> selbst vergeben
                  </label>
                  <button onClick={() => posZugang(x)} className={klein}>QR / Link</button>
                  <select
                    value={x.tn ?? ''} aria-label={`Person für ${x.rolle}`}
                    onChange={e => { const tn = e.target.value; if (tn) sende({ t: 'zuweisen', tn, slot: x.id }); else if (x.tn) sende({ t: 'zuweisen', tn: x.tn, slot: null }); }}
                    className="bg-[#111] border border-[#444] rounded px-1 py-1 text-xs max-w-[9rem]"
                  >
                    <option value="">{x.besetzt ? '– frei machen –' : '– zuweisen –'}</option>
                    {personen.map(p => <option key={p.tn} value={p.tn}>{p.name}{p.tn === x.tn ? '' : ` (${p.wo})`}</option>)}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className={karte}>
        <Optionen o={s.optionen} onChange={optionen => sende({ t: 'optionen', optionen })} />
      </div>

      <div className={`${karte} space-y-2`}>
        <div className="text-sm text-[#d4d4d4]"><strong>{besetzt} von {s.slots.length}</strong> Positionen besetzt.{besetzt < s.slots.length && ' Freie Positionen spricht der Computer – nachzügeln geht auch während der Übung.'}</div>
        <button onClick={() => sende({ t: 'start' })} disabled={!besetzt} className={`${rot} w-full py-3`}>Übung starten</button>
      </div>

      {zugang && <Zugang {...zugang} onClose={() => setZugang(null)} />}
    </div>
  );
}

// ── Laufende Übung ────────────────────────────────────────────────────────────────────────

function Verlauf({ s, sende }: { s: Sicht; sende: (n: Record<string, unknown>) => boolean }) {
  const name = (slot: number | null) => (slot === null ? null : s.slots[slot]);
  return (
    <div className="space-y-4">
      {s.notruf && (
        <div className="p-3 rounded-lg border border-orange-500 bg-orange-900/30 text-orange-200 flex flex-wrap items-center justify-between gap-2">
          <span><strong>⚠ Notruf</strong> von {s.notruf.rufname} auf {s.notruf.gruppe}</span>
          <button onClick={() => sende({ t: 'notrufEnde' })} className={klein}>Notruf beenden</button>
        </div>
      )}
      {s.threads.map((t, i) => {
        const a = t.aktuell;
        const sprecher = a ? name(a.slot) : null;
        return (
          <div key={t.name} className={karte} data-testid={`thread-${i}`}>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-bold">{t.name} <span className="text-xs font-mono font-normal text-[#9db4d0]">{t.gruppe}</span></h3>
              <span className="text-xs text-[#a3a3a3] font-mono">{t.pos}/{t.total}</span>
            </div>
            <div className="h-1.5 bg-[#262626] rounded-full overflow-hidden my-2"><div className="h-full bg-[#dc2626] transition-all" style={{ width: `${(100 * t.pos) / t.total}%` }} /></div>
            {a ? (
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#262626] text-[#a3a3a3] mr-2">{ART[a.art]}</span>
                  <strong>{a.sprecher}</strong> → {a.an}
                  <span className="text-xs text-[#a3a3a3] ml-2">{sprecher?.besetzt ? `${sprecher.name ?? sprecher.rolle}${a.versuch > 1 ? ' · 2. Versuch' : ''}` : 'Computer'}{a.gruppe !== t.gruppe && ` · auf ${a.gruppe}`}</span>
                </div>
                <div className="text-sm italic text-[#d4d4d4]">„{a.text}“</div>
                {sprecher?.besetzt && <button onClick={() => sende({ t: 'weiter', thread: i })} className={`${klein} mt-1`} title="Wenn es hängt – zählt nicht in die Punkte">Überspringen</button>}
              </div>
            ) : <div className="text-sm text-emerald-400">✓ Abschnitt fertig</div>}
            {t.letzter && (
              <div className="mt-2 pt-2 border-t border-[#262626] text-xs text-[#a3a3a3]">
                Zuletzt: {t.letzter.sprecher}{t.letzter.punkte != null && <span className={`ml-2 font-mono ${t.letzter.punkte >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>{t.letzter.punkte} %</span>}
              </div>
            )}
          </div>
        );
      })}
      <button onClick={() => { if (window.confirm('Übung jetzt für alle beenden und auswerten?')) sende({ t: 'ende' }); }} className={`${grau} w-full`}>Übung beenden</button>
    </div>
  );
}

const farbe = (p: number | null) => (p === null ? 'text-[#a3a3a3]' : p >= 80 ? 'text-emerald-400' : p >= 60 ? 'text-amber-400' : 'text-red-400');

function Ergebnis({ s, onNeu }: { s: Sicht; onNeu: () => void }) {
  const a = s.auswertung!;
  return (
    <div className="space-y-4">
      <div className={`${karte} text-center`}>
        <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Gesamtergebnis</div>
        <div className={`text-6xl font-bold font-mono my-2 ${farbe(a.team)}`} data-testid="team-punkte">{a.team === null ? '–' : `${a.team} %`}</div>
        <div className="text-sm text-[#a3a3a3]">Anteil der erkannten Kernbegriffe über alle Funksprüche</div>
      </div>
      <div className={karte}>
        <h3 className="font-bold mb-2">Abschnitte</h3>
        <ul className="divide-y divide-[#262626] text-sm">
          {a.threads.map(t => <li key={t.name} className="py-1.5 flex justify-between"><span>{t.name}</span><span className={`font-mono ${farbe(t.punkte)}`}>{t.punkte === null ? '–' : `${t.punkte} %`}</span></li>)}
        </ul>
      </div>
      <div className={karte}>
        <h3 className="font-bold mb-1">Teilnehmende</h3>
        {s.optionen.anonym && <p className="text-xs text-[#a3a3a3] mb-2">Anonyme Auswertung: ohne Namen und Positionen, nach Punkten sortiert.</p>}
        <ul className="divide-y divide-[#262626] text-sm">
          {a.teilnehmer.map((t, i) => (
            <li key={i} className="py-1.5 flex justify-between gap-3">
              <span className="min-w-0 truncate">{t.name}{t.rolle && <span className="text-xs text-[#a3a3a3] ml-2">{t.rolle}</span>}</span>
              <span className="shrink-0"><span className="text-xs text-[#a3a3a3] mr-3">{t.funksprueche} Funksprüche</span><span className={`font-mono ${farbe(t.punkte)}`}>{t.punkte === null ? '–' : `${t.punkte} %`}</span></span>
            </li>
          ))}
          {!a.teilnehmer.length && <li className="py-2 text-[#a3a3a3]">Niemand hat gefunkt.</li>}
        </ul>
      </div>
      <button onClick={onNeu} className={`${rot} w-full py-3`}>Neue Übung</button>
    </div>
  );
}

interface Props {
  /** Code der geöffneten Übung; null = neue Übung anlegen. */
  code: string | null;
  onCode: (code: string | null) => void;
  /** Rufnamen aus dem Wehr-Code. */
  rufnamen?: Record<string, string>;
  /** Als Teilnehmer/in einer fremden Übung beitreten. */
  onBeitreten: (code: string) => void;
}

export default function GruppeLeiter({ code, onCode, rufnamen, onBeitreten }: Props) {
  const { konto, laedt } = useKonto();
  const { sicht, verbunden, fehler, abgelehnt, sende } = useUebung(konto ? code : null, true);
  const [eingabe, setEingabe] = useState('');

  const beitritt = (
    <form className={`${karte} flex flex-wrap items-center gap-2`} onSubmit={e => { e.preventDefault(); if (eingabe.length >= 4) onBeitreten(eingabe); }}>
      <span className="text-sm text-[#d4d4d4] flex-1 basis-40">Du nimmst an einer Übung teil?</span>
      <input value={eingabe} onChange={e => setEingabe(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} maxLength={10} placeholder="CODE" aria-label="Code der Übung" className="w-28 bg-[#111] border border-[#444] rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-[#dc2626]" />
      <button type="submit" disabled={eingabe.length < 4} className={grau}>Beitreten</button>
    </form>
  );

  if (laedt) return <div className="text-center py-12 text-[#a3a3a3] animate-pulse">Lädt …</div>;
  if (!konto) return <div className="space-y-4">{beitritt}<Anmeldung hinweis="Zum Anlegen einer Gruppenübung brauchst du ein Konto – zum Mitmachen nicht." /></div>;
  if (!code) return <div className="space-y-4">{beitritt}<Anlegen rufnamen={rufnamen} onCode={onCode} /></div>;

  if (abgelehnt) {
    return (
      <div className={`${karte} text-center space-y-3`}>
        <p className="text-sm text-[#d4d4d4]">{abgelehnt === 'unbekannt' ? `Die Übung ${code} gibt es nicht (mehr).` : `Die Übung ${code} gehört zu einem anderen Konto.`}</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => onCode(null)} className={grau}>Neue Übung</button>
          {abgelehnt !== 'unbekannt' && <button onClick={() => onBeitreten(code)} className={rot}>Als Teilnehmer/in beitreten</button>}
        </div>
      </div>
    );
  }
  if (!sicht) return <div className="text-center py-12 text-[#a3a3a3] animate-pulse">Verbinde mit Übung {code} …</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{sicht.titel}</h2>
          <div className="text-xs text-[#a3a3a3]">
            {ORGS[sicht.org]} · Code <span className="font-mono">{sicht.code}</span> · {sicht.optionen.funk ? 'virtuelles Funkgerät' : 'echte Funkgeräte'}
            {sicht.phase !== 'ende' && ` · aktiv bis ${uhr(sicht.endetUm)} Uhr`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!verbunden && <span className="text-xs text-amber-400 animate-pulse">Verbindung wird wiederhergestellt …</span>}
          <button onClick={() => onCode(null)} className={klein}>Schließen</button>
        </div>
      </div>
      {fehler && <div className="text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-lg p-3">{fehler}</div>}
      {sicht.phase === 'lobby' && <Lobby s={sicht} sende={sende} />}
      {sicht.phase === 'laeuft' && <Verlauf s={sicht} sende={sende} />}
      {sicht.phase === 'ende' && <Ergebnis s={sicht} onNeu={() => onCode(null)} />}
    </div>
  );
}
