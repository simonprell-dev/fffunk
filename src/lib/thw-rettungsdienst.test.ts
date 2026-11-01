// Inhaltsprüfung der THW- und Rettungsdienst-Szenarien: erreichbar, ohne Sackgassen, Funkregeln eingehalten.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Scenario } from '../types/story';

const load = (path: string): Scenario =>
  JSON.parse(readFileSync(new URL(`../../public/scenarios/${path}`, import.meta.url), 'utf8'));
const index = JSON.parse(readFileSync(new URL('../../public/scenarios/index.json', import.meta.url), 'utf8'));
const SPECIAL = ['__exit__', '__chapters__', '__next_chapter__'];

const folder = (name: string): Scenario[] => (index.builtin[name] as string[]).map(load);
const thw = folder('thw');
const rd = folder('rettungsdienst');

function targets(s: Scenario, nodeId: string): string[] {
  return s.nodes[nodeId].actions.flatMap(a =>
    a.radioCall ? [a.radioCall.onSuccess, a.radioCall.onFailure] : a.nextNodeId ? [a.nextNodeId] : []);
}

function reachable(s: Scenario, from: string): Set<string> {
  const seen = new Set<string>();
  const todo = [from];
  while (todo.length) {
    const id = todo.pop()!;
    if (seen.has(id) || !s.nodes[id]) continue;
    seen.add(id);
    todo.push(...targets(s, id));
  }
  return seen;
}

const hints = (s: Scenario) =>
  Object.values(s.nodes).flatMap(n => n.actions.flatMap(a => (a.radioCall ? [a.radioCall] : [])));

describe('THW- und Rettungsdienst-Ordner', () => {
  it('enthalten je eine Grundausbildung und die Einsatz-Szenarien', () => {
    expect(thw.map(s => s.id).sort()).toEqual([
      'thw_anmarsch_verband', 'thw_beleuchtung_feuerwehr', 'thw_deich_sandsack',
      'thw_gebaeudeschaden_bergung', 'thw_grundausbildung', 'thw_hochwasser_pumpen',
    ]);
    expect(rd.map(s => s.id).sort()).toEqual([
      'rd_bedrohung_notruf', 'rd_einsatzablauf_rtw', 'rd_fahrzeugdefekt', 'rd_grundausbildung',
      'rd_manv_ersteintreffend', 'rd_notarzt_nachfordern', 'rd_schlaganfall_anmeldung',
    ]);
  });

  for (const s of [...thw, ...rd]) {
    describe(s.id, () => {
      it('hat eine passende Rolle', () => {
        const roles = s.id.startsWith('thw') ? ['thw_helfer', 'thw_gruppenführer'] : ['rettungsdienst'];
        expect(roles).toContain(s.playerRole);
      });

      it('verweist nur auf vorhandene Knoten oder Sonderziele', () => {
        for (const id of Object.keys(s.nodes))
          for (const t of targets(s, id)) expect(s.nodes[t] || SPECIAL.includes(t), `${id} → ${t}`).toBeTruthy();
      });

      const goals = s.chapters ? s.chapters.map(c => [c.startNodeId, c.endNodeId]) : [[s.startingNodeId, 'n_end']];
      for (const [start, end] of goals) {
        it(`hat keine Sackgasse zwischen ${start} und ${end}`, () => {
          const seen = reachable(s, start);
          expect(seen.has(end)).toBe(true);
          for (const id of seen) expect(reachable(s, id).has(end), id).toBe(true);
        });
      }

      it('nutzt „hier“ statt „hört“', () => {
        for (const rc of hints(s)) expect(`${rc.hint} ${rc.response ?? ''}`).not.toMatch(/\bhört\b/i);
      });
    });
  }

  it('THW funkt mit Heros-Rufnamen', () => {
    for (const s of thw) expect(JSON.stringify(hints(s)), s.id).toMatch(/Heros Erlangen \d+\/\d+|Gruppenführer|Truppführer/);
    expect(hints(thw.find(s => s.id === 'thw_grundausbildung')!).some(rc => rc.hint.includes('Heros Erlangen 22/51'))).toBe(true);
  });

  it('Rettungsdienst nennt im Funk keine Patientennamen', () => {
    for (const s of rd)
      for (const rc of hints(s)) expect(rc.hint, s.id).not.toMatch(/Berger|Maier|geboren/);
  });

  it('Notruftaste löst im Rettungsdienst je genau eine Aktion aus', () => {
    for (const id of ['rd_grundausbildung', 'rd_bedrohung_notruf']) {
      const s = rd.find(x => x.id === id)!;
      const sos = Object.values(s.nodes).flatMap(n => n.actions.filter(a => a.key === 'sos'));
      expect(sos, id).toHaveLength(1);
    }
  });
});
