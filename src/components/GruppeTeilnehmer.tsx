// Gruppenübung aus Sicht einer teilnehmenden Person: beitreten, Position sehen, funken, Ergebnis.
// Zwei Darstellungen: Positionskarte (echte Funkgeräte, die App hört von selbst zu) oder virtuelles Funkgerät.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AudioEngine } from '../lib/audio-engine';
import { ORGS, type Sicht, type SichtFunk } from '../types/gruppe';
import { tritBei, uebungInfo, useUebung, type ServerNachricht, type UebungInfo } from '../lib/gruppen-client';
import { hoereZu, sttDienst, treffer, waermeAuf, type SttDienst, type Zuhoeren } from '../lib/gruppen-stt';
import { FunkEmpfaenger, FunkSender } from '../lib/funk-audio';
import { KONZEPTE, readyDevice, type DeviceEvent, type DeviceKey, type DeviceState } from '../lib/funkgeraet';
import { getKonzept } from '../lib/funkgeraet-settings';
import { useKonto } from '../lib/konto';
import Funkgeraet, { useFunkgeraet } from './Funkgeraet';

const karte = 'bg-[#1a1a1a] border border-[#333] rounded-xl p-4';
const knopf = 'px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50';
const rot = `${knopf} bg-[#dc2626] hover:bg-[#b91c1c] text-white`;
const grau = `${knopf} bg-[#262626] border border-[#444] hover:bg-[#333] text-[#e5e5e5]`;
const farbe = (p: number | null) => (p === null ? 'text-[#a3a3a3]' : p >= 80 ? 'text-emerald-400' : p >= 60 ? 'text-amber-400' : 'text-red-400');

interface Bus { nachricht?: (n: ServerNachricht) => void; ton?: (d: Uint8Array) => void }
interface Versuch { idx: number; text: string; kern: string[]; treffer: boolean[]; muster: string }
interface Teil { s: Sicht; sende: (n: Record<string, unknown>) => boolean; audio: AudioEngine; bus: React.MutableRefObject<Bus> }

function Kernbegriffe({ v }: { v: Versuch }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {v.kern.map((k, i) => (
        <span key={k + i} className={`px-2 py-0.5 rounded text-xs border ${v.treffer[i] ? 'bg-green-900/30 text-green-300 border-green-800' : 'bg-red-900/20 text-red-300 border-red-900'}`}>{v.treffer[i] ? '✓' : '✗'} {k}</span>
      ))}
    </div>
  );
}

function Positionskarte({ s }: { s: Sicht }) {
  const slot = s.slots[s.ich!.slot!];
  return (
    <div className={karte} data-testid="positionskarte">
      <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Deine Position · {slot.abschnitt}</div>
      <div className="text-xl font-bold mt-1">{slot.rolle}</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
        <span>Rufname: <strong className="font-mono">{slot.rufname}</strong></span>
        <span>Sprechgruppe: <strong className="font-mono">{slot.gruppe}</strong></span>
      </div>
      <p className="text-sm text-[#d4d4d4] mt-2">{slot.auftrag}</p>
    </div>
  );
}

// ── Echte Funkgeräte: Die App zeigt, was zu funken ist, und hört von selbst zu ────────────

