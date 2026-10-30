// Inhaltsprüfung des Einsteiger-Szenarios: Kapitel vollständig, keine Sackgassen, Regeln wie im Lernbereich.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Scenario } from '../types/story';

const scenario: Scenario = JSON.parse(
  readFileSync(new URL('../../public/scenarios/builtin/funk/grundausbildung.json', import.meta.url), 'utf8'),
);
const SPECIAL = ['__exit__', '__chapters__', '__next_chapter__'];
const chapters = scenario.chapters ?? [];
const nodes = Object.values(scenario.nodes);

function targets(nodeId: string): string[] {
  return scenario.nodes[nodeId].actions.flatMap(a =>
    a.radioCall ? [a.radioCall.onSuccess, a.radioCall.onFailure] : a.nextNodeId ? [a.nextNodeId] : []);
}

function reachable(from: string): Set<string> {
  const seen = new Set<string>();
  const todo = [from];
  while (todo.length) {
    const id = todo.pop()!;
    if (seen.has(id) || !scenario.nodes[id]) continue;
    seen.add(id);
    todo.push(...targets(id));
  }
  return seen;
}

const radioCalls = (ids: Iterable<string>) =>
  [...ids].flatMap(id => scenario.nodes[id].actions.flatMap(a => (a.radioCall ? [a.radioCall] : [])));

describe('Grundausbildung', () => {
  it('hat Kennung, Rolle und die sechs Kapitel', () => {
    expect(scenario.id).toBe('grundausbildung');
    expect(scenario.playerRole).toBe('truppmann');
    expect(chapters.map(c => [c.id, c.title])).toEqual([
      ['reihenfolge', 'Wer ruft wen?'],
      ['kommen-ende', 'Kommen und Ende'],
      ['frage', 'Eine Frage stellen'],
      ['nachfrage', 'Nachfragen'],
      ['anruf-beantworten', 'Einen Anruf beantworten'],
      ['mayday', 'Mayday'],
    ]);
    expect(scenario.startingNodeId).toBe(chapters[0].startNodeId);
  });

  it('verweist nur auf vorhandene Knoten oder Sonderziele', () => {
    for (const n of nodes) {
      expect(n.id).toBe(Object.keys(scenario.nodes).find(k => scenario.nodes[k] === n));
      for (const t of targets(n.id)) expect(scenario.nodes[t] || SPECIAL.includes(t), `${n.id} → ${t}`).toBeTruthy();
    }
  });

  for (const [i, c] of chapters.entries()) {
    describe(`Kapitel ${c.id}`, () => {
      const inChapter = reachable(c.startNodeId);

      it('hat keine Sackgasse: von jedem Knoten ist das Kapitelende erreichbar', () => {
        expect(inChapter.has(c.endNodeId)).toBe(true);
        for (const id of inChapter) expect(reachable(id).has(c.endNodeId), id).toBe(true);
      });

      it('hat Auswahl-Schritt und Sprech-Schritt', () => {
        expect(radioCalls(inChapter).length).toBeGreaterThan(0);
        const choice = [...inChapter].some(id =>
          scenario.nodes[id].actions.filter(a => !a.radioCall).length >= 3);
        expect(choice).toBe(true);
      });

      it('bietet am Ende Kapitelauswahl und ggf. nächstes Kapitel', () => {
        const ends = scenario.nodes[c.endNodeId].actions.map(a => a.nextNodeId);
        expect(ends).toContain('__chapters__');
        expect(ends.includes('__next_chapter__')).toBe(i < chapters.length - 1);
      });
    });
  }

  it('hält die Texte kurz', () => {
    for (const n of nodes) expect(n.narrative.length, n.id).toBeLessThanOrEqual(600);
  });

  it('lehrt nie „hört“ als richtigen Funkspruch', () => {
    for (const rc of radioCalls(Object.keys(scenario.nodes))) {
      for (const text of [rc.hint, rc.response ?? '', ...rc.expectedPhrases]) {
        expect(text, rc.hint).not.toMatch(/\bhört\b/i);
      }
    }
  });

  it('Kapitel Reihenfolge: erster Funkspruch ist „X von Y – … kommen“', () => {
    const first = radioCalls(reachable(chapters[0].startNodeId))[0];
    expect(first.hint).toMatch(/^.+ von .+ – .*kommen[.!]?$/);
  });

  it('Kapitel Mayday: Notruftaste und Mayday-Wortlaut', () => {
    const ids = reachable(chapters.find(c => c.id === 'mayday')!.startNodeId);
    const sos = [...ids].flatMap(id => scenario.nodes[id].actions.filter(a => a.key === 'sos'));
    expect(sos).toHaveLength(1);
    const mayday = radioCalls(ids).find(rc => rc.hint.startsWith('Mayday, Mayday, Mayday – hier '));
    expect(mayday?.hint).toMatch(/Mayday, kommen!$/);
  });
});
