// Bedienkonzepte der Digitalfunk-Handfunkgeräte (Sepura STP, Sepura SC2x, Motorola) als Zustandsmaschine.
import { describe, expect, it } from 'vitest';
import {
  KONZEPTE, type DeviceEvent, type DeviceState, type KonzeptId, type Press,
  deviceTarget, initialDevice, press,
} from './funkgeraet';

/** Spielt eine Tastenfolge ab und sammelt die Ereignisse. */
function play(konzept: KonzeptId, presses: Press[], start?: Partial<DeviceState>) {
  let state: DeviceState = { ...initialDevice(konzept), ...start };
  const events: DeviceEvent[] = [];
  for (const p of presses) {
    const r = press(state, p);
    state = r.state;
    if (r.event) events.push(r.event);
  }
  return { state, events };
}
const last = <T,>(list: T[]): T | undefined => list[list.length - 1];
const kurz = (key: Press['key']): Press => ({ key, ms: 150 });
const lang = (key: Press['key'], ms = 2200): Press => ({ key, ms });

describe('Konzepte', () => {
  it('bietet drei Bedienkonzepte mit Namen und Gerät', () => {
    expect(Object.keys(KONZEPTE)).toEqual(['sepura-stp', 'sepura-sc', 'motorola']);
    for (const k of Object.values(KONZEPTE)) {
      expect(k.name).not.toBe('');
      expect(k.geraete).not.toBe('');
      for (const a of ['einschalten', 'entsperren', 'gruppe', 'dmo', 'status', 'notruf'] as const) expect(k.anleitung[a], a).not.toBe('');
    }
  });

  it('startet ausgeschaltet im Netzbetrieb auf der Feuerwehr-Gruppe', () => {
    for (const id of Object.keys(KONZEPTE) as KonzeptId[]) {
      expect(initialDevice(id)).toMatchObject({ konzept: id, on: false, mode: 'TMO', group: 'FW_ERH' });
    }
  });
});

