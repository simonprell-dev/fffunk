// Ablauf einer Gruppenübung auf dem Server: Beitreten, Positionen, Funksprüche, Punkte, Auswertung.
import { describe, expect, it } from 'vitest';
// @ts-expect-error – reines JS-Modul aus scripts/, vom Server genutzt
import * as E from '../../scripts/gruppen-engine.mjs';
import { GRUPPEN_SZENARIEN } from '../data/gruppen';
import { bauePlan } from './gruppen-plan';

const sz = GRUPPEN_SZENARIEN.find(s => s.id === 'fw_wohnungsbrand')!;
const T0 = 1_000_000;
const erster = () => 0; // „Zufall“: immer die erste freie Position
const geraet = (n: number) => `geraet-${n}-xxxxxxxx`;

function uebung(n: number, optionen = {}) {
  return E.neueUebung({ code: 'TEST42', leiterId: 1, plan: bauePlan(sz, n), optionen, jetzt: T0 });
}

/** Spielt die Übung durch: Menschen treffen alle Kernbegriffe, der Computer bekommt seine Zeit. */
function spieleDurch(u: any, treffer: (tn: string) => number = () => 1) {
  let jetzt = T0;
  for (let runde = 0; runde < 2000 && u.phase === 'laeuft'; runde++) {
    jetzt += 20_000;
    E.tick(u, jetzt);
    u.plan.threads.forEach((_t: unknown, i: number) => {
      const funk = E.aktuell(u, i);
      const tn = funk && funk.slot !== null ? u.slots[funk.slot].tn : null;
      if (!tn) return;
      const n = Math.round(funk.kern.length * treffer(tn));
      E.melde(u, tn, { thread: i, idx: u.threads[i].pos, treffer: funk.kern.map((_k: string, j: number) => j < n), text: 'x' }, jetzt);
    });
  }
  return jetzt;
}

describe('Beitreten und Positionen', () => {
  it('verteilt über den Zufallslink auf freie Positionen und merkt sich das Gerät', () => {
    const u = uebung(3);
    const a = E.beitreten(u, { geraet: geraet(1), name: 'Anna', zufall: erster });
    const b = E.beitreten(u, { geraet: geraet(2), name: 'Ben', zufall: erster });
    expect([a.slot, b.slot]).toEqual([0, 1]);
    // dasselbe Gerät lädt die Seite neu → gleiche Person, gleiche Position
    expect(E.beitreten(u, { geraet: geraet(1), name: 'Anna', zufall: erster }).id).toBe(a.id);
    expect(Object.keys(u.teilnehmer)).toHaveLength(2);
  });

  it('gemischt: reservierte Positionen nur per Positions-Link, der Rest per Zufall', () => {
    const u = uebung(3);
    E.setzeFest(u, 0, true); // Gruppenführer vergibt die Übungsleitung selbst
    const zufall = E.beitreten(u, { geraet: geraet(1), zufall: erster });
    expect(zufall.slot).toBe(1);
    const gf = E.beitreten(u, { geraet: geraet(2), token: u.slots[0].token });
    expect(gf.slot).toBe(0);
    expect(() => E.beitreten(u, { geraet: geraet(3), token: u.slots[0].token })).toThrow(/schon besetzt/);
    expect(() => E.beitreten(u, { geraet: geraet(3), token: 'falsch' })).toThrow(/gehört nicht/);
  });

  it('wer keinen freien Zufallsplatz findet, wartet auf die Übungsleitung', () => {
    const u = uebung(2);
    E.setzeFest(u, 0, true);
    E.setzeFest(u, 1, true);
    const tn = E.beitreten(u, { geraet: geraet(1), name: 'Cem' });
    expect(tn.slot).toBeNull();
    expect(E.sicht(u, { leiter: true }).wartende).toEqual([{ tn: tn.id, name: 'Cem', online: false }]);
    E.weiseZu(u, tn.id, 1);
    expect(u.slots[1].tn).toBe(tn.id);
  });

  it('Zuweisen auf eine besetzte Position tauscht die beiden', () => {
    const u = uebung(2);
    const a = E.beitreten(u, { geraet: geraet(1), zufall: erster });
    const b = E.beitreten(u, { geraet: geraet(2), zufall: erster });
    E.weiseZu(u, a.id, 1);
    expect([u.teilnehmer[a.id].slot, u.teilnehmer[b.id].slot]).toEqual([1, 0]);
    expect([u.slots[0].tn, u.slots[1].tn]).toEqual([b.id, a.id]);
  });

  it('lehnt kaputte Pläne ab', () => {
    const plan = bauePlan(sz, 2);
    expect(() => E.pruefePlan({ ...plan, slots: plan.slots.slice(0, 1) })).toThrow();
    expect(() => E.pruefePlan({ ...plan, org: 'zirkus' })).toThrow();
    expect(() => E.pruefePlan({ ...plan, threads: [{ ...plan.threads[0], funk: [{ ...plan.threads[0].funk[0], slot: 7 }] }] })).toThrow();
  });
});

