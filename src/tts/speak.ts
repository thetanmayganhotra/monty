import * as Speech from "expo-speech";
import { languageToLocale } from "../i18n/locale";
import type { Language } from "../storage/types";

/**
 * Thin wrapper over the system TTS. Cancels any in-flight utterance first
 * so events (e.g. "next" during a rest countdown) don't queue up and talk
 * over each other. Hinglish text still uses the en-IN voice (closest
 * available system locale that renders code-switched text intelligibly);
 * a dedicated Hinglish voice is a premium-TTS-provider concern per spec,
 * not v0-v2 scope.
 */
export function speak(text: string | null, language: Language = "en"): void {
  if (!text) return;
  Speech.stop();
  Speech.speak(text, { language: languageToLocale(language), pitch: 1.0, rate: 1.0 });
}

export function stopSpeaking(): void {
  Speech.stop();
}
