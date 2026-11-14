import { GROQ_API_KEY, GROQ_MODEL, isGroqConfigured } from "../config/env";
import { getLLMProvider } from "./index";
import type { LLMProvider } from "./types";

let cached: LLMProvider | null = null;

/** Null until GROQ_API_KEY is set in .env — callers must handle that case. */
export function getMontyLLM(): LLMProvider | null {
  if (!isGroqConfigured()) return null;
  if (!cached) cached = getLLMProvider(GROQ_API_KEY, GROQ_MODEL);
  return cached;
}
