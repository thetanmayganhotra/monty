import type { Language } from "../storage/types";

/**
 * Deterministic gate that runs BEFORE any free-form user speech reaches
 * the LLM. Pain/injury/medical language never gets a creative or
 * conversational answer — it always gets this fixed response instead.
 * This must be the first check in every LLM entry point (log parsing,
 * mood check-in), not a fallback after the model has already responded.
 */
const PAIN_PATTERNS: RegExp[] = [
  /\bpain\b/i,
  /\bhurts?\b/i,
  /\bhurting\b/i,
  /injur(y|ed|ies)/i,
  /\bsprain/i,
  /\bstrain(ed)?\b/i,
  /pulled (a|my)/i,
  /\btwisted\b/i,
  /\bswoll?en\b/i,
  /\bnumb(ness)?\b/i,
  /\bdizzy\b/i,
  /chest (pain|tight|tightness)/i,
  /can'?t breathe/i,
  /sharp pain/i,
  /\bpinch(ed)?\b/i,
  // Common Hinglish/Hindi phrasing for the same signals.
  /dard/i,
  /chot\b/i,
  /takleef/i,
];

export const SAFETY_REFUSAL_MESSAGE_EN =
  "I'm not able to give medical advice — please check with a doctor or physio before continuing. Let's take it easy for now.";

export const SAFETY_REFUSAL_MESSAGE_HINGLISH =
  "Yeh medical advice mai nahi de sakta — please ek doctor ya physio se check karo before continuing. Abhi ke liye thoda aaram karo.";

export function containsPainOrInjurySignal(text: string): boolean {
  return PAIN_PATTERNS.some((pattern) => pattern.test(text));
}

export function safetyRefusalMessage(language: Language): string {
  return language === "hinglish" ? SAFETY_REFUSAL_MESSAGE_HINGLISH : SAFETY_REFUSAL_MESSAGE_EN;
}
