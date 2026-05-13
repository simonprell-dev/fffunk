export type RadioMode = 'tmo' | 'dmo' | 'clear' | 'dispatch';

export const RADIO_MODES: Record<RadioMode, { label: string; desc: string }> = {
  tmo: { label: 'TMO (Digital)', desc: 'Geringe Bandbreite, leicht verzerrt' },
  dmo: { label: 'DMO (Analog)', desc: 'Breiter Frequenzgang, mehr Rauschen' },
  clear: { label: 'Klar spielen', desc: 'Ohne Effekte, zum Testen' },
  dispatch: { label: 'Einsatzleitstelle', desc: 'Standard-Funkstimme' }
};

export class RadioDispatcherTTS {
  async speak(text: string, options?: { mode?: RadioMode; pitch?: number }): Promise<void> {
    // Simple TTS – radio effects placeholder
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    if (options?.pitch) utterance.pitch = options.pitch;
    // Simple PTT click
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch { }
    return new Promise((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      window.speechSynthesis.speak(utterance);
    });
  }
}
