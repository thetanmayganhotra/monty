export type HomeVoiceCommand =
  | "start_workout"
  | "mood_checkin"
  | "analytics"
  | "history"
  | "settings"
  | "measurements"
  | "unknown";

const KEYWORDS: Record<Exclude<HomeVoiceCommand, "unknown">, string[]> = {
  start_workout: ["start workout", "begin workout", "start training", "let's train", "lets train", "lets workout"],
  mood_checkin: ["how am i feeling", "mood check", "check in", "feeling today"],
  analytics: ["show analytics", "my progress", "open analytics", "show progress", "analytics"],
  history: ["show history", "workout history", "past workouts", "history"],
  settings: ["open settings", "settings"],
  measurements: ["log my weight", "body measurements", "log weight", "measurements"],
};

/** Same plain keyword matching as workout-engine/voiceCommands.ts, one level up (screen navigation, not in-workout controls). */
export function matchHomeVoiceCommand(rawText: string): HomeVoiceCommand {
  const text = rawText.trim().toLowerCase();
  if (!text) return "unknown";

  for (const [command, keywords] of Object.entries(KEYWORDS) as [Exclude<HomeVoiceCommand, "unknown">, string[]][]) {
    if (keywords.some((keyword) => text.includes(keyword))) return command;
  }
  return "unknown";
}