function Karte({ s, sende, audio }: Teil) {
  const ich = s.ich!.slot!;
  const t = s.threads[0];
  const a = t?.aktuell ?? null;
  const meinZug = !!a && a.slot === ich && !!a.kern;
  const [runde, setRunde] = useState(0);
  const [zwischen, setZwischen] = useState('');
  const [versuch, setVersuch] = useState<Versuch | null>(null);
  const [status, setStatus] = useState<'hoert' | 'wertet' | 'leer' | 'ohne' | 'fehler'>('hoert');
  const [meldung, setMeldung] = useState<string | null>(null);
  const [musterAuf, setMusterAuf] = useState(false);
  const zuRef = useRef<Zuhoeren | null>(null);
  const leerRef = useRef(0);
  const zug = meinZug ? `${a!.idx}:${a!.versuch}` : '';

  useEffect(() => { setMusterAuf(false); leerRef.current = 0; }, [a?.idx]);

  // An der Reihe → Erkennung startet von selbst
  useEffect(() => {
    if (!meinZug || !a) return;
    let tot = false;
    let z: Zuhoeren | null = null;
    const kern = a.kern!;
    audio.stop();
    setZwischen(''); setStatus('hoert'); setMeldung(null);
    const timer = setTimeout(async () => {
      const dienst = await sttDienst(false);
      if (tot) return;
      if (dienst === 'keiner') { setStatus('ohne'); return; }
      z = hoereZu({
        dienst, auto: true, hinweise: [a.text ?? '', ...kern],
        vollstaendig: text => treffer(text, kern).every(Boolean),
        onZwischen: text => { if (!tot) setZwischen(text); },
        onText: text => {
          if (tot) return;
          if (!text) {
            if (++leerRef.current >= 3) setStatus('leer'); else setRunde(r => r + 1);
            return;
          }
          leerRef.current = 0;
          const tr = treffer(text, kern);
          setVersuch({ idx: a.idx, text, kern, treffer: tr, muster: a.text ?? '' });
          setStatus('wertet');
          sende({ t: 'melden', thread: a.thread, idx: a.idx, treffer: tr, text });
        },
        onFehler: m => {
          if (tot) return;
          if (m === 'wechsel') setRunde(r => r + 1);
          else if (m === 'keiner') setStatus('ohne');
          else { setMeldung(m); setStatus('fehler'); }
        },
      });
      zuRef.current = z;
    }, 350);
    return () => { tot = true; clearTimeout(timer); z?.abbrechen(); zuRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zug, runde]);

  // Der Computer spricht mich an → vorlesen
  useEffect(() => {
    if (a?.bis && a.text && a.anSlot === ich) audio.speakRadio(a.text).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a?.idx, a?.bis]);

  const ohneWertung = () => a && sende({ t: 'melden', thread: a.thread, idx: a.idx, ohneWertung: true });
  const zweiter = meinZug && a!.versuch > 1 && versuch?.idx === a!.idx;
  const letzter = t?.letzter;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[#a3a3a3]">
        <span>{t?.name} · Funkspruch {Math.min((t?.pos ?? 0) + 1, t?.total ?? 0)} von {t?.total}</span>
        {s.meins?.punkte != null && <span>Dein Schnitt: <span className={`font-mono ${farbe(s.meins.punkte)}`}>{s.meins.punkte} %</span></span>}
      </div>
      <div className="h-1.5 bg-[#262626] rounded-full overflow-hidden"><div className="h-full bg-[#dc2626] transition-all" style={{ width: `${t ? (100 * t.pos) / t.total : 0}%` }} /></div>

      {!a && <div className={`${karte} text-center text-emerald-400`}>✓ Dein Abschnitt ist fertig. Warte, bis die anderen Abschnitte durch sind.</div>}

      {a && meinZug && (
        <div className="rounded-xl border-2 border-[#dc2626] bg-[#dc2626]/10 p-4 space-y-3" data-testid="mein-funkspruch">
          <div className="flex items-center justify-between gap-2">
            <div className="text-lg font-bold">📻 Du funkst an {a.an}</div>
            {a.gruppe !== s.slots[ich].gruppe && <span className="text-xs font-mono px-2 py-1 rounded bg-amber-900/40 border border-amber-700 text-amber-200">auf {a.gruppe}</span>}
          </div>
          {a.art === 'notruf' && <div className="text-sm text-orange-300">⚠ Notruf: Notruftaste am Funkgerät drücken, dann sprechen.</div>}
          {a.lage && <div className="text-sm text-[#d4d4d4] bg-[#111] border border-[#333] rounded-lg p-3">{a.lage}</div>}
          {s.optionen.muster || musterAuf ? (
            <div className="text-lg italic text-white">„{a.text}“</div>
          ) : (
            <div>
              <div className="text-xs text-[#a3a3a3] mb-1">{a.art === 'anruf' ? 'Rufe an:' : a.art === 'antwort' ? 'Melde dich:' : 'Das muss rein:'}</div>
              <div className="flex flex-wrap gap-1.5">{a.kern!.map(k => <span key={k} className="px-2 py-0.5 rounded text-sm bg-[#262626] border border-[#444]">{k}</span>)}</div>
            </div>
          )}

          {zweiter && versuch && (
            <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-700 space-y-2">
              <div className="text-sm text-amber-200">Da fehlte etwas – bitte noch einmal. Verstanden wurde: „{versuch.text}“</div>
              <Kernbegriffe v={versuch} />
              <div className="text-sm text-[#d4d4d4]">Muster: <span className="italic">„{versuch.muster}“</span></div>
            </div>
          )}

          {status === 'hoert' && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="min-w-0 flex-1">{zwischen ? <span className="text-[#e5e5e5]">„{zwischen}“</span> : <span className="text-[#a3a3a3]">Erkennung läuft – sprich jetzt in dein Funkgerät.</span>}</span>
            </div>
          )}
          {status === 'wertet' && <div className="text-sm text-[#a3a3a3] animate-pulse">Wird ausgewertet …</div>}
          {status === 'leer' && <div className="text-sm text-amber-300">Ich habe nichts verstanden. Handy näher an den Mund halten?</div>}
          {status === 'ohne' && <div className="text-sm text-amber-300">Auf diesem Gerät gibt es keine Spracherkennung. Funke und bestätige dann selbst.</div>}
          {status === 'fehler' && <div className="text-sm text-red-300">{meldung}</div>}

          <div className="flex flex-wrap gap-2">
            {status === 'hoert' && <button onClick={() => zuRef.current?.fertig()} className={rot}>Fertig gesprochen</button>}
            {(status === 'leer' || status === 'fehler') && <button onClick={() => { leerRef.current = 0; setRunde(r => r + 1); }} className={rot}>Nochmal versuchen</button>}
            {(status === 'leer' || status === 'ohne' || status === 'fehler') && <button onClick={ohneWertung} className={grau}>Gefunkt – weiter ohne Wertung</button>}
            {!s.optionen.muster && !musterAuf && <button onClick={() => setMusterAuf(true)} className={grau}>Muster zeigen</button>}
          </div>
        </div>
      )}

      {a && !meinZug && (
        <div className={`${karte} space-y-1`} data-testid="fremder-funkspruch">
          <div className="text-sm text-[#a3a3a3]">{a.anSlot === ich ? '📻 Du wirst gerufen – zuhören' : '📻 Zuhören'}</div>
          <div className="font-semibold">{a.sprecher} → {a.an}</div>
          {a.text ? <div className="italic text-[#d4d4d4]">„{a.text}“</div> : <div className="text-sm text-[#a3a3a3]">funkt gerade …</div>}
        </div>
      )}

      {letzter && (
        <div className="text-xs text-[#a3a3a3] px-1">
          Zuletzt – {letzter.sprecher}: „{letzter.text}“
          {letzter.punkte != null && <span className={`ml-2 font-mono ${farbe(letzter.punkte)}`}>{letzter.punkte} %</span>}
          {letzter.slot === ich && versuch?.idx === letzter.idx && <div className="mt-1"><Kernbegriffe v={versuch} /></div>}
        </div>
      )}
    </div>
  );
}

