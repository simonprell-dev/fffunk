// Simuliertes Digitalfunk-Handfunkgerät (HRT) mit drei Bedienkonzepten.
// Belegt aus Kurzanleitungen bayerischer Feuerwehren und der AS BY (Sepura STP8/9000, SC20/21,
// Motorola MTP850/MXP600): Status per langem Druck auf die Zifferntaste, Notruf 2 Sekunden,
// Gruppenwechsel mit PTT bestätigen. Unterschiede: Einschalten, Tastensperre, Weg zur Gruppenauswahl.
import type { Action } from '../types/story';

export type KonzeptId = 'sepura-stp' | 'sepura-sc' | 'motorola';
export type Betriebsart = 'TMO' | 'DMO';
export type DeviceKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'star'
  | 'ptt' | 'sos' | 'knobLeft' | 'knobRight' | 'knobPress'
  | 'mode' | 'ctxM' | 'red' | 'menu' | 'softR' | 'power' | 'tmoDmo'
  | 'sideA' | 'sideB' | 'sideC'
  /** Keine Taste: Wartezeit in der Gruppenauswahl abgelaufen → Auswahl wird übernommen. */
  | 'timeout';

export interface Press { key: DeviceKey; ms: number }

export type Anleitung = Record<'einschalten' | 'entsperren' | 'gruppe' | 'dmo' | 'status' | 'notruf', string>;

export interface Konzept {
  id: KonzeptId;
  name: string;
  geraete: string;
  /** Tasten, die dieses Gerät hat (für die Darstellung). */
  tasten: DeviceKey[];
  /** Mindestdauer für Status per Zifferntaste. */
  statusMs: number;
  anleitung: Anleitung;
}

const ZIFFERN: DeviceKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'star', '0'];
const BASIS: DeviceKey[] = [...ZIFFERN, 'ptt', 'sos', 'knobLeft', 'knobRight'];

export const KONZEPTE: Record<KonzeptId, Konzept> = {
  'sepura-stp': {
    id: 'sepura-stp', name: 'Sepura STP', geraete: 'Sepura STP8000 / STP9000 (z. B. BRK, viele Feuerwehren)',
    tasten: [...BASIS, 'mode', 'red', 'sideB'], statusMs: 1000,
    anleitung: {
      einschalten: 'Mode-Taste kurz drücken (lang = ausschalten).',
      entsperren: 'Stern-Taste lang drücken.',
      gruppe: 'Mode-Taste drücken, mit dem Drehknopf wählen, mit der Sprechtaste (PTT) kurz bestätigen – oder kurz warten.',
      dmo: 'Seitentaste „TMO/DMO“ drücken (Belegung der BOS-Programmierung).',
      status: 'Zifferntaste lang drücken, bis „Status gesendet“ erscheint (nur im TMO).',
      notruf: 'Notruftaste 2 Sekunden drücken – beenden: nochmals 2 Sekunden oder rote Taste drücken und bestätigen.',
    },
  },
  'sepura-sc': {
    id: 'sepura-sc', name: 'Sepura SC20/21', geraete: 'Sepura SC20 / SC21 (neuere Sepura-Generation)',
    tasten: [...BASIS, 'ctxM', 'red', 'sideA', 'sideB', 'sideC'], statusMs: 1000,
    anleitung: {
      einschalten: 'Rote Taste lang drücken.',
      entsperren: 'Stern-Taste lang drücken.',
      gruppe: 'Mittlere Kontexttaste drücken, mit dem Drehknopf wählen, mit PTT kurz bestätigen – oder kurz warten.',
      dmo: 'Seitentaste B drücken (Belegung der BOS-Programmierung).',
      status: 'Zifferntaste lang drücken (nur im TMO). Seitentaste C = Sprechwunsch, auch gesperrt.',
      notruf: 'Notruftaste 2 Sekunden drücken – beenden: nochmals 2 Sekunden oder rote Taste drücken und bestätigen.',
    },
  },
  motorola: {
    id: 'motorola', name: 'Menü + Drehknopf', geraete: 'Geräte mit Tastensperre über Menü + Stern (z. B. MTP850, MXP600)',
    tasten: [...BASIS, 'knobPress', 'menu', 'softR', 'power', 'tmoDmo'], statusMs: 2000,
    anleitung: {
      einschalten: 'Ein/Aus-Taste gedrückt halten – danach ist die Tastensperre aktiv (so programmiert).',
      entsperren: 'Menü-Taste drücken, dann Stern-Taste.',
      gruppe: 'Drehknopf drücken, drehen, mit PTT kurz einbuchen – oder kurz warten.',
      dmo: 'TMO/DMO-Taste gedrückt halten, bis die Betriebsart angezeigt wird (BOS-Belegung; ab Werk über „Optionen“).',
      status: 'Zifferntaste mindestens 2 Sekunden drücken (nur im TMO).',
      notruf: 'Orange Notruftaste 2 Sekunden drücken – beenden mit dem Softkey „Ende“.',
    },
  },
};

