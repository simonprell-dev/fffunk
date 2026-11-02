// Jede Übung des Gerätetrainers ist mit jedem Bedienkonzept lösbar – mit der Tastenfolge aus der Anleitung.
import { describe, expect, it } from 'vitest';
import { KONZEPTE, press, type DeviceState, type KonzeptId, type Press } from './funkgeraet';
import { UEBUNGEN } from './geraet-uebungen';

const k = (key: Press['key'], ms = 150): Press => ({ key, ms });

/** Tastenfolgen so, wie sie in der Anleitung des jeweiligen Konzepts stehen. */
const LOESUNG: Record<KonzeptId, Record<string, Press[]>> = {
  'sepura-stp': {
    einschalten: [k('mode')], entsperren: [k('star', 1200)], gruppe: [k('mode'), k('knobRight'), k('ptt')],
    dmo: [k('sideB')], zurueck: [k('sideB')], status: [k('star', 1200), k('3', 1200)],
    sprechwunsch: [k('5', 1200), k('ptt')], notruf: [k('sos', 2100), k('sos', 2100)], sperren: [k('star', 1200)],
  },
  'sepura-sc': {
    einschalten: [k('red', 1200)], entsperren: [k('star', 1200)], gruppe: [k('ctxM'), k('knobRight'), k('ptt')],
    dmo: [k('sideB')], zurueck: [k('sideB')], status: [k('star', 1200), k('3', 1200)],
    sprechwunsch: [k('sideC'), k('ptt')], notruf: [k('sos', 2100), k('red')], sperren: [k('star', 1200)],
  },
  motorola: {
    einschalten: [k('power', 1500)], entsperren: [k('menu'), k('star')], gruppe: [k('knobPress'), k('knobRight'), k('ptt')],
    dmo: [k('tmoDmo')], zurueck: [k('tmoDmo')], status: [k('menu'), k('star'), k('3', 2100)],
    sprechwunsch: [k('5', 2100), k('ptt')], notruf: [k('sos', 2100), k('softR')], sperren: [k('menu'), k('star')],
  },
};

describe('Gerätetrainer', () => {
  it('hat neun Übungen in sinnvoller Reihenfolge', () => {
    expect(UEBUNGEN.map(u => u.id)).toEqual(['einschalten', 'entsperren', 'gruppe', 'dmo', 'zurueck', 'status', 'sprechwunsch', 'notruf', 'sperren']);
  });

  for (const konzept of Object.keys(KONZEPTE) as KonzeptId[]) {
    for (const u of UEBUNGEN) {
      it(`${konzept}: „${u.titel}“ ist lösbar`, () => {
        let state: DeviceState = u.start(konzept);
        let schritt = 0;
        for (const p of LOESUNG[konzept][u.id]) {
          const r = press(state, p);
          state = r.state;
          if (r.event && schritt < u.schritte.length && u.schritte[schritt].ziel(r.event, state)) schritt++;
        }
        expect(schritt).toBe(u.schritte.length);
      });
    }
  }

  it('ein falsches Konzept löst die Tastensperre nicht (Motorola-Folge am Sepura)', () => {
    const u = UEBUNGEN.find(x => x.id === 'entsperren')!;
    let state = u.start('sepura-stp');
    let ok = false;
    for (const p of LOESUNG.motorola.entsperren) {
      const r = press(state, p);
      state = r.state;
      if (r.event && u.schritte[0].ziel(r.event, state)) ok = true;
    }
    expect(ok).toBe(false);
  });
});
