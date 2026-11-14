export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

/**
 * Adapter interface so callers (WorkoutScreen, MoodCheckInScreen) never
 * talk to a specific STT engine directly — same pattern as MusicProvider.
 * Today only the web implementation exists (browser Web Speech API);
 * a native provider (expo-speech-recognition, on-device iOS/Android STT)
 * can be added later behind this same interface without touching UI code.
 */
export interface VoiceRecognizer {
  readonly isSupported: boolean;
  start(options: { language: string }): void;
  stop(): void;
  onResult(callback: (result: VoiceRecognitionResult) => void): () => void;
  onError(callback: (error: string) => void): () => void;
  onEnd(callback: () => void): () => void;
}
