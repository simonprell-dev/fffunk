// Ton für das virtuelle Funkgerät: Mikrofon → 8 kHz µ-law-Pakete (wie Telefon, 64 kbit/s) und zurück.
// Schmalbandig wie echter Digitalfunk – und klein genug, dass 20 Geräte über Mobilfunk mitkommen.
import type { PcmAudio } from 'cactus-needle/browser';

export const FUNK_RATE = 8000;
const MAX_AUFNAHME_S = 30;

// ── µ-law (G.711) ─────────────────────────────────────────────────────────────────────────

export function mulawEncode(sample: number): number {
  const BIAS = 0x84, CLIP = 32635;
  let pcm = Math.max(-1, Math.min(1, sample)) * 32767 | 0;
  const sign = pcm < 0 ? 0x80 : 0;
  if (pcm < 0) pcm = -pcm;
  if (pcm > CLIP) pcm = CLIP;
  pcm += BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (pcm & mask) === 0 && exponent > 0; mask >>= 1) exponent--;
  const mantissa = (pcm >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

export function mulawDecode(byte: number): number {
  const u = ~byte & 0xff;
  const exponent = (u >> 4) & 0x07;
  const mantissa = u & 0x0f;
  const pcm = (((mantissa << 3) + 0x84) << exponent) - 0x84;
  return (u & 0x80 ? -pcm : pcm) / 32768;
}

/** Rechnet Mikrofon-Samples (z. B. 48 kHz) auf 8 kHz herunter (Mittelwert je Zielsample) und kodiert sie. */
export function kodiere(samples: Float32Array, rate: number): Uint8Array {
  const schritt = rate / FUNK_RATE;
  const n = Math.floor(samples.length / schritt);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const von = Math.floor(i * schritt), bis = Math.max(von + 1, Math.floor((i + 1) * schritt));
    let summe = 0;
    for (let j = von; j < bis; j++) summe += samples[j];
    out[i] = mulawEncode(summe / (bis - von));
  }
  return out;
}

/** Dekodiert ein Paket und rechnet es linear auf die Ausgaberate hoch. */
export function dekodiere(daten: Uint8Array, zielRate: number): Float32Array {
  const faktor = zielRate / FUNK_RATE;
  const out = new Float32Array(Math.floor(daten.length * faktor));
  for (let i = 0; i < out.length; i++) {
    const pos = i / faktor;
    const a = Math.floor(pos), b = Math.min(daten.length - 1, a + 1);
    const x = mulawDecode(daten[a]);
    out[i] = x + (mulawDecode(daten[b]) - x) * (pos - a);
  }
  return out;
}

const AudioCtx = (): typeof AudioContext => (window as any).AudioContext ?? (window as any).webkitAudioContext;

// ── Senden ────────────────────────────────────────────────────────────────────────────────

/** Mikrofon für die Sprechtaste. Das Mikrofon bleibt zwischen den Funksprüchen offen, damit kein Wortanfang fehlt. */
export class FunkSender {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private node: ScriptProcessorNode | null = null;
  private aktiv = false;
  private onPaket: ((p: Uint8Array) => void) | null = null;
  private mitschnitt: Float32Array[] = [];
  private mitschnittLaenge = 0;
  /** Lautstärke des letzten Blocks (0–1), für die Pegelanzeige. */
  pegel = 0;

  /** Mikrofon öffnen (fragt beim ersten Mal nach der Erlaubnis). */
  async bereite(): Promise<void> {
    if (this.stream) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Dieser Browser gibt das Mikrofon nicht frei.');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    this.ctx = new (AudioCtx())();
    const quelle = this.ctx.createMediaStreamSource(this.stream);
    // ScriptProcessor ist veraltet, läuft aber überall (auch in alten WebViews) und braucht keine Zusatzdatei.
    this.node = this.ctx.createScriptProcessor(2048, 1, 1);
    this.node.onaudioprocess = e => {
      if (!this.aktiv) return;
      const samples = e.inputBuffer.getChannelData(0);
      let summe = 0;
      for (let i = 0; i < samples.length; i++) summe += samples[i] * samples[i];
      this.pegel = Math.sqrt(summe / samples.length);
      this.onPaket?.(kodiere(samples, this.ctx!.sampleRate));
      if (this.mitschnittLaenge < this.ctx!.sampleRate * MAX_AUFNAHME_S) {
        this.mitschnitt.push(samples.slice());
        this.mitschnittLaenge += samples.length;
      }
    };
    const stumm = this.ctx.createGain();
    stumm.gain.value = 0; // nur verarbeiten, nicht auf den eigenen Lautsprecher geben
    quelle.connect(this.node);
    this.node.connect(stumm);
    stumm.connect(this.ctx.destination);
  }

