import type { MusicProvider, MusicMood } from "../types";

/** Default provider until Spotify/YouTube Music is connected — does nothing. */
export class NoopMusicProvider implements MusicProvider {
  readonly name = "none";
  isConnected(): boolean {
    return false;
  }
  async connect(): Promise<boolean> {
    return false;
  }
  async setMood(_mood: MusicMood): Promise<void> {}
  async pause(): Promise<void> {}
  async resume(): Promise<void> {}
}