describe('Sepura STP (Mode-Taste + Drehknopf)', () => {
  it('Mode kurz schaltet ein – eine Tastensperre beim Start gibt es bei Sepura nicht', () => {
    const { state, events } = play('sepura-stp', [kurz('mode')]);
    expect(state).toMatchObject({ on: true, locked: false });
    expect(events).toContainEqual({ type: 'power', on: true });
  });

  it('Gruppenauswahl wird nach kurzer Wartezeit auch ohne PTT übernommen', () => {
    const { state, events } = play('sepura-stp', [kurz('mode'), kurz('mode'), kurz('knobRight'), { key: 'timeout', ms: 0 }]);
    expect(state.group).toBe('RD_ERH');
    expect(last(events)).toEqual({ type: 'group', group: 'RD_ERH', mode: 'TMO' });
  });

  it('ausgeschaltet: Notruftaste 3 s schaltet ein und löst den Notruf aus', () => {
    const { state, events } = play('sepura-stp', [lang('sos', 3100)]);
    expect(state).toMatchObject({ on: true, emergency: true });
    expect(last(events)).toEqual({ type: 'emergency', active: true });
    expect(play('sepura-stp', [lang('sos', 2100)]).state.on).toBe(false);
  });

  it('im DMO kommt die zuletzt genutzte DMO-Gruppe zurück', () => {
    const { state } = play('sepura-stp', [kurz('mode'), kurz('sideB'), kurz('mode'), kurz('knobRight'), kurz('ptt'), kurz('sideB'), kurz('sideB')]);
    expect(state).toMatchObject({ mode: 'DMO', group: '308_F' });
  });

  it('Stern lang entsperrt; gesperrt werden Ziffern abgewiesen', () => {
    const gesperrt = play('sepura-stp', [kurz('mode'), lang('star', 1200), lang('3')]);
    expect(last(gesperrt.events)).toMatchObject({ type: 'rejected' });
    expect(gesperrt.state.display.join(' ')).toMatch(/gesperrt/i);
    const { state, events } = play('sepura-stp', [kurz('mode'), lang('star', 1200), lang('star', 1200)]);
    expect(state.locked).toBe(false);
    expect(last(events)).toEqual({ type: 'unlocked' });
  });

  it('Gruppe wechseln: Mode, Drehknopf, PTT bestätigt', () => {
    const { state, events } = play('sepura-stp', [kurz('mode'), kurz('mode'), kurz('knobRight'), kurz('ptt')], {});
    expect(state.group).toBe('RD_ERH');
    expect(last(events)).toEqual({ type: 'group', group: 'RD_ERH', mode: 'TMO' });
  });

  it('PTT ohne Auswahl ist Senden', () => {
    const { events } = play('sepura-stp', [kurz('mode'), kurz('ptt')]);
    expect(last(events)).toEqual({ type: 'ptt' });
  });

  it('Status: Zifferntaste lang (ab 1 s), kurz reicht nicht', () => {
    const zuKurz = play('sepura-stp', [kurz('mode'), kurz('3')]);
    expect(zuKurz.events.some(e => e.type === 'status')).toBe(false);
    const { state, events } = play('sepura-stp', [kurz('mode'), lang('3', 1100)]);
    expect(last(events)).toEqual({ type: 'status', status: 3 });
    expect(state.display.join(' ')).toMatch(/Status 3 gesendet/);
  });

  it('TMO/DMO über die Seitentaste, im DMO steht die Gruppe 307_F', () => {
    const { state, events } = play('sepura-stp', [kurz('mode'), kurz('sideB')]);
    expect(state).toMatchObject({ mode: 'DMO', group: '307_F' });
    expect(last(events)).toEqual({ type: 'group', group: '307_F', mode: 'DMO' });
  });

  it('Notruf: 2 Sekunden auch bei Tastensperre; erneut 2 Sekunden beendet', () => {
    const an = play('sepura-stp', [kurz('mode'), lang('star', 1200), lang('sos', 2000)]);
    expect(an.state.emergency).toBe(true);
    expect(last(an.events)).toEqual({ type: 'emergency', active: true });
    const kurzerDruck = play('sepura-stp', [kurz('mode'), lang('sos', 800)]);
    expect(kurzerDruck.state.emergency).toBe(false);
    const aus = play('sepura-stp', [kurz('mode'), lang('sos', 2000), lang('sos', 2000)]);
    expect(last(aus.events)).toEqual({ type: 'emergency', active: false });
  });

  it('Mode lang schaltet aus', () => {
    expect(play('sepura-stp', [kurz('mode'), lang('mode', 2500)]).state.on).toBe(false);
  });

  it('ausgeschaltet reagiert nur die Einschalttaste', () => {
    const { state, events } = play('sepura-stp', [lang('3'), kurz('ptt')]);
    expect(state.on).toBe(false);
    expect(events.every(e => e.type === 'rejected')).toBe(true);
  });
});

describe('Sepura SC20/21 (Kontexttaste + Seitentasten)', () => {
  it('rote Taste lang schaltet ein', () => {
    expect(play('sepura-sc', [lang('red', 1500)]).state.on).toBe(true);
  });

  it('Gruppe: mittlere Kontexttaste, Drehknopf, PTT', () => {
    const { state } = play('sepura-sc', [lang('red', 1500), kurz('ctxM'), kurz('knobRight'), kurz('knobRight'), kurz('ptt')]);
    expect(state.group).toBe('KatS_ERH');
  });

  it('rote Taste beendet den Notruf erst nach Bestätigung', () => {
    const einmal = play('sepura-sc', [lang('red', 2100), lang('sos', 2100), kurz('red')]);
    expect(einmal.state.emergency).toBe(true);
    expect(einmal.state.display.join(' ')).toMatch(/beenden\?/);
    const zweimal = play('sepura-sc', [lang('red', 2100), lang('sos', 2100), kurz('red'), kurz('red')]);
    expect(last(zweimal.events)).toEqual({ type: 'emergency', active: false });
  });

  it('Seitentaste C sendet den Sprechwunsch (Status 5) auch gesperrt', () => {
    const { events } = play('sepura-sc', [lang('red', 1500), lang('star', 1200), kurz('sideC')]);
    expect(last(events)).toEqual({ type: 'status', status: 5 });
  });

  it('die Mode-Taste gibt es nicht', () => {
    const { events } = play('sepura-sc', [lang('red', 1500), kurz('mode')]);
    expect(last(events)).toMatchObject({ type: 'rejected' });
  });
});

