import { describe, expect, it } from 'vitest';
import { ttsText } from './tts-text';

describe('ttsText', () => {
  it('liest Funkrufnamen-Nummern nicht als Bruch', () => {
    expect(ttsText('Florian Neuhaus 44/1 – kommen')).toBe('Florian Neuhaus 44 1 – kommen');
  });

  it('liest dreiteilige Funkrufnamen ohne Bruch', () => {
    expect(ttsText('Florian Neuhaus 17/42/1')).toBe('Florian Neuhaus 17 42 1');
  });

  it('trennt auch mit Leerzeichen um den Schrägstrich', () => {
    expect(ttsText('Florian 11 / 2')).toBe('Florian 11 2');
  });

  it('trennt Komposita auf -strupp hinter dem Fugen-s', () => {
    expect(ttsText('Angriffstrupp und Sicherheitstrupp')).toBe('Angriffs-Trupp und Sicherheits-Trupp');
  });

  it('lässt Trupp ohne Fugen-s in Ruhe', () => {
    expect(ttsText('Wassertrupp, Schlauchtrupp, Trupp')).toBe('Wassertrupp, Schlauchtrupp, Trupp');
  });
});
