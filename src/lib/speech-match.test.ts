import { describe, expect, it } from 'vitest';
import { phraseMatches } from './speech-match';

describe('phraseMatches – Funkrufname 42/1', () => {
  it('erkennt Ziffer für Ziffer gesprochen („vier zwo eins“)', () => {
    expect(phraseMatches('florian neuhaus vier zwo eins kommen', 'Florian Neuhaus 42/1')).toBe(true);
  });

  it('erkennt als Zahlen gesprochen („zweiundvierzig eins“)', () => {
    expect(phraseMatches('florian neuhaus zweiundvierzig eins kommen', 'Florian Neuhaus 42/1')).toBe(true);
  });

  it('verwechselt ihn nicht mit einer anderen Kennung', () => {
    expect(phraseMatches('florian neuhaus elf eins kommen', 'Florian Neuhaus 42/1')).toBe(false);
  });
});
