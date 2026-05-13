import { Transcription } from '../types/story';

export type RadioMode = 'tmo' | 'dmo' | 'dispatch' | 'clear';

export class AudioEngine {
  private radioMode: RadioMode = 'tmo';

  setRadioMode(mode: RadioMode): void {
    this.radioMode = mode;
  }

  async speakRadio(text: string, lang: string = 'de-DE'): Promise<void> {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.pitch = 0.95;
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const deVoice = voices.find(v => v.lang.startsWith('de'));
    if (deVoice) utterance.voice = deVoice;

    this.playPttClick();

    return new Promise((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      window.speechSynthesis.speak(utterance);
    });
  }

  private playPttClick(): void {
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
    } catch (err) {
      // ignore
    }
  }

  /**
   * Transcribe live microphone input using Web Speech API.
   * Checks browser support and provides clear error messages.
   */
  async transcribeLive(lang: string = 'de-DE'): Promise<Transcription> {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error(
        'Spracherkennung nicht verfügbar. Bitte nutzen Sie Chrome oder Edge (Chromium). Firefox und Safari unterstützen die Spracherkennung nicht.'
      );
    }

    const recognizer = new SpeechRecognition();
    recognizer.lang = lang;
    recognizer.continuous = false;
    recognizer.interimResults = false;

    return new Promise((resolve, reject) => {
      recognizer.onstart = () => {
        console.log('[AudioEngine] Speech recognition started');
      };

      recognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('[AudioEngine] Transcribed:', transcript);
        resolve({ text: transcript, confidence: event.results[0][0].confidence });
      };

      recognizer.onerror = (e: any) => {
        console.error('[AudioEngine] Recognition error:', e.error);
        let msg = 'Spracherkennung fehlgeschlagen';
        if (e.error === 'not-allowed') {
          msg = 'Mikrofon-Zugriff verweigert. Bitte erlauben Sie Mikrofon-Zugriff in den Browser-Einstellungen.';
        } else if (e.error === 'no-speech') {
          msg = 'Keine Sprache erkannt. Bitte lauter und deutlicher sprechen.';
        } else if (e.error === 'audio-capture') {
          msg = 'Mikrofon nicht gefunden. Bitte prüfen Sie Ihre Audio-Einstellungen.';
        } else if (e.error === 'network') {
          msg = 'Netzwerkfehler bei der Spracherkennung. Bitte Internetverbindung prüfen.';
        }
        reject(new Error(msg));
      };

      try {
        recognizer.start();
      } catch (e: any) {
        reject(new Error('Spracherkennung konnte nicht gestartet werden: ' + e.message));
        return;
      }

      // Auto-stop after 5 seconds
      setTimeout(() => {
        try {
          recognizer.stop();
        } catch (e) {
          // ignore if already stopped
        }
      }, 5000);
    });
  }
}
