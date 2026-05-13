/**
 * AudioRecorder – handles microphone capture
 */

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(onData: (blob: Blob) => void): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder.start();
    } catch (err) {
      throw new Error('Mikrofonzugriff verweigert: ' + (err as Error).message);
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

/**
 * SpeechRecognizer – uses Web Speech API (German)
 */
export class SpeechRecognizer {
  private recognition: any = null;
  private supported: boolean;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.supported = !!SpeechRecognition;
    if (this.supported) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'de-DE';
      this.recognition.interimResults = false;
    }
  }

  isSupported(): boolean {
    return this.supported;
  }

  async transcribe(blob: Blob): Promise<string> {
    // Web Speech API works only with live mic, not blobs.
    // In a full implementation we'd send blob to a Whisper WASM or server.
    // For demo we just return a placeholder.
    return new Promise((resolve) => {
      setTimeout(() => resolve("Meldung"), 1000);
    });
  }
}

export function blobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