/** Beispielgruppen nach bayerischem Schema (FW_<Kennzeichen>, ZA/SoG der ILS, landesweite DMO-Gruppen). */
export const GRUPPEN: Record<Betriebsart, string[]> = {
  TMO: ['FW_ERH', 'RD_ERH', 'KatS_ERH', 'ZA_N', 'SoG_1_N'],
  DMO: ['307_F', '308_F', '309_F', '310_F', '403_K', '726_B'],
};

export interface DeviceState {
  konzept: KonzeptId;
  on: boolean;
  locked: boolean;
  mode: Betriebsart;
  group: string;
  /** Gruppenauswahl offen: Index in GRUPPEN[mode]. */
  selecting: number | null;
  emergency: boolean;
  /** Motorola: Menü gedrückt, wartet auf Stern. */
  menuArmed: boolean;
  /** Zuletzt genutzte Gruppe je Betriebsart – kommt beim TMO/DMO-Wechsel zurück. */
  lastGroup: Record<Betriebsart, string>;
  /** Sepura: rote Taste im Notruf gedrückt, wartet auf Bestätigung. */
  confirmEnd: boolean;
  volume: number;
  display: string[];
  /** Eigene Sprechgruppen (Gruppenübung) statt der Beispielgruppen. */
  gruppen?: Record<Betriebsart, string[]>;
}

export type DeviceEvent =
  | { type: 'power'; on: boolean }
  | { type: 'unlocked' }
  | { type: 'locked' }
  | { type: 'group'; group: string; mode: Betriebsart }
  | { type: 'status'; status: number }
  | { type: 'emergency'; active: boolean }
  | { type: 'ptt' }
  | { type: 'rejected'; reason: string };

export function initialDevice(konzept: KonzeptId, gruppen?: Record<Betriebsart, string[]>): DeviceState {
  const g = gruppen ?? GRUPPEN;
  return {
    konzept, on: false, locked: false, mode: 'TMO', group: g.TMO[0], selecting: null, emergency: false, menuArmed: false,
    lastGroup: { TMO: g.TMO[0], DMO: g.DMO[0] }, confirmEnd: false, volume: 5, display: [],
    ...(gruppen ? { gruppen } : {}),
  };
}

const liste = (s: DeviceState): string[] => (s.gruppen ?? GRUPPEN)[s.mode];

/** Eingeschaltet mit aktiver Tastensperre – wie direkt nach dem Einschalten. */
export function lockedDevice(konzept: KonzeptId): DeviceState {
  return withDisplay({ ...initialDevice(konzept), on: true, locked: true }, sperrHinweis(konzept));
}

/** Eingeschaltet und entsperrt – Start für Übungen, die nicht die Sperre selbst üben. */
export function readyDevice(konzept: KonzeptId, gruppen?: Record<Betriebsart, string[]>): DeviceState {
  return withDisplay({ ...initialDevice(konzept, gruppen), on: true }, 'Bereit');
}

function withDisplay(s: DeviceState, message: string): DeviceState {
  const head = s.emergency ? '⚠ NOTRUF' : `${s.mode}  ${s.group}`;
  return { ...s, display: [head, message] };
}

const NOTRUF_MS = 2000;
const LANG_MS = 1000;

function powerKey(k: KonzeptId): DeviceKey {
  return k === 'sepura-stp' ? 'mode' : k === 'sepura-sc' ? 'red' : 'power';
}

function sperrHinweis(k: KonzeptId): string {
  return k === 'motorola' ? 'Gesperrt – Menü, dann *' : 'Gesperrt – * lang drücken';
}

function toggleMode(s: DeviceState): { state: DeviceState; event: DeviceEvent } {
  const mode: Betriebsart = s.mode === 'TMO' ? 'DMO' : 'TMO';
  const lastGroup = { ...s.lastGroup, [s.mode]: s.group };
  const group = lastGroup[mode];
  return { state: withDisplay({ ...s, mode, group, lastGroup, selecting: null }, mode === 'DMO' ? 'Direktbetrieb' : 'Netzbetrieb'), event: { type: 'group', group, mode } };
}

