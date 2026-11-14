import { z } from "zod";
import { containsPainOrInjurySignal, safetyRefusalMessage } from "../../safety/painDetector";
import type { Language } from "../../storage/types";
import { logParsingSystemPrompt } from "../prompts";
import type { LLMProvider } from "../types";

const LogSchema = z.object({
  weight: z.number().nullable(),
  unit: z.enum(["kg", "lb"]).nullable(),
  reps: z.number().nullable(),
  failure: z.boolean(),
});

export type ParsedLog = z.infer<typeof LogSchema>;

export type ParseLogResult =
  | { status: "parsed"; data: ParsedLog }
  | { status: "safety_refusal"; message: string }
  | { status: "error"; message: string };

/**
 * Free-form "20 kilos" / "same as last time" / "couldn't finish last reps"
 * -> structured {weight, unit, reps, failure}. The only network/model call
 * in this path; everything downstream (logging, progression) is plain code.
 */
export async function parseWorkoutLog(
  provider: LLMProvider,
  rawText: string,
  language: Language
): Promise<ParseLogResult> {
  if (containsPainOrInjurySignal(rawText)) {
    return { status: "safety_refusal", message: safetyRefusalMessage(language) };
  }

  try {
    const response = await provider.complete({
      messages: [
        { role: "system", content: logParsingSystemPrompt(language) },
        { role: "user", content: rawText },
      ],
      jsonMode: true,
      temperature: 0.1,
      maxTokens: 300,
    });

    const data = LogSchema.parse(JSON.parse(response.content));
    return { status: "parsed", data };
  } catch {
    return { status: "error", message: "Couldn't catch that — try again." };
  }
}
