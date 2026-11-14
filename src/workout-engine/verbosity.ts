import type { Language } from "../storage/types";
import type { EngineEvent, VerbosityLevel } from "./types";

type PhraseMap = Partial<Record<VerbosityLevel, string>>;

/**
 * Pure phrase templates — no model call. Given an engine event, the
 * user's verbosity level, and language, return what Monty should say
 * (or null for silent / events that level doesn't narrate). Hinglish
 * phrasing is hand-written here, not translated at runtime — same
 * deterministic-no-LLM guarantee as English.
 */
export function phraseFor(event: EngineEvent, level: VerbosityLevel, language: Language = "en"): string | null {
  if (level === "silent") return null;

  const phrases = language === "hinglish" ? hinglishPhrases(event) : englishPhrases(event);
  return phrases?.[level] ?? null;
}

function englishPhrases(event: EngineEvent): PhraseMap | null {
  switch (event.type) {
    case "workout_start":
      return {
        minimal: "Workout started.",
        coach: "Alright, let's get moving. Here we go.",
        hype: "Let's GO! Time to work!",
      };

    case "exercise_announce":
      if (!event.exercise) return null;
      return {
        minimal: `${event.exercise.name}. ${event.exercise.sets} sets of ${event.exercise.reps}.`,
        coach: `Next up: ${event.exercise.name}. ${event.exercise.sets} sets, ${event.exercise.reps} reps. You've got this.`,
        hype: `Next up — ${event.exercise.name}! ${event.exercise.sets} sets of ${event.exercise.reps}, let's crush it!`,
      };

    case "set_start":
      if (!event.setNumber || !event.totalSets) return null;
      return {
        minimal: `Set ${event.setNumber} of ${event.totalSets}.`,
        coach: `Set ${event.setNumber} of ${event.totalSets}. Nice and controlled.`,
        hype: `Set ${event.setNumber} of ${event.totalSets}! Push it!`,
      };

    case "set_complete":
      return {
        minimal: "Set done.",
        coach: "Good set. Take your rest.",
        hype: "Boom! That's a set. Shake it out!",
      };

    case "rest_start":
      if (!event.secondsRemaining) return null;
      return {
        minimal: `Rest ${event.secondsRemaining} seconds.`,
        coach: `Rest up for ${event.secondsRemaining} seconds. Breathe.`,
        hype: `Quick ${event.secondsRemaining} second breather — you earned it!`,
      };

    case "rest_complete":
      return {
        minimal: "Rest over.",
        coach: "Rest's up. Ready when you are.",
        hype: "Time's up — let's get back at it!",
      };

    case "workout_complete":
      return {
        minimal: "Workout complete.",
        coach: "That's the workout. Well done today.",
        hype: "WORKOUT COMPLETE! You crushed that!",
      };

    case "command_unrecognized":
      return {
        minimal: "Didn't catch that.",
        coach: "Sorry, didn't catch that — try again.",
        hype: "Say again? Didn't catch that one!",
      };

    default:
      return null;
  }
}

function hinglishPhrases(event: EngineEvent): PhraseMap | null {
  switch (event.type) {
    case "workout_start":
      return {
        minimal: "Workout start ho gaya.",
        coach: "Chalo, shuru karte hain. Ready ho jao.",
        hype: "Chalo bhai, full josh mein! Let's go!",
      };

    case "exercise_announce":
      if (!event.exercise) return null;
      return {
        minimal: `${event.exercise.name}. ${event.exercise.sets} sets, ${event.exercise.reps} reps.`,
        coach: `Ab karenge ${event.exercise.name}. ${event.exercise.sets} sets, ${event.exercise.reps} reps. Tum kar loge, easy hai.`,
        hype: `Next hai ${event.exercise.name}! ${event.exercise.sets} sets of ${event.exercise.reps} — todd do isko!`,
      };

    case "set_start":
      if (!event.setNumber || !event.totalSets) return null;
      return {
        minimal: `Set ${event.setNumber} of ${event.totalSets}.`,
        coach: `Set ${event.setNumber} of ${event.totalSets}. Control mein karo.`,
        hype: `Set ${event.setNumber} of ${event.totalSets}! Poora daal do!`,
      };

    case "set_complete":
      return {
        minimal: "Set khatam.",
        coach: "Badhiya set tha. Ab rest karo.",
        hype: "Zabardast! Set ho gaya. Shake it out!",
      };

    case "rest_start":
      if (!event.secondsRemaining) return null;
      return {
        minimal: `${event.secondsRemaining} second rest.`,
        coach: `${event.secondsRemaining} second rest lo. Saans lo aaram se.`,
        hype: `${event.secondsRemaining} second ka break — hakdaar ho tum!`,
      };

    case "rest_complete":
      return {
        minimal: "Rest khatam.",
        coach: "Rest ho gaya. Jab ready ho, bolo.",
        hype: "Time up — wapas lag jao!",
      };

    case "workout_complete":
      return {
        minimal: "Workout complete.",
        coach: "Workout ho gaya. Aaj badhiya kiya.",
        hype: "WORKOUT DONE! Aaj toh mast kiya tumne!",
      };

    case "command_unrecognized":
      return {
        minimal: "Samajh nahi aaya.",
        coach: "Sorry, samajh nahi aaya — phir se bolo.",
        hype: "Kya bola? Phir se bolo zara!",
      };

    default:
      return null;
  }
}