describe('Ablauf', () => {
  it('startet erst, wenn jemand auf einer Position ist', () => {
    const u = uebung(2);
    expect(() => E.starte(u, T0)).toThrow(/niemand/);
  });

  it('läuft bis zum Ende; unbesetzte Positionen spricht der Computer', () => {
    const u = uebung(5); // zwei Abschnitte, nur drei von fünf Positionen besetzt
    for (const n of [1, 2, 3]) E.beitreten(u, { geraet: geraet(n), name: `P${n}`, zufall: erster });
    E.starte(u, T0);
    spieleDurch(u);
    expect(u.phase).toBe('ende');
    const a = E.auswertung(u);
    expect(a.team).toBe(100);
    expect(a.teilnehmer).toHaveLength(3);
    expect(a.threads[0].punkte).toBe(100);
    expect(a.threads[1].punkte).toBeNull(); // im zweiten Abschnitt saß niemand
  });

  it('nur wer an der Reihe ist, kann melden', () => {
    const u = uebung(2);
    const a = E.beitreten(u, { geraet: geraet(1), zufall: erster });
    const b = E.beitreten(u, { geraet: geraet(2), zufall: erster });
    E.starte(u, T0);
    expect(E.aktuell(u, 0).slot).toBe(a.slot);
    expect(() => E.melde(u, b.id, { thread: 0, idx: 0, treffer: [true] }, T0)).toThrow(/nicht mehr an der Reihe/);
    expect(() => E.melde(u, a.id, { thread: 0, idx: 5, treffer: [true] }, T0)).toThrow();
  });

  it('gibt bei zu wenigen Kernbegriffen einen zweiten Versuch und wertet ihn leicht ab', () => {
    const u = uebung(2);
    const a = E.beitreten(u, { geraet: geraet(1), zufall: erster });
    E.beitreten(u, { geraet: geraet(2), zufall: erster });
    E.starte(u, T0);
    // Anruf hat drei Kernbegriffe: Gegenstelle, eigener Rufname, „kommen“
    expect(E.melde(u, a.id, { thread: 0, idx: 0, treffer: [true, false, false] }, T0)).toEqual({ nochmal: true, punkte: 33 });
    expect(u.threads[0].pos).toBe(0);
    expect(E.sicht(u, { tnId: a.id }).threads[0].aktuell.versuch).toBe(2);
    expect(E.melde(u, a.id, { thread: 0, idx: 0, treffer: [true, true, true] }, T0)).toEqual({ nochmal: false, punkte: 90 });
    expect(u.threads[0].pos).toBe(1);
  });

  it('zählt Funksprüche ohne Spracherkennung und übersprungene nicht in die Punkte', () => {
    const u = uebung(2);
    const a = E.beitreten(u, { geraet: geraet(1), zufall: erster });
    const b = E.beitreten(u, { geraet: geraet(2), zufall: erster });
    E.starte(u, T0);
    E.melde(u, a.id, { thread: 0, idx: 0, ohneWertung: true }, T0);
    E.ueberspringe(u, 0, T0); // Antwort von b hängt
    expect(E.punkteVon(u, a.id)).toEqual({ punkte: null, funksprueche: 1 });
    expect(E.punkteVon(u, b.id)).toEqual({ punkte: null, funksprueche: 0 });
    expect(u.threads[0].pos).toBe(2);
  });

  it('endet spätestens nach sechs Stunden', () => {
    const u = uebung(2);
    E.beitreten(u, { geraet: geraet(1), zufall: erster });
    E.starte(u, T0);
    expect(E.tick(u, T0 + E.MAX_DAUER_MS - 1)).toBe(false);
    E.tick(u, T0 + E.MAX_DAUER_MS);
    expect(u.phase).toBe('ende');
  });
});

