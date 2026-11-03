import { describe, expect, it, vi } from 'vitest';
import { warmUpSpeech, type WarmUpDeps } from './speech-warmup';

const deps = (over: Partial<WarmUpDeps> = {}): WarmUpDeps => ({
  platform: 'android',
  voskAvailable: true,
  googleAvailable: vi.fn(async () => false),
  preloadVosk: vi.fn(async () => {}),
  ...over,
});

describe('warmUpSpeech', () => {
  it('lädt das Offline-Modell beim Start, wenn das Gerät keinen Google-Sprachdienst hat', async () => {
    const d = deps();
    expect(await warmUpSpeech(d)).toBe('vosk');
    expect(d.preloadVosk).toHaveBeenCalledTimes(1);
  });

  it('lädt nichts vor, wenn Google-Spracherkennung vorhanden ist', async () => {
    const d = deps({ googleAvailable: vi.fn(async () => true) });
    expect(await warmUpSpeech(d)).toBe('google');
    expect(d.preloadVosk).not.toHaveBeenCalled();
  });

  it('lädt vor, wenn die Abfrage des Google-Dienstes fehlschlägt', async () => {
    const d = deps({ googleAvailable: vi.fn(async () => { throw new Error('kein Dienst'); }) });
    expect(await warmUpSpeech(d)).toBe('vosk');
    expect(d.preloadVosk).toHaveBeenCalledTimes(1);
  });

  it('tut im Browser nichts', async () => {
    const d = deps({ platform: 'web' });
    expect(await warmUpSpeech(d)).toBe('none');
    expect(d.googleAvailable).not.toHaveBeenCalled();
    expect(d.preloadVosk).not.toHaveBeenCalled();
  });

  it('ein Fehler beim Vorladen bricht den App-Start nicht ab', async () => {
    const d = deps({ preloadVosk: vi.fn(async () => { throw new Error('Modell fehlt'); }) });
    await expect(warmUpSpeech(d)).resolves.toBe('vosk');
  });
});
