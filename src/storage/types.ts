import type { VerbosityLevel } from "../workout-engine/types";

export type Goal = "strength" | "hypertrophy" | "fat_loss" | "general_fitness";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type Equipment = "bodyweight_only" | "dumbbells" | "full_gym";
export type Language = "en" | "hinglish";

export interface UserProfile {
  id: string;
  goal: Goal;
  experience: ExperienceLevel;
  equipment: Equipment;
  sessionDurationMinutes: number;
  frequencyPerWeek: number;
  coachingStyle: VerbosityLevel;
  language: Language;
  createdAt: string;
  /** Plans the user has explicitly reviewed & approved. Gates full autonomy — see planApproval.ts. */
  approvedPlanCount: number;
  /** Needed for the MET-based calorie estimate — see src/analytics/calorieEstimator.ts. */
  bodyWeightKg?: number;
}

export interface SetLogEntry {
  exerciseId: string;
  setNumber: number;
  weight?: number;
  weightUnit?: "kg" | "lb";
  reps: number;
  targetReps: number;
  failure: boolean;
  /** Rough MET-based estimate, computed deterministically when the set is logged. */
  caloriesBurnt?: number;
}

export type MoodLevel = "great" | "ok" | "rough";
export type FatigueLevel = "low" | "medium" | "high";

export interface MoodSignal {
  mood: MoodLevel;
  fatigue: FatigueLevel;
  notes?: string;
}

export interface WorkoutSessionRecord {
  id: string;
  templateId: string;
  dateISO: string;
  sets: SetLogEntry[];
  moodSignal?: MoodSignal;
  completed: boolean;
}

/** Standalone mood log, independent of whether a workout followed — powers the mood trend. */
export interface MoodLogEntry {
  id: string;
  dateISO: string;
  signal: MoodSignal;
}

export interface BodyMeasurement {
  id: string;
  dateISO: string;
  weightKg?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
}

export interface HydrationDay {
  /** Calendar date, YYYY-MM-DD — one record per day. */
  dateISO: string;
  cupsLogged: number;
  targetCups: number;
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  earnedAtISO: string;
}
