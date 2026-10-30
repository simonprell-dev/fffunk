import { describe, expect, it } from 'vitest';
import { phraseMatches } from './speech-match';

describe('phraseMatches – Funkrufname 17/42/1', () => {
  it('erkennt Ziffer für Ziffer gesprochen („eins sieben vier zwo eins“)', () => {
    expect(phraseMatches('florian neuhaus eins sieben vier zwo eins kommen', 'Florian Neuhaus 17/42/1')).toBe(true);
  });

  it('erkennt als Zahlen gesprochen („siebzehn zweiundvierzig eins“)', () => {
    expect(phraseMatches('florian neuhaus siebzehn zweiundvierzig eins kommen', 'Florian Neuhaus 17/42/1')).toBe(true);
  });

  it('verwechselt ihn nicht mit einer anderen Kennung', () => {
    expect(phraseMatches('florian neuhaus elf eins kommen', 'Florian Neuhaus 17/42/1')).toBe(false);
  });
});
