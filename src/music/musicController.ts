import type { EngineEvent } from "../workout-engine/types";
import type { MusicProvider } from "./types";

/**
 * Deterministic bridge: workout engine events -> playback commands.
 * No LLM, no branching logic beyond a lookup — energetic during sets,
 * calm during rest, pause on completion.
 */
export function createMusicEventHandler(provider: MusicProvider) {
  return async function handleEngineEventForMusic(event: EngineEvent): Promise<void> {
    if (!provider.isConnected()) return;

    switch (event.type) {
      case "set_start":
        await provider.setMood("energetic");
        return;
      case "rest_start":
        await provider.setMood("calm");
        return;
      case "workout_complete":
        await provider.pause();
        return;
    }
  };
}
