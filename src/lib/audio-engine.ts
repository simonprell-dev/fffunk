import { Transcription } from '../types/story';

export type RadioMode = 'tmo' | 'dmo' | 'dispatch' | 'clear';

export class AudioEngine {
  private radioMode: RadioMode = 'tmo';
  private audioCtx: AudioContext | null = null;
  private radioHissEnabled = true;

  setRadioMode(mode: RadioMode): void {
    this.radioMode = mode;
  }

  setRadioHissEnabled(enabled: boolean): void {
    this.radioHissEnabled = enabled;
  }

  private getCtx(): AudioContext {
    if (!this.audioCtx) this.audioCtx = new AudioContext();
    return this.audioCtx;
  }

  // Strip Markdown syntax so TTS doesn't read out asterisks, hashes, etc.
  private stripMarkdown(text: string): string {
    return text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/^>+\s?/gm, '')
      .replace(/^__FEEDBACK__\n?/gm, '')
      .replace(/[„""]/g, '')
      .replace(/—/g, ', ')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  async speakRadio(text: string, lang: string = 'de-DE'): Promise<void> {
    window.speechSynthesis.cancel();

    const clean = this.stripMarkdown(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang;
    utterance.pitch = 1.1;   // slightly higher — radio voices sound thin/bright
    utterance.rate = 1.25;   // faster, while still understandable for radio calls
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const deVoice = voices.find(v => v.lang.startsWith('de'));
    if (deVoice) utterance.voice = deVoice;

    this.playPttClick('open');

    return new Promise((resolve, reject) => {
      let noiseNode: AudioBufferSourceNode | null = null;

      utterance.onstart = () => {
        noiseNode = this.radioHissEnabled ? this.playRadioHiss() : null;
      };

      utterance.onend = () => {
        if (noiseNode) {
          try { noiseNode.stop(); } catch {}
          noiseNode = null;
        }
        this.playPttClick('close');
        resolve();
      };

      utterance.onerror = (e) => {
        if (noiseNode) {
          try { noiseNode.stop(); } catch {}
        }
        reject(e);
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // Short squelch/click sound — 'open' before speaking, 'close' after
  private playPttClick(type: 'open' | 'close'): void {
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;

      // Main click oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'open') {
        // Rising chirp — squelch opens
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.04);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else {
        // Falling chirp — squelch closes
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      }

      // Brief noise burst alongside the click
      const bufSize = Math.floor(ctx.sampleRate * 0.06);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800;
      bp.Q.value = 1.5;

      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.08, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noise.connect(bp);
      bp.connect(ng);
      ng.connect(ctx.destination);
      noise.start(now);
    } catch {
      // ignore if AudioContext unavailable
    }
  }

  // Subtle radio hiss/static that plays during TTS — returns the node so caller can stop it
  private playRadioHiss(): AudioBufferSourceNode | null {
    try {
      const ctx = this.getCtx();

      // 3-second noise buffer, looped
      const bufSize = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;

      // Bandpass filter to simulate radio frequency range (300 Hz – 3 kHz)
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1200;
      bandpass.Q.value = 0.4;

      // Gentle high-shelf to add a bit of "crispness"
      const shelf = ctx.createBiquadFilter();
      shelf.type = 'highshelf';
      shelf.frequency.value = 4000;
      shelf.gain.value = 4;

      const gain = ctx.createGain();
      gain.gain.value = 0.025; // very quiet — just presence

      noise.connect(bandpass);
      bandpass.connect(shelf);
      shelf.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      return noise;
    } catch {
      return null;
    }
  }

  async transcribeLive(lang: string = 'de-DE'): Promise<Transcription> {
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
      recognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve({ text: transcript, confidence: event.results[0][0].confidence });
      };

      recognizer.onerror = (e: any) => {
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

      setTimeout(() => {
        try { recognizer.stop(); } catch {}
      }, 5000);
    });
  }
}
