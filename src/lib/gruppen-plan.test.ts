// Gruppenübungen: Jede Organisation hat für jede Gruppengröße genug Szenarien, und niemand schweigt lange.
import { describe, expect, it } from 'vitest';
import { GRUPPEN_SZENARIEN, szenarienFuer } from '../data/gruppen';
import { ORGS, type OrgId } from '../types/gruppe';
import { MAX_TEILNEHMER, MIN_TEILNEHMER, bauePlan, laengstePause, pruefeSzenario, teileAuf } from './gruppen-plan';

const GROESSEN = Array.from({ length: MAX_TEILNEHMER - MIN_TEILNEHMER + 1 }, (_, i) => i + MIN_TEILNEHMER);

describe('teileAuf', () => {
  it('bildet Abschnitte mit zwei bis vier Personen, möglichst gleich groß', () => {
    expect(teileAuf(2)).toEqual([2]);
    expect(teileAuf(4)).toEqual([4]);
    expect(teileAuf(5)).toEqual([3, 2]);
    expect(teileAuf(7)).toEqual([4, 3]);
    expect(teileAuf(13)).toEqual([4, 3, 3, 3]);
    expect(teileAuf(20)).toEqual([4, 4, 4, 4, 4]);
    for (const n of GROESSEN) {
      const t = teileAuf(n);
      expect(t.reduce((a, b) => a + b, 0)).toBe(n);
      expect(Math.min(...t)).toBeGreaterThanOrEqual(2);
      expect(Math.max(...t) - Math.min(...t)).toBeLessThanOrEqual(1);
    }
  });

  it('lehnt Größen außerhalb von 2 bis 20 ab', () => {
    expect(() => teileAuf(1)).toThrow();
    expect(() => teileAuf(21)).toThrow();
  });
});

describe('Szenariodaten', () => {
  it('haben eindeutige IDs', () => {
    const ids = GRUPPEN_SZENARIEN.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(GRUPPEN_SZENARIEN.map(s => [s.id, s] as const))('%s hält die Regeln ein', (_id, sz) => {
    expect(pruefeSzenario(sz)).toEqual([]);
  });

  it.each(Object.keys(ORGS) as OrgId[])('%s: mindestens vier Szenarien für jede Gruppengröße', org => {
    expect(szenarienFuer(org).length).toBeGreaterThanOrEqual(4);
  });
});

describe('bauePlan', () => {
  it.each(GRUPPEN_SZENARIEN.map(s => [s.id, s] as const))('%s: für 2 bis 20 Personen spielbar, niemand schweigt lange', (_id, sz) => {
    for (const n of GROESSEN) {
      for (let versatz = 0; versatz < 5; versatz++) {
        const plan = bauePlan(sz, n, { versatz });
        expect(plan.slots).toHaveLength(n);
        expect(plan.threads).toHaveLength(teileAuf(n).length);
        for (const slot of plan.slots) {
          const thread = plan.threads.find(t => t.funk.some(f => f.slot === slot.id));
          expect(thread, `${slot.rolle} funkt nie (n=${n})`).toBeDefined();
          expect(thread!.funk.filter(f => f.slot === slot.id).length).toBeGreaterThanOrEqual(4);
          // höchstens drei Gespräche (je vier Funksprüche) am Stück ohne eigenen Funkspruch
          expect(laengstePause(thread!, slot.id), `${slot.rolle} (n=${n})`).toBeLessThanOrEqual(13);
        }
        for (const t of plan.threads) {
          expect(t.funk.length).toBeGreaterThanOrEqual(20);
          for (const f of t.funk) expect(plan.gruppen).toContain(f.gruppe);
        }
      }
    }
  });

  it('setzt die eigenen Rufnamen der Organisation ein', () => {
    const sz = GRUPPEN_SZENARIEN.find(s => s.id === 'fw_wohnungsbrand')!;
    const plan = bauePlan(sz, 2, { rufnamen: { 'Florian Neuhaus 42/1': 'Florian Musterdorf 40/1' } });
    expect(plan.slots[0].rufname).toBe('Florian Musterdorf 40/1');
    expect(plan.threads[0].funk[0].text).toBe('Angriffstrupp von Florian Musterdorf 40/1, kommen.');
    expect(plan.threads[0].funk[0].kern).toContain('Florian Musterdorf 40/1');
  });

  it('macht aus einem Gespräch Anruf, Antwort, Meldung und Quittung', () => {
    const sz = GRUPPEN_SZENARIEN.find(s => s.id === 'fw_wohnungsbrand')!;
    const [anruf, antwort, meldung, quittung] = bauePlan(sz, 2).threads[0].funk;
    expect([anruf.art, antwort.art, meldung.art, quittung.art]).toEqual(['anruf', 'antwort', 'meldung', 'quittung']);
    expect([anruf.slot, antwort.slot, meldung.slot, quittung.slot]).toEqual([0, 1, 0, 1]);
    expect(antwort.text).toBe('Hier Angriffstrupp, kommen.');
    expect(meldung.text.endsWith(', kommen.')).toBe(true);
    expect(quittung.text.endsWith(', Ende.')).toBe(true);
  });

  it('lässt unbesetzte Positionen vom Computer sprechen', () => {
    const sz = GRUPPEN_SZENARIEN.find(s => s.id === 'fw_wohnungsbrand')!;
    const funk = bauePlan(sz, 2).threads[0].funk;
    expect(funk.some(f => f.slot === null && f.sprecher === 'Atemschutzüberwachung')).toBe(true);
    expect(funk.some(f => f.slot === null && f.sprecher === 'Florian Neuhaus 11/1' && f.gruppe === 'FW_ERH')).toBe(true);
  });
});
