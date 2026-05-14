import { Transcription } from '../types/story';

export type RadioMode = 'tmo' | 'dmo' | 'dispatch' | 'clear';

const ELEVENLABS_DEFAULT_VOICE = 'pNInz6obpgDQGcFmaJgB'; // Adam — good German with multilingual model
const ELEVENLABS_MODEL = 'eleven_multilingual_v2';

export class AudioEngine {
  private radioMode: RadioMode = 'tmo';
  private audioCtx: AudioContext | null = null;
  private radioHissEnabled = true;
  private elevenLabsApiKey: string | null = null;
  private elevenLabsVoiceId: string = ELEVENLABS_DEFAULT_VOICE;

  setRadioMode(mode: RadioMode): void {
    this.radioMode = mode;
  }

  setRadioHissEnabled(enabled: boolean): void {
    this.radioHissEnabled = enabled;
  }

  configure(opts: { apiKey?: string | null; voiceId?: string }): void {
    if (opts.apiKey !== undefined) this.elevenLabsApiKey = opts.apiKey || null;
    if (opts.voiceId) this.elevenLabsVoiceId = opts.voiceId;
  }

  private getCtx(): AudioContext {
    if (!this.audioCtx) this.audioCtx = new AudioContext();
    return this.audioCtx;
  }

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

  private async fetchElevenLabsAudio(text: string): Promise<AudioBuffer> {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.elevenLabsApiKey!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.1 },
      }),
    });

    if (!response.ok) {
      const msg = await response.text().catch(() => String(response.status));
      throw new Error(`ElevenLabs ${response.status}: ${msg}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return this.getCtx().decodeAudioData(arrayBuffer);
  }

  // Route decoded audio through a bandpass + compression chain to simulate radio sound
  private playAudioBufferWithRadioFx(buffer: AudioBuffer): Promise<void> {
    const ctx = this.getCtx();

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Cut below ~300 Hz (rumble) and above ~3 kHz (hiss) — the classic radio band
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 280;
    hp.Q.value = 0.9;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    lp.Q.value = 0.8;

    // Slight presence boost around 2 kHz for intelligibility
    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 2000;
    mid.gain.value = 3;
    mid.Q.value = 1.2;

    // Gentle compression to tighten dynamics, like a real radio TX/RX pair
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 8;
    comp.ratio.value = 6;
    comp.attack.value = 0.002;
    comp.release.value = 0.08;

    const gain = ctx.createGain();
    gain.gain.value = 1.1;

    source.connect(hp);
    hp.connect(lp);
    lp.connect(mid);
    mid.connect(comp);
    comp.connect(gain);
    gain.connect(ctx.destination);

    return new Promise((resolve, reject) => {
      source.onended = () => resolve();
      source.addEventListener('error', reject);
      source.start();
    });
  }

  private speakWebSpeech(text: string, lang: string, onStart: () => void): Promise<void> {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.pitch = 1.1;
    utterance.rate = 1.25;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const deVoice =
      voices.find(v => v.lang.startsWith('de') && /natural|neural/i.test(v.name)) ||
      voices.find(v => v.lang.startsWith('de') && !v.localService) ||
      voices.find(v => v.lang.startsWith('de'));
    if (deVoice) utterance.voice = deVoice;

    return new Promise((resolve, reject) => {
      let noiseNode: AudioBufferSourceNode | null = null;

      utterance.onstart = () => {
        onStart();
        noiseNode = this.radioHissEnabled ? this.playRadioHiss() : null;
      };

      utterance.onend = () => {
        if (noiseNode) { try { noiseNode.stop(); } catch {} }
        resolve();
      };

      utterance.onerror = (e) => {
        if (noiseNode) { try { noiseNode.stop(); } catch {} }
        reject(e);
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  async speakRadio(text: string, lang: string = 'de-DE'): Promise<void> {
    window.speechSynthesis.cancel();

    const clean = this.stripMarkdown(text);
    if (!clean) return;

    this.playPttClick('open');

    if (this.elevenLabsApiKey) {
      let noiseNode: AudioBufferSourceNode | null = null;
      try {
        // Fetch audio first (network latency), then start hiss + play together
        const buffer = await this.fetchElevenLabsAudio(clean);
        noiseNode = this.radioHissEnabled ? this.playRadioHiss() : null;
        await this.playAudioBufferWithRadioFx(buffer);
      } finally {
        if (noiseNode) { try { noiseNode.stop(); } catch {} }
        this.playPttClick('close');
      }
    } else {
      try {
        await this.speakWebSpeech(clean, lang, () => {});
      } finally {
        this.playPttClick('close');
      }
    }
  }

  private playPttClick(type: 'open' | 'close'): void {
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'open') {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.04);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else {
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      }

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

  private playRadioHiss(): AudioBufferSourceNode | null {
    try {
      const ctx = this.getCtx();
      const bufSize = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1200;
      bandpass.Q.value = 0.4;

      const shelf = ctx.createBiquadFilter();
      shelf.type = 'highshelf';
      shelf.frequency.value = 4000;
      shelf.gain.value = 4;

      const gain = ctx.createGain();
      gain.gain.value = 0.025;

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
