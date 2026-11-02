// Katalog der ortsabhängigen Namen: vollständig für alle Inhalte, Prompt für die KI, Übernahme der KI-Antwort.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error – reines JS-Modul aus scripts/, im Admin-Bereich des Servers genutzt
import { buildOrtsnamenPrompt, parseOrtsnamenAntwort } from '../../scripts/ortsnamen-prompt.mjs';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const katalog: { name: string; bedeutung: string; platzhalter: string; gruppe: string }[] = JSON.parse(read('scripts/ortsnamen.json'));
const names = katalog.map(k => k.name);

const index: { builtin: Record<string, string[]> } = JSON.parse(read('public/scenarios/index.json'));
const inhalte = [
  ...Object.values(index.builtin).flat().map(f => read(`public/scenarios/${f}`)),
  read('src/lib/lern-content.ts'),
  read('src/lib/fehler-quiz.ts'),
].join('\n');

describe('Ortsnamen-Katalog', () => {
  it('jeder Eintrag kommt in den Inhalten vor', () => {
    for (const n of names) expect(inhalte.includes(n), n).toBe(true);
  });

  it('deckt jeden Funkrufnamen mit Ortsbezug ab', () => {
    // „Akkon Erlangen 76/1“ ist ein festes Lernbeispiel (Johanniter-NEF) und bleibt.
    const fest = ['Akkon Erlangen'];
    const rufnamen = new Set(inhalte.match(/\b(Florian|Heros|Rotkreuz|Sama|Johannes|Akkon|Pelikan|Leitstelle) [A-ZÄÖÜ][a-zäöüß]+(?: \d+(?:\/\d+)*)?/g));
    for (const r of rufnamen) {
      if (fest.some(f => r.startsWith(f))) continue;
      if (/^Leitstelle [A-ZÄÖÜ][a-zäöü]+$/.test(r) && r !== 'Leitstelle Nürnberg') continue; // „Leitstelle Einsatzbereitschaft“ u. ä.
      expect(names.some(n => r.startsWith(n)), r).toBe(true);
    }
  });
});

describe('buildOrtsnamenPrompt', () => {
  const prompt = buildOrtsnamenPrompt({ ort: 'Forchheim, Landkreis Forchheim, Bayern', organisation: 'FF Forchheim', katalog });

  it('nennt Standort und Organisation', () => {
    expect(prompt).toContain('Forchheim, Landkreis Forchheim, Bayern');
    expect(prompt).toContain('FF Forchheim');
  });

  it('enthält jeden Katalog-Eintrag mit Bedeutung als Zeile des JavaScript-Objekts', () => {
    for (const k of katalog) expect(prompt).toContain(`${JSON.stringify(k.name)}: "", // ${k.bedeutung}`);
  });

  it('verlangt einen einzigen JavaScript-Codeblock „const rufnamen = { … }“', () => {
    expect(prompt).toContain('```js\nconst rufnamen = {');
  });
});

describe('parseOrtsnamenAntwort', () => {
  it('liest das JavaScript-Objekt der KI samt Kommentaren und beiden Anführungszeichen', () => {
    const antwort = [
      'Hier ist das Ergebnis:',
      '```js',
      'const rufnamen = {',
      '  "Florian Neuhaus 17/42/1": "Florian Forchheim 40/1", // eigenes LF',
      "  'Leitstelle Nürnberg': 'Leitstelle Bamberg', // unsicher",
      '  "Aisch": "Regnitz",',
      '};',
      '```',
    ].join('\n');
    expect(parseOrtsnamenAntwort(antwort)).toEqual({
      'Florian Neuhaus 17/42/1': 'Florian Forchheim 40/1',
      'Leitstelle Nürnberg': 'Leitstelle Bamberg',
      Aisch: 'Regnitz',
    });
  });

  it('übergeht leere und unveränderte Werte', () => {
    expect(parseOrtsnamenAntwort('{ "Neuhaus": "", "Aisch": "Aisch", "A 3": "A 73" }')).toEqual({ 'A 3': 'A 73' });
  });

  it('versteht auch „Suchtext=Ersetzung“-Zeilen', () => {
    expect(parseOrtsnamenAntwort('Neuhaus=Forchheim\nB 470=B 470a')).toEqual({ Neuhaus: 'Forchheim', 'B 470': 'B 470a' });
  });

  it('versteht Anführungszeichen im Wert', () => {
    expect(parseOrtsnamenAntwort('{ "Uniklinikum Erlangen": "Klinikum \\"Am Bruderwald\\"" }'))
      .toEqual({ 'Uniklinikum Erlangen': 'Klinikum "Am Bruderwald"' });
  });
});
