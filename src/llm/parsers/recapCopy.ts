import type { RecapStats } from "../../analytics/recapGenerator";
import type { Language } from "../../storage/types";
import { recapCopySystemPrompt } from "../prompts";
import type { LLMProvider } from "../types";

/** Stats are already computed (recapGenerator.ts) — this call only writes copy on top of them. */
export async function generateRecapIntro(
  provider: LLMProvider,
  stats: RecapStats,
  language: Language
): Promise<string> {
  const summary = `${stats.periodLabel}: ${stats.workoutsCompleted} workouts, ${stats.totalSets} sets, ~${stats.totalCalories} kcal burnt, current streak ${stats.currentStreak} days.`;

  try {
    const response = await provider.complete({
      messages: [
        { role: "system", content: recapCopySystemPrompt(language) },
        { role: "user", content: summary },
      ],
      temperature: 0.8,
      maxTokens: 250,
    });
    return response.content.trim();
  } catch {
    return `${stats.workoutsCompleted} workouts, ${stats.totalCalories} kcal burnt. Keep going!`;
  }
}
