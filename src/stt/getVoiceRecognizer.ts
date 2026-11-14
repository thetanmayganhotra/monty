import { Platform } from "react-native";
import { UnsupportedVoiceRecognizer } from "./unsupportedRecognizer";
import { WebVoiceRecognizer } from "./webSpeechRecognizer";
import type { VoiceRecognizer } from "./types";

let cached: VoiceRecognizer | null = null;

/**
 * Today: Web Speech API on web, unsupported placeholder on native.
 * TODO: add a native provider (expo-speech-recognition, wraps on-device
 * iOS/Android STT) behind this same VoiceRecognizer interface once a dev
 * client build exists to test it against — swap the native branch below,
 * nothing else changes.
 */
export function getVoiceRecognizer(): VoiceRecognizer {
  if (!cached) {
    cached = Platform.OS === "web" ? new WebVoiceRecognizer() : new UnsupportedVoiceRecognizer();
  }
  return cached;
}
