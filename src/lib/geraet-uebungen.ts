// Übungsprogramm „Funkgerät bedienen“: kurze Aufgaben, je ein oder mehrere Schritte am simulierten Gerät.
import { initialDevice, lockedDevice, readyDevice, type Anleitung, type DeviceEvent, type DeviceState, type KonzeptId } from './funkgeraet';

export interface Schritt {
  text: string;
  /** Welche Anleitung des Konzepts hilft. */
  hilfe: keyof Anleitung;
  ziel: (e: DeviceEvent, s: DeviceState) => boolean;
  /** Antwort der Leitstelle o. Ä. nach dem Schritt – erscheint im Display. */
  danach?: string;
}

export interface Uebung {
  id: string;
  titel: string;
  lage: string;
  start: (k: KonzeptId) => DeviceState;
  schritte: Schritt[];
}

export const UEBUNGEN: Uebung[] = [
  {
    id: 'einschalten', titel: 'Einschalten', lage: 'Dienstbeginn: Das Funkgerät liegt ausgeschaltet in der Ladeschale.',
    start: initialDevice,
    schritte: [{ text: 'Schalte das Funkgerät ein.', hilfe: 'einschalten', ziel: e => e.type === 'power' && e.on }],
  },
  {
    id: 'entsperren', titel: 'Tastensperre lösen', lage: 'Das Gerät ist an, aber die Tastatur ist gesperrt (🔒).',
    start: lockedDevice,
    schritte: [{ text: 'Hebe die Tastensperre auf.', hilfe: 'entsperren', ziel: e => e.type === 'unlocked' }],
  },
  {
    id: 'gruppe', titel: 'Gruppe wechseln', lage: 'Die Leitstelle: „Wechseln Sie für den Einsatz in die Gruppe RD_ERH.“',
    start: readyDevice,
    schritte: [{ text: 'Wechsle in die Gruppe RD_ERH.', hilfe: 'gruppe', ziel: e => e.type === 'group' && e.group === 'RD_ERH' && e.mode === 'TMO' }],
  },
  {
    id: 'dmo', titel: 'In den Direktbetrieb (DMO)', lage: 'Atemschutzeinsatz im Keller – der Gruppenführer ordnet Direktbetrieb an, Gruppe 307_F.',
    start: readyDevice,
    schritte: [{ text: 'Wechsle in den Direktbetrieb auf 307_F.', hilfe: 'dmo', ziel: e => e.type === 'group' && e.mode === 'DMO' && e.group === '307_F' }],
  },
  {
    id: 'zurueck', titel: 'Zurück ins Netz (TMO)', lage: 'Der Einsatz im Keller ist vorbei. Ihr sollt wieder im Netz auf FW_ERH erreichbar sein.',
    start: k => ({ ...readyDevice(k), mode: 'DMO', group: '307_F', display: ['DMO  307_F', 'Direktbetrieb'] }),
    schritte: [{ text: 'Wechsle zurück in den Netzbetrieb auf FW_ERH.', hilfe: 'dmo', ziel: e => e.type === 'group' && e.mode === 'TMO' && e.group === 'FW_ERH' }],
  },
  {
    id: 'status', titel: 'Status senden', lage: 'Ihr rückt aus. Das Gerät ist eingeschaltet, die Tastatur gesperrt.',
    start: lockedDevice,
    schritte: [
      { text: 'Hebe die Tastensperre auf.', hilfe: 'entsperren', ziel: e => e.type === 'unlocked' },
      { text: 'Sende Status 3 – Einsatz übernommen.', hilfe: 'status', ziel: e => e.type === 'status' && e.status === 3, danach: 'ILS: Status 3 quittiert' },
    ],
  },
  {
    id: 'sprechwunsch', titel: 'Sprechwunsch und J', lage: 'Du willst der Leitstelle etwas melden. Erst Sprechwunsch, dann warten, bis sie dich auffordert.',
    start: readyDevice,
    schritte: [
      { text: 'Sende Status 5 – Sprechwunsch.', hilfe: 'status', ziel: e => e.type === 'status' && e.status === 5, danach: 'J – Sprechaufforderung' },
      { text: 'Die Leitstelle schickt „J“: Drücke jetzt die Sprechtaste.', hilfe: 'status', ziel: e => e.type === 'ptt' },
    ],
  },
  {
    id: 'notruf', titel: 'Notruf auslösen und beenden', lage: 'Übung: Du bist in Gefahr und kannst nicht normal funken.',
    start: lockedDevice,
    schritte: [
      { text: 'Löse den Notruf aus – das geht auch mit Tastensperre.', hilfe: 'notruf', ziel: e => e.type === 'emergency' && e.active },
      { text: 'Die Leitstelle hat dich gehört. Beende den Notruf.', hilfe: 'notruf', ziel: e => e.type === 'emergency' && !e.active },
    ],
  },
  {
    id: 'sperren', titel: 'Tastatur sperren', lage: 'Das Gerät kommt in die Jackentasche – nichts soll versehentlich ausgelöst werden.',
    start: readyDevice,
    schritte: [{ text: 'Sperre die Tastatur.', hilfe: 'entsperren', ziel: e => e.type === 'locked' }],
  },
];

const KEY = 'fffunk.geraet-uebungen';

export function loadErledigt(konzept: KonzeptId): string[] {
  try { return JSON.parse(localStorage.getItem(`${KEY}.${konzept}`) || '[]'); } catch { return []; }
}

export function markErledigt(konzept: KonzeptId, id: string): string[] {
  const list = Array.from(new Set([...loadErledigt(konzept), id]));
  try { localStorage.setItem(`${KEY}.${konzept}`, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}