describe('Motorola (Menü + Drehknopf)', () => {
  it('Ein/Aus halten schaltet ein, die Sperre ist aktiv', () => {
    expect(play('motorola', [lang('power', 1500)]).state).toMatchObject({ on: true, locked: true });
  });

  it('entsperren mit Menü und dann Stern – Stern lang allein reicht nicht', () => {
    expect(play('motorola', [lang('power', 1500), lang('star', 1500)]).state.locked).toBe(true);
    const { state, events } = play('motorola', [lang('power', 1500), kurz('menu'), kurz('star')]);
    expect(state.locked).toBe(false);
    expect(last(events)).toEqual({ type: 'unlocked' });
  });

  it('Gruppe: Drehknopf drücken, drehen, PTT bucht ein', () => {
    const { state } = play('motorola', [lang('power', 1500), kurz('menu'), kurz('star'), kurz('knobPress'), kurz('knobLeft'), kurz('ptt')]);
    expect(state.group).toBe('SoG_1_N');
  });

  it('Status erst nach 2 Sekunden', () => {
    const start = [lang('power', 1500), kurz('menu'), kurz('star')];
    expect(play('motorola', [...start, lang('4', 1200)]).events.some(e => e.type === 'status')).toBe(false);
    expect(last(play('motorola', [...start, lang('4', 2100)]).events)).toEqual({ type: 'status', status: 4 });
  });

  it('TMO/DMO-Umschalter gedrückt halten, kurz reicht nicht', () => {
    expect(play('motorola', [lang('power', 1500), kurz('menu'), kurz('star'), kurz('tmoDmo')]).state.mode).toBe('TMO');
    expect(play('motorola', [lang('power', 1500), kurz('menu'), kurz('star'), lang('tmoDmo', 1200)]).state.mode).toBe('DMO');
  });

  it('Notruf beenden mit dem rechten Softkey „Ende“', () => {
    const { events } = play('motorola', [lang('power', 1500), lang('sos', 2000), kurz('softR')]);
    expect(last(events)).toEqual({ type: 'emergency', active: false });
  });
});

describe('Status nur im Netzbetrieb', () => {
  it('im DMO wird kein Status gesendet', () => {
    const { events, state } = play('sepura-stp', [kurz('mode'), kurz('sideB'), lang('3', 1100)]);
    expect(last(events)).toMatchObject({ type: 'rejected' });
    expect(state.display.join(' ')).toMatch(/TMO/);
  });
});

describe('deviceTarget – Szenario-Aktionen, die am Gerät ausgeführt werden', () => {
  it('erkennt Status-Tasten', () => {
    expect(deviceTarget({ id: 'a', label: '📟 Status 3 – Einsatz übernommen' })).toEqual({ status: 3 });
    expect(deviceTarget({ id: 'a', label: '📟 Status 0 – dringender Sprechwunsch' })).toEqual({ status: 0 });
  });

  it('erkennt den Wechsel in eine DMO-Gruppe', () => {
    expect(deviceTarget({ id: 'a', label: '📟 In die DMO-Gruppe 307 wechseln und dort den Abschnitt rufen' })).toEqual({ group: '307_F', mode: 'DMO' });
  });

  it('nimmt eine ausdrückliche Angabe vor dem Text', () => {
    expect(deviceTarget({ id: 'a', label: 'Weiter', device: { status: 6 } })).toEqual({ status: 6 });
  });

  it('übrige Aktionen bleiben Knöpfe', () => {
    expect(deviceTarget({ id: 'a', label: '📟 Kein Status, die Leitstelle sieht uns ja auf dem Navi' })).toBeNull();
    expect(deviceTarget({ id: 'a', label: '👍 Verstanden' })).toBeNull();
  });
});
