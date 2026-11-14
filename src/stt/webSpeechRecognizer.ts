import type { VoiceRecognitionResult, VoiceRecognizer } from "./types";

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Browser Web Speech API — the same mechanism behind voice mode in
 * ChatGPT/Gemini's web apps. Only works when the app is running as a web
 * page (Platform.OS === "web"); native iOS/Android builds need a native
 * STT module instead (see VoiceRecognizer doc comment).
 */
export class WebVoiceRecognizer implements VoiceRecognizer {
  readonly isSupported = getSpeechRecognitionCtor() !== null;

  private recognition: BrowserSpeechRecognition | null = null;
  private resultCallbacks = new Set<(result: VoiceRecognitionResult) => void>();
  private errorCallbacks = new Set<(error: string) => void>();
  private endCallbacks = new Set<() => void>();

  start(options: { language: string }): void {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.errorCallbacks.forEach((cb) => cb("not_supported"));
      return;
    }

    this.recognition = new Ctor();
    this.recognition.lang = options.language;
    // Ambient/always-on listening — the app should keep hearing the user
    // throughout a workout, not just for one utterance at a time. Chrome
    // still ends the session after a stretch of silence regardless; the
    // voice agent controller (voiceAgent.ts) restarts it automatically.
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript: string = result[0].transcript;
      this.resultCallbacks.forEach((cb) => cb({ transcript, isFinal: result.isFinal }));
    };
    this.recognition.onerror = (event: any) => {
      this.errorCallbacks.forEach((cb) => cb(event?.error ?? "unknown_error"));
    };
    this.recognition.onend = () => {
      this.endCallbacks.forEach((cb) => cb());
    };

    this.recognition.start();
  }

  stop(): void {
    this.recognition?.stop();
  }

  onResult(callback: (result: VoiceRecognitionResult) => void): () => void {
    this.resultCallbacks.add(callback);
    return () => this.resultCallbacks.delete(callback);
  }

  onError(callback: (error: string) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  onEnd(callback: () => void): () => void {
    this.endCallbacks.add(callback);
    return () => this.endCallbacks.delete(callback);
  }
}
