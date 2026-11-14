import type { VerbosityLevel } from "../workout-engine/types";
import type { Equipment, ExperienceLevel, Goal, Language } from "../storage/types";

export interface OnboardingAnswers {
  goal: Goal;
  experience: ExperienceLevel;
  equipment: Equipment;
  sessionDurationMinutes: number;
  frequencyPerWeek: number;
  coachingStyle: VerbosityLevel;
  language: Language;
}

export const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "strength", label: "Get Stronger" },
  { value: "hypertrophy", label: "Build Muscle" },
  { value: "fat_loss", label: "Lose Fat" },
  { value: "general_fitness", label: "Stay Fit" },
];

export const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "bodyweight_only", label: "Bodyweight Only" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "full_gym", label: "Full Gym" },
];

export const DURATION_OPTIONS = [20, 30, 45, 60];
export const FREQUENCY_OPTIONS = [2, 3, 4, 5, 6];

export const COACHING_STYLE_OPTIONS: { value: VerbosityLevel; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "coach", label: "Coach" },
  { value: "hype", label: "Hype" },
  { value: "silent", label: "Silent" },
];

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hinglish", label: "Hinglish" },
];
