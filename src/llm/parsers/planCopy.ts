import type { Language } from "../../storage/types";
import type { WorkoutTemplate } from "../../workout-engine/types";
import { planCopySystemPrompt } from "../prompts";
import type { LLMProvider } from "../types";

/**
 * The rules engine has already decided the plan (exercises/sets/reps).
 * This call only adds a short motivating intro line — it cannot change
 * the workout itself. Meant to run as part of the once-daily batch job,
 * not live in the UI thread.
 */
export async function generatePlanIntro(
  provider: LLMProvider,
  template: WorkoutTemplate,
  language: Language
): Promise<string> {
  const summary = `${template.name}: ${template.exercises.map((e) => e.name).join(", ")}.`;

  try {
    const response = await provider.complete({
      messages: [
        { role: "system", content: planCopySystemPrompt(language) },
        { role: "user", content: summary },
      ],
      temperature: 0.8,
      maxTokens: 250,
    });
    return response.content.trim();
  } catch {
    return template.name;
  }
}
