import type { VoiceRecognizer } from "./types";

/** Placeholder for native platforms until a native STT provider is added — fails safe, never fakes a result. */
export class UnsupportedVoiceRecognizer implements VoiceRecognizer {
  readonly isSupported = false;
  private errorCallbacks = new Set<(error: string) => void>();

  start(): void {
    this.errorCallbacks.forEach((cb) => cb("not_supported_on_this_platform"));
  }
  stop(): void {}
  onResult(): () => void {
    return () => {};
  }
  onError(callback: (error: string) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }
  onEnd(): () => void {
    return () => {};
  }
}