  /** Sprechtaste gedrückt: Pakete laufen an `onPaket`, bis `stop()` kommt. */
  async start(onPaket: (p: Uint8Array) => void): Promise<void> {
    await this.bereite();
    if (this.ctx!.state === 'suspended') await this.ctx!.resume().catch(() => {});
    this.mitschnitt = [];
    this.mitschnittLaenge = 0;
    this.onPaket = onPaket;
    this.aktiv = true;
  }

  /** Sprechtaste losgelassen. Liefert die Aufnahme für die Offline-Spracherkennung (null = nichts aufgenommen). */
  stop(): PcmAudio | null {
    this.aktiv = false;
    this.onPaket = null;
    this.pegel = 0;
    if (!this.ctx || !this.mitschnittLaenge) return null;
    const samples = new Float32Array(this.mitschnittLaenge);
    let pos = 0;
    for (const teil of this.mitschnitt) { samples.set(teil, pos); pos += teil.length; }
    this.mitschnitt = [];
    this.mitschnittLaenge = 0;
    for (let i = 0; i < samples.length; i++) samples[i] = Math.max(-1, Math.min(1, samples[i] || 0));
    return { samples, sampleRate: this.ctx.sampleRate };
  }

  get sendet(): boolean { return this.aktiv; }

  schliesse(): void {
    this.aktiv = false;
    this.node?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.ctx?.close().catch(() => {});
    this.stream = null; this.ctx = null; this.node = null;
  }
}

// ── Empfangen ─────────────────────────────────────────────────────────────────────────────

/** Spielt ankommende Pakete lückenlos ab – mit Funkfilter – und erzeugt die Töne des Geräts. */
export class FunkEmpfaenger {
  private ctx: AudioContext | null = null;
  private ausgang: AudioNode | null = null;
  private pegelNode: GainNode | null = null;
  private naechste = 0;

  private bereit(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (AudioCtx())();
      // Funk klingt schmal: nur 300–3000 Hz durchlassen
      const hoch = this.ctx.createBiquadFilter();
      hoch.type = 'highpass'; hoch.frequency.value = 300;
      const tief = this.ctx.createBiquadFilter();
      tief.type = 'lowpass'; tief.frequency.value = 3000;
      this.pegelNode = this.ctx.createGain();
      hoch.connect(tief); tief.connect(this.pegelNode); this.pegelNode.connect(this.ctx.destination);
      this.ausgang = hoch;
    }
    return this.ctx;
  }

  /** Nach einem Tippen aufrufen – Browser geben Ton erst nach einer Nutzeraktion frei. */
  entsperre(): void {
    const ctx = this.bereit();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  /** Lautstärke 0–9 wie am Drehknopf. */
  setzeLautstaerke(stufe: number): void {
    this.bereit();
    this.pegelNode!.gain.value = Math.max(0, Math.min(9, stufe)) / 5;
  }

  spiele(paket: Uint8Array): void {
    const ctx = this.bereit();
    const samples = dekodiere(paket, ctx.sampleRate);
    if (!samples.length) return;
    const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.getChannelData(0).set(samples);
    const quelle = ctx.createBufferSource();
    quelle.buffer = buffer;
    quelle.connect(this.ausgang!);
    // kleiner Puffer gegen Aussetzer; nach einer Pause wieder dicht an „jetzt“
    if (this.naechste < ctx.currentTime + 0.02) this.naechste = ctx.currentTime + 0.12;
    quelle.start(this.naechste);
    this.naechste += buffer.duration;
  }

  private ton(frequenz: number, dauer: number, ab = 0, lautstaerke = 0.2): void {
    const ctx = this.bereit();
    const t0 = ctx.currentTime + ab;
    const osz = ctx.createOscillator();
    const gain = ctx.createGain();
    osz.frequency.value = frequenz;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(lautstaerke, t0 + 0.01);
    gain.gain.setValueAtTime(lautstaerke, t0 + dauer - 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
    osz.connect(gain); gain.connect(ctx.destination);
    osz.start(t0); osz.stop(t0 + dauer + 0.02);
  }

  /** Freiton: Kanal frei, jetzt sprechen. */
  freiton(): void { this.ton(1200, 0.14); }
  /** Gruppe ist belegt oder Senden nicht möglich. */
  besetztton(): void { this.ton(480, 0.18); this.ton(480, 0.18, 0.25); }
  /** Notruf geht ein. */
  notrufton(): void { for (let i = 0; i < 3; i++) { this.ton(1400, 0.16, i * 0.4, 0.3); this.ton(900, 0.16, i * 0.4 + 0.18, 0.3); } }

  schliesse(): void {
    this.ctx?.close().catch(() => {});
    this.ctx = null; this.ausgang = null; this.pegelNode = null;
  }
}
