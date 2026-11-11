// Gezeichnetes Handfunkgerät: Tasten mit Haltedauer (kurz/lang), Display, Drehknopf, PTT und Notruf.
import { useEffect, useRef, useState } from 'react';
import { KONZEPTE, press, type DeviceEvent, type DeviceKey, type DeviceState, type Press } from '../lib/funkgeraet';

const AUSWAHL_TIMEOUT_MS = 5000;

/** Zustand des Geräts samt Ereignis-Rückmeldung. */
export function useFunkgeraet(initial: () => DeviceState, onEvent: (e: DeviceEvent, s: DeviceState) => void) {
  const [state, setState] = useState(initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const handle = (p: Press) => {
    const r = press(stateRef.current, p);
    stateRef.current = r.state;
    setState(r.state);
    if (r.event) onEventRef.current(r.event, r.state);
  };
  // Gruppenauswahl ohne Bestätigung: nach kurzer Wartezeit übernimmt das Gerät die Gruppe selbst.
  useEffect(() => {
    if (state.selecting === null) return;
    const t = setTimeout(() => handle({ key: 'timeout', ms: 0 }), AUSWAHL_TIMEOUT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selecting, state.mode]);
  return { state, setState: (s: DeviceState) => { stateRef.current = s; setState(s); }, press: handle };
}

const LABEL: Partial<Record<DeviceKey, string>> = {
  star: '*', mode: 'Mode', ctxM: '◉', red: '✆', menu: 'Menü', softR: 'Ende', power: '⏻', tmoDmo: 'TMO/DMO',
  sideA: 'A', sideC: 'C', knobPress: '●', knobLeft: '↺', knobRight: '↻',
};

const TITEL: Partial<Record<DeviceKey, string>> = {
  mode: 'Mode-Taste', ctxM: 'Mittlere Kontexttaste', red: 'Rote Taste (Ein/Aus, Beenden)', menu: 'Menü-Taste',
  softR: 'Rechter Softkey', power: 'Ein/Aus-Taste', tmoDmo: 'TMO/DMO-Umschalter', sideA: 'Seitentaste A (Schnellgruppe)',
  sideB: 'Seitentaste TMO/DMO', sideC: 'Seitentaste C (Sprechwunsch)', knobLeft: 'Drehknopf nach links',
  knobRight: 'Drehknopf nach rechts', knobPress: 'Drehknopf drücken', ptt: 'Sprechtaste (PTT)', sos: 'Notruftaste',
  star: 'Stern-Taste',
};

interface Props {
  state: DeviceState;
  onPress: (p: Press) => void;
  /** Taste wird gerade gedrückt bzw. losgelassen – für die Sprechtaste des virtuellen Funkgeräts. */
  onHold?: (key: DeviceKey, down: boolean) => void;
  /** Zusatzzeilen im Display (virtuelles Funkgerät in der Gruppenübung). */
  info?: React.ReactNode;
  /** Breiteres Gehäuse, damit die Zusatzzeilen lesbar bleiben. */
  breit?: boolean;
}

export default function Funkgeraet({ state, onPress, onHold, info, breit }: Props) {
  const konzept = KONZEPTE[state.konzept];
  const has = (k: DeviceKey) => konzept.tasten.includes(k);
  const [held, setHeld] = useState<{ key: DeviceKey; since: number } | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!held) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [held]);

  const down = (key: DeviceKey) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setHeld({ key, since: Date.now() });
    setNow(Date.now());
    onHold?.(key, true);
  };
  const up = (key: DeviceKey) => () => {
    if (!held || held.key !== key) return;
    setHeld(null);
    onHold?.(key, false);
    onPress({ key, ms: Date.now() - held.since });
  };
  const heldMs = held ? Math.max(0, now - held.since) : 0;

  const btn = (key: DeviceKey, cls: string, label = LABEL[key] ?? key) => (
    <button
      key={key}
      type="button"
      title={TITEL[key] ?? `Taste ${label}`}
      aria-label={TITEL[key] ?? `Taste ${label}`}
      data-key={key}
      data-knob="skip"
      onPointerDown={down(key)}
      onPointerUp={up(key)}
      onPointerCancel={() => { setHeld(null); onHold?.(key, false); }}
      onContextMenu={e => e.preventDefault()}
      className={`select-none touch-none font-semibold transition-transform active:scale-95 ${held?.key === key ? 'ring-2 ring-white/70' : ''} ${cls}`}
    >
      {label}
    </button>
  );

  const side = konzept.id === 'sepura-sc'
    ? [btn('sideA', 'w-7 h-9 rounded-l bg-[#374151] text-xs'), btn('sideB', 'w-7 h-9 rounded-l bg-[#374151] text-xs', 'B'), btn('sideC', 'w-7 h-9 rounded-l bg-[#374151] text-xs')]
    : has('sideB') ? [btn('sideB', 'w-7 h-12 rounded-l bg-[#374151] text-[9px] leading-tight', 'TMO DMO')] : [];

  return (
    <div className="flex items-start justify-center gap-1 select-none" data-funkgeraet={konzept.id}>
      {/* linke Seite: PTT und Seitentasten */}
      <div className="flex flex-col items-end gap-2 pt-24">
        {btn('ptt', 'w-8 h-20 rounded-l-lg bg-[#dc2626] text-white text-[10px]', 'PTT')}
        {side}
      </div>

      <div className={`${breit ? 'w-64 min-[400px]:w-72' : 'w-56'} rounded-3xl bg-[#1f2937] border border-[#374151] p-3 shadow-xl`}>
        {/* oben: Drehknopf und Notruf */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 bg-[#111827] rounded-full p-1" title="Drehknopf">
            {btn('knobLeft', 'w-8 h-8 rounded-full bg-[#374151] text-white')}
            {has('knobPress')
              ? btn('knobPress', 'w-8 h-8 rounded-full bg-[#4b5563] text-white text-xs')
              : <span className="w-8 h-8 rounded-full bg-[#4b5563] block" />}
            {btn('knobRight', 'w-8 h-8 rounded-full bg-[#374151] text-white')}
          </div>
          {btn('sos', 'w-12 h-9 rounded-lg bg-orange-500 text-white text-xs', 'SOS')}
        </div>

        {/* Display */}
        <div className={`rounded-lg p-2 font-mono text-xs min-h-[4.5rem] ${state.on ? (state.emergency ? 'bg-[#3b1010] text-orange-300' : 'bg-[#0f2a1a] text-emerald-300') : 'bg-black text-transparent'}`} aria-live="polite" data-testid="geraet-display">
          <div className="flex justify-between">
            <span className="font-bold">{state.display[0] ?? ''}</span>
            <span>{state.on ? `${state.locked ? '🔒' : ''} ▮▮▮` : ''}</span>
          </div>
          <div className="mt-1 break-words">{state.display[1] ?? ''}</div>
          {state.on && info && <div className="mt-1 pt-1 border-t border-white/20 text-[11px] leading-snug break-words" data-testid="geraet-info">{info}</div>}
          <div className="h-1 mt-2 bg-black/30 rounded">
            {held && <div className="h-1 bg-white/60 rounded" style={{ width: `${Math.min(100, (heldMs / 2000) * 100)}%` }} />}
          </div>
          <div className="text-[10px] opacity-70 h-3">{held ? `${(heldMs / 1000).toFixed(1)} s gehalten` : ''}</div>
        </div>

        {/* Funktionstasten */}
        <div className="flex flex-wrap justify-center gap-1.5 my-2">
          {(['mode', 'ctxM', 'menu', 'softR', 'tmoDmo', 'power', 'red'] as DeviceKey[]).filter(has).map(k =>
            btn(k, `px-2 h-8 rounded-md text-xs ${k === 'red' || k === 'power' ? 'bg-[#7f1d1d] text-red-100' : 'bg-[#4b5563] text-white'}`))}
        </div>

        {/* Ziffernblock */}
        <div className="grid grid-cols-3 gap-1.5">
          {(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'star', '0'] as DeviceKey[]).map(k =>
            btn(k, `h-9 rounded-md bg-[#e5e7eb] text-[#111827] ${k === '0' ? 'col-start-2' : ''}`))}
        </div>
        <div className="text-center text-[10px] text-[#9ca3af] mt-2">{konzept.name}</div>
      </div>
    </div>
  );
}