// ── Virtuelles Funkgerät ──────────────────────────────────────────────────────────────────

function Funk({ s, sende, audio, bus, sendeTon, verbunden }: Teil & { sendeTon: (d: Uint8Array) => void; verbunden: boolean }) {
  const ich = s.ich!.slot!;
  const slot = s.slots[ich];
  const t = s.threads[0];
  const a = s.phase === 'laeuft' ? t?.aktuell ?? null : null;
  const meinZug = !!a && a.slot === ich && !!a.kern;
  const konzept = useMemo(getKonzept, []);
  // Führungsgruppe im Netzbetrieb (TMO), die Gruppen der Abschnitte im Direktbetrieb (DMO)
  const gruppen = useMemo(() => ({ TMO: [s.gruppen[0]], DMO: s.gruppen.slice(1) }), [s.gruppen.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sender] = useState(() => new FunkSender());
  const [empf] = useState(() => new FunkEmpfaenger());
  const [spricht, setSpricht] = useState<string | null>(null);
  const [sendet, setSendet] = useState(false);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [versuch, setVersuch] = useState<Versuch | null>(null);
  const [musterAuf, setMusterAuf] = useState(false);
  const [leer, setLeer] = useState(0);
  const [hilfe, setHilfe] = useState(false);
  const dienstRef = useRef<SttDienst>('keiner');
  const pttRef = useRef<{ z: Zuhoeren | null; seit: number; akt: SichtFunk | null } | null>(null);
  const stRef = useRef<DeviceState | null>(null);

  const onEvent = (e: DeviceEvent) => {
    if (e.type === 'emergency') sende({ t: 'notruf', an: e.active });
  };
  const device = useFunkgeraet(() => readyDevice(konzept, gruppen), onEvent);
  const st = device.state;
  stRef.current = st;
  const eingestellt = st.on ? st.group : '';
  const sollBetrieb = (g: string) => `${g === s.gruppen[0] ? 'TMO' : 'DMO'} ${g}`;

  useEffect(() => { sttDienst(true).then(d => { dienstRef.current = d; waermeAuf(d); }); }, []);
  useEffect(() => { if (verbunden) sende({ t: 'gruppe', g: eingestellt }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [eingestellt, verbunden]);
  useEffect(() => { empf.setzeLautstaerke(st.volume); }, [empf, st.volume]);
  useEffect(() => () => { sender.schliesse(); empf.schliesse(); }, [sender, empf]);
  useEffect(() => { setMusterAuf(false); setLeer(0); setHinweis(null); }, [a?.idx]);

  bus.current.nachricht = n => {
    if (n.t === 'ptt') setSpricht(n.an ? n.von ?? 'Gegenstelle' : null);
    if (n.t === 'belegt') { empf.besetztton(); setHinweis('Gruppe belegt – kurz warten'); }
  };
  bus.current.ton = d => { if (stRef.current?.on) empf.spiele(d); };

  // Computer-Funksprüche hört nur, wer auf der richtigen Gruppe steht
  const hoerbar = !!a?.bis && !!a.text && eingestellt === a.gruppe;
  useEffect(() => {
    if (hoerbar) audio.speakRadio(a!.text!).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a?.idx, hoerbar]);

  // Fremder Notruf → Alarmton
  const fremderNotruf = s.notruf && s.notruf.rufname !== slot.rufname ? s.notruf.rufname : null;
  useEffect(() => { if (fremderNotruf && stRef.current?.on) empf.notrufton(); }, [fremderNotruf, empf]);

  const auswerte = (akt: SichtFunk, text: string) => {
    if (!text) { setLeer(n => n + 1); setHinweis('Nicht verstanden – bitte noch einmal'); return; }
    const kern = akt.kern!;
    const tr = treffer(text, kern);
    if (akt.art === 'notruf' && !stRef.current?.emergency) {
      tr[0] = false; // ohne Notruftaste ist es kein Notruf
      setHinweis('Zum Notruf gehört die Notruftaste (2 s halten)');
    }
    setVersuch({ idx: akt.idx, text, kern, treffer: tr, muster: akt.text ?? '' });
    sende({ t: 'melden', thread: akt.thread, idx: akt.idx, treffer: tr, text });
  };

  const onHold = (key: DeviceKey, down: boolean) => {
    if (key !== 'ptt') return;
    empf.entsperre();
    if (down) {
      if (!st.on || st.selecting !== null || s.phase === 'ende' || pttRef.current) return;
      if (spricht) { empf.besetztton(); setHinweis('Gruppe belegt – kurz warten'); return; }
      audio.stop();
      sende({ t: 'ptt', an: true });
      empf.freiton();
      const akt = meinZug && a && st.group === a.gruppe ? a : null;
      const p = { z: null as Zuhoeren | null, seit: Date.now(), akt };
      pttRef.current = p;
      setSendet(true); setHinweis(null);
      sender.start(sendeTon).catch(() => setHinweis('Mikrofon nicht verfügbar – bitte erlauben'));
      if (akt && dienstRef.current !== 'keiner') {
        p.z = hoereZu({
          dienst: dienstRef.current, auto: false, hinweise: [akt.text ?? '', ...akt.kern!],
          onText: text => auswerte(akt, text),
          onFehler: () => { void sttDienst(true).then(d => { dienstRef.current = d; }); auswerte(akt, ''); },
        });
      }
      return;
    }
    const p = pttRef.current;
    if (!p) return;
    pttRef.current = null;
    sende({ t: 'ptt', an: false });
    setSendet(false);
    const aufnahme = sender.stop();
    if (!p.akt) {
      if (meinZug && a) setHinweis(`Keine Gegenstelle – ${sollBetrieb(a.gruppe)} einstellen`);
      return;
    }
    if (Date.now() - p.seit < 500) { p.z?.abbrechen(); return; }
    if (p.z) p.z.fertig(aufnahme); else setLeer(3); // keine Spracherkennung auf diesem Gerät
  };

  const zweiter = meinZug && a!.versuch > 1 && versuch?.idx === a!.idx;
  const fehlend = versuch ? versuch.kern.filter((_k, i) => !versuch.treffer[i]) : [];
  const info = (
    <div className="space-y-0.5" data-testid="funk-info">
      <div className="font-bold">{slot.rufname}</div>
      {s.notruf && <div className="font-bold">⚠ NOTRUF {s.notruf.rufname}</div>}
      {sendet && <div>● Senden …</div>}
      {spricht && <div>▶ {spricht} spricht</div>}
      {s.phase === 'lobby' && <div>Warten auf Start. Funkprobe möglich. Deine Gruppe: {sollBetrieb(slot.gruppe)}</div>}
      {s.phase === 'laeuft' && !a && <div>✓ Abschnitt fertig</div>}
      {a && meinZug && (
        <>
          <div className="font-bold">DU FUNKST → {a.an}</div>
          {a.gruppe !== eingestellt && <div>Gruppe einstellen: {sollBetrieb(a.gruppe)}</div>}
          {a.art === 'notruf' && !st.emergency && <div>Erst Notruftaste 2 s</div>}
          {a.lage && <div className="opacity-80">{a.lage}</div>}
          <div>{s.optionen.muster || musterAuf || zweiter ? `„${a.text}“` : a.kern!.join(' · ')}</div>
          {zweiter && fehlend.length > 0 && <div>Fehlt: {fehlend.join(', ')}</div>}
        </>
      )}
      {a && !meinZug && (
        <>
          <div>{a.sprecher} → {a.an}</div>
          {hoerbar && <div className="opacity-80">„{a.text}“</div>}
          {a.gruppe !== eingestellt && (a.anSlot === ich || a.slot === null) && <div>Du hörst nichts: {sollBetrieb(a.gruppe)}</div>}
        </>
      )}
      {hinweis && <div className="font-bold">{hinweis}</div>}
      {t?.letzter?.slot === ich && t.letzter.punkte != null && !meinZug && <div>Dein letzter Spruch: {t.letzter.punkte} %</div>}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[#a3a3a3]">
        <span>{slot.rolle} · {t?.name}{s.phase === 'laeuft' && t ? ` · ${t.pos}/${t.total}` : ''}</span>
        <button onClick={() => setHilfe(h => !h)} className="text-[#60a5fa] hover:underline">{hilfe ? 'Hilfe ausblenden' : 'Bedienung & Auftrag'}</button>
      </div>
      {hilfe && (
        <div className="text-xs text-[#cbd5e1] bg-[#1f2a37] border border-[#2f4256] rounded-lg p-3 space-y-1">
          <div><strong>Dein Auftrag:</strong> {slot.auftrag}</div>
          <div><strong>Deine Gruppe:</strong> {sollBetrieb(slot.gruppe)} – Führungsgruppe: TMO {s.gruppen[0]}</div>
          <div><strong>Sprechen:</strong> Sprechtaste (PTT) halten, Freiton abwarten, sprechen, loslassen.</div>
          <div><strong>TMO/DMO:</strong> {KONZEPTE[konzept].anleitung.dmo}</div>
          <div><strong>Gruppe wählen:</strong> {KONZEPTE[konzept].anleitung.gruppe}</div>
          <div><strong>Notruf:</strong> {KONZEPTE[konzept].anleitung.notruf}</div>
          {st.locked && <div><strong>Tastensperre:</strong> {KONZEPTE[konzept].anleitung.entsperren}</div>}
        </div>
      )}
      <Funkgeraet state={st} onPress={device.press} onHold={onHold} info={info} breit />
      <div className="flex flex-wrap justify-center gap-2">
        {meinZug && !s.optionen.muster && !musterAuf && <button onClick={() => setMusterAuf(true)} className={grau}>Muster zeigen</button>}
        {meinZug && a && leer >= 3 && <button onClick={() => sende({ t: 'melden', thread: a.thread, idx: a.idx, ohneWertung: true })} className={grau}>Gefunkt – weiter ohne Wertung</button>}
      </div>
    </div>
  );
}

// ── Rahmen: beitreten, warten, Ergebnis ───────────────────────────────────────────────────

function Mikrofontest() {
  const [status, setStatus] = useState<'offen' | 'ok' | 'fehler'>('offen');
  const teste = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(tr => tr.stop());
      setStatus('ok');
    } catch { setStatus('fehler'); }
  };
  return (
    <div className={`${karte} flex flex-wrap items-center justify-between gap-2`}>
      <span className="text-sm text-[#d4d4d4]">{status === 'ok' ? '✓ Mikrofon ist freigegeben.' : status === 'fehler' ? 'Mikrofon gesperrt – bitte im Browser erlauben.' : 'Die App hört mit, wenn du funkst. Mikrofon jetzt freigeben:'}</span>
      {status !== 'ok' && <button onClick={() => void teste()} className={grau}>Mikrofon freigeben</button>}
    </div>
  );
}

interface Props {
  code: string;
  /** Positions-Link: genau diese Position. */
  token?: string;
  audio: AudioEngine;
  onExit: () => void;
}

export default function GruppeTeilnehmer({ code, token, audio, onExit }: Props) {
  const { konto } = useKonto();
  const [info, setInfo] = useState<UebungInfo | null>(null);
  const [name, setName] = useState(() => localStorage.getItem('fffunk_gruppe_name') ?? '');
  const [beigetreten, setBeigetreten] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const bus = useRef<Bus>({});
  const { sicht, verbunden, fehler: serverFehler, abgelehnt, sende, sendeTon } = useUebung(beigetreten ? code : null, false, {
    onNachricht: n => bus.current.nachricht?.(n),
    onTon: d => bus.current.ton?.(d),
  });

  const beitreten = async (n = name) => {
    setLaedt(true); setFehler(null);
    try {
      await tritBei(code, n.trim(), token);
      localStorage.setItem('fffunk_gruppe_name', n.trim());
      localStorage.setItem('fffunk_gruppe_code', code);
      setBeigetreten(true);
    } catch (e) { setFehler((e as Error).message); } finally { setLaedt(false); }
  };

  useEffect(() => {
    setBeigetreten(false); setInfo(null); setFehler(null);
    uebungInfo(code).then(i => {
      setInfo(i);
      // Seite neu geladen: ohne Nachfrage wieder auf die eigene Position
      if (localStorage.getItem('fffunk_gruppe_code') === code && i.phase !== 'ende') void beitreten(localStorage.getItem('fffunk_gruppe_name') ?? '');
    }).catch(e => setFehler((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  useEffect(() => { if (!name && konto?.name) setName(konto.name); }, [konto?.name]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (abgelehnt) { localStorage.removeItem('fffunk_gruppe_code'); setBeigetreten(false); } }, [abgelehnt]);

  // Bildschirm anlassen – sonst trennt das Handy im Standby die Verbindung
  useEffect(() => {
    if (!beigetreten) return;
    let sperre: { release: () => Promise<void> } | null = null;
    const hole = () => { (navigator as any).wakeLock?.request('screen').then((w: any) => { sperre = w; }).catch(() => {}); };
    hole();
    const sichtbar = () => { if (document.visibilityState === 'visible') hole(); };
    document.addEventListener('visibilitychange', sichtbar);
    return () => { document.removeEventListener('visibilitychange', sichtbar); sperre?.release().catch(() => {}); };
  }, [beigetreten]);
  useEffect(() => () => audio.stop(), [audio]);

  const verlassen = () => { localStorage.removeItem('fffunk_gruppe_code'); audio.stop(); onExit(); };

  if (!beigetreten || !sicht) {
    return (
      <div className={`${karte} max-w-md mx-auto space-y-4`}>
        <div>
          <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Gruppenübung · Code {code}</div>
          <h2 className="text-xl font-bold mt-1">{info?.titel ?? (fehler ? 'Übung nicht gefunden' : 'Lädt …')}</h2>
          {info && <div className="text-sm text-[#a3a3a3]">{ORGS[info.org]} · {info.plaetze} Positionen{token ? ' · du hast einen Positions-Link' : ''}</div>}
        </div>
        {info?.phase === 'ende' && <div className="text-sm text-amber-300">Diese Übung ist schon beendet.</div>}
        {info && info.phase !== 'ende' && !beigetreten && (
          <form className="space-y-3" onSubmit={e => { e.preventDefault(); void beitreten(); }}>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder="Dein Name" autoFocus className="w-full bg-[#111] border border-[#444] rounded-lg px-3 py-2 focus:outline-none focus:border-[#dc2626]" />
            <p className="text-xs text-[#a3a3a3]">{info.anonym ? 'Die Auswertung ist anonym: Dein Name dient nur der Zuweisung vor dem Start.' : 'Die Übungsleitung sieht dein Ergebnis mit Namen.'}</p>
            <button type="submit" disabled={laedt || !name.trim()} className={`${rot} w-full py-3`}>{laedt ? 'Trete bei …' : 'Mitmachen'}</button>
          </form>
        )}
        {beigetreten && !sicht && <div className="text-sm text-[#a3a3a3] animate-pulse">Verbinde …</div>}
        {fehler && <div className="text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-lg p-3">{fehler}</div>}
        <button onClick={verlassen} className="text-xs text-[#a3a3a3] hover:text-white underline">Zurück</button>
      </div>
    );
  }

  const hatPosition = sicht.ich?.slot != null;
  const teil: Teil = { s: sicht, sende, audio, bus };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-bold truncate">{sicht.titel}</h2>
          {!verbunden && <div className="text-xs text-amber-400 animate-pulse">Verbindung wird wiederhergestellt …</div>}
        </div>
        <button onClick={() => { if (sicht.phase === 'ende' || window.confirm('Übung verlassen?')) verlassen(); }} className="text-xs px-2 py-1 rounded bg-[#262626] border border-[#444] text-[#a3a3a3] hover:text-white shrink-0">Verlassen</button>
      </div>
      {serverFehler && <div className="text-xs text-amber-300">{serverFehler}</div>}

      {sicht.phase === 'ende' ? (
        <div className="space-y-3">
          <div className={`${karte} text-center`}>
            <div className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Dein Ergebnis</div>
            <div className={`text-6xl font-bold font-mono my-2 ${farbe(sicht.meins?.punkte ?? null)}`} data-testid="mein-ergebnis">{sicht.meins?.punkte == null ? '–' : `${sicht.meins.punkte} %`}</div>
            <div className="text-sm text-[#a3a3a3]">{sicht.meins?.funksprueche ?? 0} Funksprüche · Gruppe gesamt: <span className={`font-mono ${farbe(sicht.auswertung?.team ?? null)}`}>{sicht.auswertung?.team == null ? '–' : `${sicht.auswertung.team} %`}</span></div>
          </div>
          <div className={karte}>
            <ul className="divide-y divide-[#262626] text-sm">
              {sicht.auswertung?.threads.map(th => <li key={th.name} className="py-1.5 flex justify-between"><span>{th.name}</span><span className={`font-mono ${farbe(th.punkte)}`}>{th.punkte === null ? '–' : `${th.punkte} %`}</span></li>)}
            </ul>
          </div>
          {!konto && <p className="text-xs text-center text-[#a3a3a3]">Mit einem Konto (Menü „Konto“) werden deine Ergebnisse gespeichert.</p>}
          <button onClick={verlassen} className={`${rot} w-full py-3`}>Fertig</button>
        </div>
      ) : !hatPosition ? (
        <div className={`${karte} text-center space-y-2`}>
          <div className="text-lg font-semibold">Hallo {sicht.ich?.name || ''} 👋</div>
          <p className="text-sm text-[#a3a3a3]">Die Übungsleitung weist dir gleich eine Position zu. Lass diese Seite offen.</p>
        </div>
      ) : sicht.optionen.funk ? (
        <>
          {sicht.phase === 'lobby' && <div className={`${karte} text-sm text-[#d4d4d4]`}><strong>Lage:</strong> {sicht.lage}</div>}
          <Funk {...teil} sendeTon={sendeTon} verbunden={verbunden} />
        </>
      ) : sicht.phase === 'lobby' ? (
        <>
          <Positionskarte s={sicht} />
          <div className={`${karte} text-sm text-[#d4d4d4]`}><strong>Lage:</strong> {sicht.lage}</div>
          <Mikrofontest />
          <div className="text-center text-sm text-[#a3a3a3] animate-pulse">Warte auf den Start durch die Übungsleitung …</div>
        </>
      ) : (
        <>
          <Positionskarte s={sicht} />
          <Karte {...teil} />
        </>
      )}
    </div>
  );
}