function confirmGroup(s: DeviceState): { state: DeviceState; event: DeviceEvent } {
  const group = liste(s)[s.selecting ?? 0];
  return { state: withDisplay({ ...s, group, selecting: null }, 'Gruppe gewechselt ✓'), event: { type: 'group', group, mode: s.mode } };
}

function sendStatus(s: DeviceState, status: number): { state: DeviceState; event: DeviceEvent } {
  if (s.mode !== 'TMO') return { state: withDisplay(s, 'Status nur im TMO'), event: { type: 'rejected', reason: 'Status geht nur im Netzbetrieb (TMO).' } };
  return { state: withDisplay(s, `Status ${status} gesendet`), event: { type: 'status', status } };
}

/** Ein Tastendruck (mit Dauer) → neuer Zustand und ggf. ein Ereignis. */
export function press(s: DeviceState, p: Press): { state: DeviceState; event?: DeviceEvent } {
  const k = KONZEPTE[s.konzept];
  const reject = (reason: string, msg = reason) => ({ state: s.on ? withDisplay(s, msg) : s, event: { type: 'rejected', reason } as DeviceEvent });
  if (p.key === 'timeout') return s.on && s.selecting !== null ? confirmGroup(s) : { state: s };
  if (!k.tasten.includes(p.key)) return reject('Diese Taste hat dieses Gerät nicht.', 'Taste nicht vorhanden');

  const isPower = p.key === powerKey(s.konzept);
  if (!s.on) {
    // Notruftaste am ausgeschalteten Gerät: einschalten und sofort Notruf (Herstellerstandard, 3 s)
    if (p.key === 'sos' && p.ms >= 3000) {
      const on: DeviceState = { ...initialDevice(s.konzept, s.gruppen), on: true, emergency: true, volume: s.volume };
      return { state: withDisplay(on, 'Notruf aktiv – sprechen'), event: { type: 'emergency', active: true } };
    }
    const needed = s.konzept === 'sepura-stp' ? 0 : LANG_MS;
    if (isPower && p.ms >= needed) {
      // Tastensperre beim Start nur, wo sie so programmiert ist (BOS-Kurzanleitung MTP850); Sepura startet entsperrt.
      const locked = s.konzept === 'motorola';
      const on: DeviceState = { ...initialDevice(s.konzept, s.gruppen), on: true, locked, volume: s.volume };
      return { state: withDisplay(on, locked ? sperrHinweis(s.konzept) : 'Bereit'), event: { type: 'power', on: true } };
    }
    return reject('Das Gerät ist ausgeschaltet.');
  }

  // Notruf: immer, auch gesperrt
  if (p.key === 'sos') {
    if (p.ms < NOTRUF_MS) return reject('Notruftaste 2 Sekunden drücken.', 'Notruf: 2 s halten');
    const active = !s.emergency;
    const next = { ...s, emergency: active, selecting: null, confirmEnd: false };
    return { state: withDisplay(next, active ? 'Notruf aktiv – sprechen' : 'Notruf beendet'), event: { type: 'emergency', active } };
  }
  // Sepura: rote Taste und bestätigen; Menü-Konzept: Softkey „Ende“
  if (s.emergency && p.key === 'red' && s.konzept !== 'motorola') {
    if (!s.confirmEnd) return { state: withDisplay({ ...s, confirmEnd: true }, 'Notruf beenden? ✆ = Ja') };
    return { state: withDisplay({ ...s, emergency: false, confirmEnd: false }, 'Notruf beendet'), event: { type: 'emergency', active: false } };
  }
  if (s.emergency && p.key === 'softR' && s.konzept === 'motorola') {
    return { state: withDisplay({ ...s, emergency: false }, 'Notruf beendet'), event: { type: 'emergency', active: false } };
  }

  // Ausschalten
  if (isPower && p.ms >= (s.konzept === 'sepura-stp' ? 2000 : LANG_MS)) {
    return { state: { ...initialDevice(s.konzept, s.gruppen), volume: s.volume }, event: { type: 'power', on: false } };
  }

  // Tastensperre
  if (s.konzept === 'motorola') {
    if (p.key === 'menu') return { state: withDisplay({ ...s, menuArmed: true }, s.locked ? 'Entsperren: *' : 'Menü') };
    if (p.key === 'star' && s.menuArmed) {
      const locked = !s.locked;
      return { state: withDisplay({ ...s, locked, menuArmed: false }, locked ? 'Tastatur gesperrt' : 'Tastatur entsperrt'), event: { type: locked ? 'locked' : 'unlocked' } };
    }
    s = { ...s, menuArmed: false };
  } else if (p.key === 'star' && p.ms >= LANG_MS) {
    const locked = !s.locked;
    return { state: withDisplay({ ...s, locked }, locked ? 'Tastatur gesperrt' : 'Tastatur entsperrt'), event: { type: locked ? 'locked' : 'unlocked' } };
  }

  // Sprechtaste: bestätigt eine offene Gruppenauswahl, sonst Senden (auch gesperrt)
  if (p.key === 'ptt') {
    if (s.selecting !== null) return confirmGroup(s);
    return { state: withDisplay(s, 'Senden …'), event: { type: 'ptt' } };
  }

  // Drehknopf: in der Auswahl blättern, sonst Lautstärke
  if (p.key === 'knobLeft' || p.key === 'knobRight') {
    const step = p.key === 'knobRight' ? 1 : -1;
    if (s.selecting !== null) {
      const list = liste(s);
      const selecting = (s.selecting + step + list.length) % list.length;
      return { state: withDisplay({ ...s, selecting }, `▸ ${list[selecting]}  (PTT = OK)`) };
    }
    const volume = Math.max(0, Math.min(9, s.volume + step));
    return { state: withDisplay({ ...s, volume }, `Lautstärke ${volume}`) };
  }

  // Seitentasten der SC-Geräte, die auch gesperrt gehen
  if (s.konzept === 'sepura-sc' && p.key === 'sideC') return sendStatus(s, 5);
  if (s.konzept === 'sepura-sc' && p.key === 'sideA') {
    const next = { ...s, mode: 'TMO' as Betriebsart, group: (s.gruppen ?? GRUPPEN).TMO[0], selecting: null };
    return { state: withDisplay(next, 'Schnellgruppe'), event: { type: 'group', group: next.group, mode: 'TMO' } };
  }

  if (s.locked) return reject('Die Tastatur ist gesperrt.', sperrHinweis(s.konzept));

  // Gruppenauswahl öffnen
  const auswahl = s.konzept === 'sepura-stp' ? 'mode' : s.konzept === 'sepura-sc' ? 'ctxM' : 'knobPress';
  if (p.key === auswahl) {
    if (s.selecting !== null) return { state: withDisplay({ ...s, selecting: null }, 'Abgebrochen') };
    const selecting = Math.max(0, liste(s).indexOf(s.group));
    return { state: withDisplay({ ...s, selecting }, `▸ ${liste(s)[selecting]}  (PTT = OK)`) };
  }

  // TMO/DMO
  if (p.key === 'sideB' && s.konzept !== 'motorola') return toggleMode(s);
  if (p.key === 'tmoDmo') return p.ms >= LANG_MS ? toggleMode(s) : reject('TMO/DMO-Taste gedrückt halten.', 'TMO/DMO: Taste halten');

  // Status per Zifferntaste
  if (/^\d$/.test(p.key)) {
    if (p.ms < k.statusMs) return reject(`Für einen Status die Taste ${k.statusMs / 1000} s halten.`, `Status: ${k.statusMs / 1000} s halten`);
    return sendStatus(s, Number(p.key));
  }

  return reject('Hier ohne Funktion.', '–');
}

export interface DeviceTarget { status?: number; group?: string; mode?: Betriebsart }

/** Aktion eines Szenarios, die am Funkgerät statt per Knopf ausgeführt wird. */
export function deviceTarget(action: Pick<Action, 'label' | 'device'> & { id?: string }): DeviceTarget | null {
  if (action.device) return action.device;
  const status = action.label.match(/^📟\s*Status (\d)\b/);
  if (status) return { status: Number(status[1]) };
  const dmo = action.label.match(/^📟.*\bDMO-Gruppe (\d{3})\b/);
  if (dmo) return { group: GRUPPEN.DMO.find(g => g.startsWith(dmo[1])) ?? dmo[1], mode: 'DMO' };
  return null;
}

/** Passt ein Geräte-Ereignis zu einem Ziel? */
export function matchesTarget(event: DeviceEvent, target: DeviceTarget): boolean {
  if (event.type === 'status') return target.status === event.status;
  if (event.type === 'group') return target.group === event.group && (!target.mode || target.mode === event.mode);
  return false;
}
