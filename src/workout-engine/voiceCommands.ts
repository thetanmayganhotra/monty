import type { VoiceCommand } from "./types";

/**
 * v0 voice commands: plain keyword matching, no LLM. Full free-form
 * intent parsing (via the LLM layer) is a v1+ concern for conversational
 * logging, not for these four control commands.
 */
const COMMAND_KEYWORDS: Record<Exclude<VoiceCommand, "unknown">, string[]> = {
  next: ["next", "skip", "continue"],
  rest: ["rest", "pause", "wait", "hold on"],
  end_workout: ["end workout", "stop workout", "quit", "i'm done", "im done", "finish workout"],
  repeat: ["repeat", "say again", "what", "come again"],
};

export function matchVoiceCommand(rawText: string): VoiceCommand {
  const text = rawText.trim().toLowerCase();
  if (!text) return "unknown";

  for (const [command, keywords] of Object.entries(COMMAND_KEYWORDS) as [
    Exclude<VoiceCommand, "unknown">,
    string[]
  ][]) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return command;
    }
  }

  return "unknown";
}
