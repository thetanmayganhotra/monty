import { GroqProvider, GROQ_FAST_MODEL } from "./providers/groqProvider";
import type { LLMProvider } from "./types";

export type { ChatMessage, LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from "./types";
export { GROQ_FAST_MODEL };

/**
 * Factory for the active LLM provider. Callers (mood check-in, weight/rep
 * parsing, plan-copy generation) depend only on the LLMProvider interface,
 * so swapping providers or models later never touches call sites.
 *
 * apiKey must come from the caller's environment (server / edge function),
 * not from a client bundle — do not read this from an EXPO_PUBLIC_ var.
 */
export function getLLMProvider(apiKey: string, model?: string): LLMProvider {
  return new GroqProvider({ apiKey, model });
}