describe('Sicht und Auswertung', () => {
  it('zeigt fremde Funksprüche erst, wenn sie gesprochen sind', () => {
    const u = uebung(2);
    const a = E.beitreten(u, { geraet: geraet(1), zufall: erster });
    const b = E.beitreten(u, { geraet: geraet(2), zufall: erster });
    E.starte(u, T0);
    const sa = E.sicht(u, { tnId: a.id }).threads[0].aktuell;
    const sb = E.sicht(u, { tnId: b.id }).threads[0].aktuell;
    expect(sa.text).toBe('Angriffstrupp von Florian Neuhaus 42/1, kommen.');
    expect(sa.kern).toContain('kommen');
    expect(sb.text).toBeUndefined();
    expect(sb.kern).toBeUndefined();
    E.melde(u, a.id, { thread: 0, idx: 0, treffer: [true, true, true] }, T0);
    expect(E.sicht(u, { tnId: b.id }).threads[0].letzter.text).toBe(sa.text);
  });

  it('Teilnehmende sehen nur ihren Abschnitt und keine Positions-Links', () => {
    const u = uebung(5);
    const a = E.beitreten(u, { geraet: geraet(1), zufall: erster });
    E.starte(u, T0);
    const s = E.sicht(u, { tnId: a.id });
    expect(s.threads).toHaveLength(1);
    expect(s.slots.every((x: any) => x.token === undefined)).toBe(true);
    expect(E.sicht(u, { leiter: true }).slots[0].token).toBe(u.slots[0].token);
  });

  it('namentlich: die Übungsleitung sieht Namen, Positionen und Punkte', () => {
    const u = uebung(2);
    const a = E.beitreten(u, { geraet: geraet(1), name: 'Anna', zufall: erster });
    E.beitreten(u, { geraet: geraet(2), name: 'Ben', zufall: erster });
    E.starte(u, T0);
    spieleDurch(u, tn => (tn === a.id ? 1 : 0.7));
    const leiter = E.sicht(u, { leiter: true }).auswertung;
    expect(leiter.teilnehmer.map((t: any) => t.name)).toEqual(['Anna', 'Ben']);
    expect(leiter.teilnehmer[0].rolle).toBe('Gruppenführer');
    expect(leiter.teilnehmer[0].punkte).toBe(100);
    // Teilnehmende: eigenes Ergebnis und Gesamtergebnis, keine Liste
    const ich = E.sicht(u, { tnId: a.id });
    expect(ich.meins.punkte).toBe(100);
    expect(ich.auswertung.teilnehmer).toEqual([]);
    expect(ich.auswertung.team).toBe(leiter.team);
  });

  it('anonym: keine Namen, keine Positionen, auch nicht während der Übung', () => {
    const u = uebung(2, { anonym: true });
    const a = E.beitreten(u, { geraet: geraet(1), name: 'Anna', zufall: erster });
    E.beitreten(u, { geraet: geraet(2), name: 'Ben', zufall: erster });
    E.starte(u, T0);
    E.melde(u, a.id, { thread: 0, idx: 0, treffer: [true, true, true] }, T0);
    const laeuft = E.sicht(u, { leiter: true });
    expect(laeuft.slots.every((x: any) => x.name === undefined)).toBe(true);
    expect(laeuft.threads[0].letzter.punkte).toBeUndefined();
    spieleDurch(u, tn => (tn === a.id ? 0.7 : 1));
    const ende = E.sicht(u, { leiter: true }).auswertung;
    expect(JSON.stringify(ende)).not.toMatch(/Anna|Ben|Gruppenführer/);
    expect(ende.teilnehmer.map((t: any) => t.name)).toEqual(['Person 1', 'Person 2']);
    expect(ende.teilnehmer[0].punkte).toBeGreaterThan(ende.teilnehmer[1].punkte);
  });

  it('Notruf am virtuellen Funkgerät erscheint bei allen', () => {
    const u = uebung(2, { funk: true });
    const a = E.beitreten(u, { geraet: geraet(1), zufall: erster });
    const b = E.beitreten(u, { geraet: geraet(2), zufall: erster });
    E.setzeNotruf(u, b.id, true);
    expect(E.sicht(u, { tnId: a.id }).notruf).toEqual({ rufname: 'Angriffstrupp', gruppe: '307_F' });
    E.setzeNotruf(u, a.id, false); // nur wer ihn ausgelöst hat (oder die Übungsleitung) beendet ihn
    expect(u.notruf).not.toBeNull();
    E.setzeNotruf(u, b.id, false);
    expect(u.notruf).toBeNull();
  });
});
