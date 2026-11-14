import type { MusicMood, MusicProvider } from "../types";

const SPOTIFY_API = "https://api.spotify.com/v1/me/player";

export interface SpotifyPlaylists {
  energetic: string; // Spotify context URI, e.g. "spotify:playlist:..."
  calm: string;
}

/**
 * Spotify Web API playback control — no hosting/streaming of audio
 * ourselves, playback commands only, triggered deterministically by the
 * workout state machine (see musicController.ts).
 *
 * NOT wired to a real Spotify account yet: that needs (1) a Spotify
 * Developer app (Client ID/Secret, created at
 * developer.spotify.com/dashboard by the account owner) and (2) an OAuth
 * flow (e.g. expo-auth-session) that gets the user's explicit consent —
 * both are actions only the app owner can take. `getAccessToken` is left
 * pluggable so that flow can be dropped in later without touching the
 * workout engine or this class's public shape.
 */
export class SpotifyProvider implements MusicProvider {
  readonly name = "spotify";
  private getAccessToken: () => Promise<string | null>;
  private playlists: SpotifyPlaylists;
  private connected = false;

  constructor(getAccessToken: () => Promise<string | null>, playlists: SpotifyPlaylists) {
    this.getAccessToken = getAccessToken;
    this.playlists = playlists;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<boolean> {
    const token = await this.getAccessToken();
    this.connected = !!token;
    return this.connected;
  }

  private async request(path: string, init: RequestInit = {}): Promise<void> {
    const token = await this.getAccessToken();
    if (!token) {
      this.connected = false;
      return;
    }
    await fetch(`${SPOTIFY_API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
    });
  }

  async setMood(mood: MusicMood): Promise<void> {
    const context_uri = mood === "energetic" ? this.playlists.energetic : this.playlists.calm;
    await this.request("/play", { method: "PUT", body: JSON.stringify({ context_uri }) });
  }

  async pause(): Promise<void> {
    await this.request("/pause", { method: "PUT" });
  }

  async resume(): Promise<void> {
    await this.request("/play", { method: "PUT" });
  }
}
