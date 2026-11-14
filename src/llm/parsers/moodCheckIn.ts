import { z } from "zod";
import { containsPainOrInjurySignal, safetyRefusalMessage } from "../../safety/painDetector";
import type { Language } from "../../storage/types";
import type { MoodSignal } from "../../storage/types";
import { moodCheckInSystemPrompt, moodClassificationSystemPrompt } from "../prompts";
import type { ChatMessage, LLMProvider } from "../types";

export type MoodTurnResult =
  | { status: "reply"; message: string }
  | { status: "safety_refusal"; message: string };

/**
 * One turn of the open, time-boxed pre-workout check-in conversation.
 * Every user message is checked for pain/injury language BEFORE it goes
 * to the model — a refusal never touches the LLM.
 */
export async function getMoodCheckInReply(
  provider: LLMProvider,
  conversation: ChatMessage[],
  latestUserMessage: string,
  language: Language
): Promise<MoodTurnResult> {
  if (containsPainOrInjurySignal(latestUserMessage)) {
    return { status: "safety_refusal", message: safetyRefusalMessage(language) };
  }

  const response = await provider.complete({
    messages: [
      { role: "system", content: moodCheckInSystemPrompt(language) },
      ...conversation,
      { role: "user", content: latestUserMessage },
    ],
    temperature: 0.7,
    maxTokens: 300,
  });

  return { status: "reply", message: response.content.trim() };
}

const MoodSchema = z.object({
  mood: z.enum(["great", "ok", "rough"]),
  fatigue: z.enum(["low", "medium", "high"]),
  notes: z.string(),
});

/**
 * Called once, at the end of the check-in window, to turn the whole
 * conversation into a signal. This signal is handed to the deterministic
 * rules engine (adaptiveRules.ts) — the LLM never decides the workout.
 */
export async function classifyMoodFromConversation(
  provider: LLMProvider,
  conversation: ChatMessage[]
): Promise<MoodSignal> {
  const transcript = conversation.map((m) => `${m.role}: ${m.content}`).join("\n");

  try {
    const response = await provider.complete({
      messages: [
        { role: "system", content: moodClassificationSystemPrompt() },
        { role: "user", content: transcript },
      ],
      jsonMode: true,
      temperature: 0.1,
      maxTokens: 350,
    });
    return MoodSchema.parse(JSON.parse(response.content));
  } catch {
    // Safe default: treat unparseable signal as neutral, never blocks the workout.
    return { mood: "ok", fatigue: "medium", notes: "Could not classify — defaulted to neutral." };
  }
}
