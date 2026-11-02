// Inhaltsprüfung der Schifffahrt- und Katastrophenschutz-Szenarien: erreichbar, ohne Sackgassen, Funkregeln eingehalten.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Scenario } from '../types/story';

const load = (path: string): Scenario =>
  JSON.parse(readFileSync(new URL(`../../public/scenarios/${path}`, import.meta.url), 'utf8'));
const index = JSON.parse(readFileSync(new URL('../../public/scenarios/index.json', import.meta.url), 'utf8'));
const SPECIAL = ['__exit__', '__chapters__', '__next_chapter__'];

const folder = (name: string): Scenario[] => ((index.builtin[name] ?? []) as string[]).map(load);
const schiff = folder('schifffahrt');
const kats = folder('katastrophenschutz');

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

const calls = (s: Scenario) =>
  Object.values(s.nodes).flatMap(n => n.actions.flatMap(a => (a.radioCall ? [a.radioCall] : [])));

describe('Schifffahrt- und Katastrophenschutz-Ordner', () => {
  it('enthalten je eine Grundausbildung und die Einsatz-Szenarien', () => {
    expect(schiff.map(s => s.id).sort()).toEqual([
      'schiff_fahrgastschiff_rauch', 'schiff_grundausbildung', 'schiff_havarie_frachter', 'schiff_person_im_wasser',
    ]);
    expect(kats.map(s => s.id).sort()).toEqual([
      'kats_betreuungsstelle', 'kats_grundausbildung', 'kats_hochwasser_aisch', 'kats_stromausfall',
    ]);
  });

  for (const s of [...schiff, ...kats]) {
    describe(s.id, () => {
      it('hat eine passende Rolle', () => {
        expect(s.playerRole).toBe(s.id.startsWith('schiff') ? 'wasserrettung' : 'katastrophenschutz');
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
        for (const rc of calls(s)) expect(`${rc.hint} ${rc.response ?? ''}`).not.toMatch(/\bhört\b/i);
      });
    });
  }

  it('das Boot funkt als Pelikan mit Kennzahl 99', () => {
    for (const s of schiff) expect(JSON.stringify(calls(s)), s.id).toContain('Pelikan Erlangen 99/1');
  });

  it('Binnenschiffe werden nie direkt angefunkt – Sperrung über die Leitstelle', () => {
    const sperrung = schiff.flatMap(calls).filter(rc => /Schifffahrt sperren/.test(rc.hint));
    expect(sperrung.length).toBeGreaterThan(0);
    for (const rc of sperrung) expect(rc.hint).toMatch(/^Leitstelle Nürnberg von /);
  });

  it('im Katastrophenfall meldet man an Abschnitt oder Einsatzleitung, nicht an die Leitstelle', () => {
    for (const s of kats) for (const rc of calls(s)) expect(rc.hint, s.id).not.toMatch(/^Leitstelle/);
  });

  it('die Betreuungsstelle meldet Zahlen, keine Namen', () => {
    const s = kats.find(x => x.id === 'kats_betreuungsstelle')!;
    expect(calls(s).some(rc => /42 Personen/.test(rc.hint))).toBe(true);
    expect(JSON.stringify(calls(s))).not.toMatch(/Frau [A-Z][a-z]+|Herr [A-Z][a-z]+/);
  });
});
