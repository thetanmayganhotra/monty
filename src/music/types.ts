export type MusicMood = "energetic" | "calm";

/**
 * Adapter interface so the workout engine never talks to Spotify/YouTube
 * Music directly — it only calls setMood(). Playback control only; we
 * never host or stream audio ourselves.
 */
export interface MusicProvider {
  readonly name: string;
  isConnected(): boolean;
  connect(): Promise<boolean>;
  setMood(mood: MusicMood): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
}
