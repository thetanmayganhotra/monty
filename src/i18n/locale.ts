import type { Language } from "../storage/types";

/** Shared BCP-47 locale mapping — used by both TTS (speak.ts) and STT. */
export function languageToLocale(language: Language): string {
  return language === "hinglish" ? "hi-IN" : "en-IN";
}
