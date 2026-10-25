// Offline-Spracherkennung mit Whistle (cactus-needle, läuft per WebAssembly im Browser).
// Fallback, wenn die Google-Spracherkennung (Web Speech API / Android-Dienst) fehlt.
import type { PcmAudio, Whistle } from 'cactus-needle/browser';

const PREF_KEY = 'fffunk.stt';
const MAX_SECONDS = 30; // Whistle verarbeitet max. 30 s pro Aufruf

// ?stt=whistle erzwingt die Offline-Erkennung (zum Testen), ?stt=auto setzt zurück.
export function prefersWhistle(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('stt');
    if (param === 'whistle') localStorage.setItem(PREF_KEY, 'whistle');
    else if (param === 'auto') localStorage.removeItem(PREF_KEY);
    return localStorage.getItem(PREF_KEY) === 'whistle';
  } catch {
    return false;
  }
}

export function isWhistleSupported(): boolean {
  return (
    window.isSecureContext &&
    typeof WebAssembly === 'object' &&
    typeof Worker === 'function' &&
    typeof MediaRecorder === 'function' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

let whistlePromise: Promise<Whistle> | null = null;
const progressListeners = new Set<(percent: number) => void>();

// Lädt Modell (16,9 MB, danach im Browser-Cache) und Worker einmalig für die ganze App.
export function loadWhistle(onProgress?: (percent: number) => void): Promise<Whistle> {
  if (onProgress) progressListeners.add(onProgress);
  if (!whistlePromise) {
    whistlePromise = import('cactus-needle/browser')
      .then(({ createWhistle }) =>
        createWhistle({
          onDownloadProgress: ({ percentage }) => {
            if (percentage !== undefined) progressListeners.forEach(l => l(Math.round(percentage)));
          },
        }),
      )
      .catch((e) => {
        whistlePromise = null; // beim nächsten Versuch neu laden
        throw e;
      });
  }
  const p = whistlePromise;
  return onProgress ? p.finally(() => progressListeners.delete(onProgress)) : p;
}

export async function transcribeWithWhistle(audio: PcmAudio, keywords: string[]): Promise<string> {
  const whistle = await loadWhistle();
  const result = await whistle.transcribe(audio, {
    language: 'de',
    keywords: keywords.filter(k => k.trim()).slice(0, 20),
  });
  return result.text.trim();
}

// Push-to-Talk-Aufnahme: start() beim Drücken, stop() beim Loslassen liefert PCM.
export class WhistleRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private starting: Promise<void> | null = null;

  async start(): Promise<void> {
    this.starting = (async () => {
      if (!this.stream) this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.chunks = [];
      this.recorder = new MediaRecorder(this.stream);
      this.recorder.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };
      this.recorder.start();
    })();
    return this.starting;
  }

  // null, wenn nichts aufgenommen wurde (z. B. Knopf während des Pieptons losgelassen).
  async stop(): Promise<PcmAudio | null> {
    if (!this.starting) return null;
    try { await this.starting; } catch { return null; } finally { this.starting = null; }
    const recorder = this.recorder;
    this.recorder = null;
    if (!recorder || recorder.state === 'inactive') return null;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    if (this.chunks.length === 0) return null;

    const blob = new Blob(this.chunks, { type: recorder.mimeType });
    const Ctx = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    const ctx: AudioContext = new Ctx();
    try {
      const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
      const samples = decoded.getChannelData(0).slice(0, decoded.sampleRate * MAX_SECONDS);
      // Dekodiertes Opus schießt bei lauter Sprache leicht über ±1 – Whistle lehnt das ab.
      for (let i = 0; i < samples.length; i++) {
        const v = samples[i];
        samples[i] = Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0;
      }
      return { samples, sampleRate: decoded.sampleRate };
    } finally {
      ctx.close().catch(() => {});
    }
  }

  release(): void {
    try { if (this.recorder?.state !== 'inactive') this.recorder?.stop(); } catch { /* ignore */ }
    this.recorder = null;
    this.starting = null;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }
}
