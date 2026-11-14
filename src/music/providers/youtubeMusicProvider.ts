import type { MusicMood, MusicProvider } from "../types";

/**
 * v2 second provider option, behind the same MusicProvider interface as
 * Spotify — adding it should never require touching the workout engine.
 *
 * Flagged as a placeholder: unlike Spotify, YouTube Music has no official
 * public SDK for third-party playback control. Before building this for
 * real, confirm an approach (YouTube Data API can search/queue but not
 * reliably drive playback on an arbitrary device; an unofficial API is
 * fragile and could break without notice). Until that's resolved, this
 * provider intentionally does nothing so it fails safe rather than
 * silently pretending to control playback.
 */
export class YoutubeMusicProvider implements MusicProvider {
  readonly name = "youtube_music";

  isConnected(): boolean {
    return false;
  }
  async connect(): Promise<boolean> {
    console.warn("YoutubeMusicProvider: not implemented yet — see file comment for why.");
    return false;
  }
  async setMood(_mood: MusicMood): Promise<void> {}
  async pause(): Promise<void> {}
  async resume(): Promise<void> {}
}
