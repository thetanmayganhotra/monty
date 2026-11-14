import type { MoodSignal } from "../storage/types";
import type { VerbosityLevel, WorkoutTemplate } from "./types";

export interface IntensityAdjustment {
  setMultiplier: number;
  repMultiplier: number;
  restMultiplier: number;
  verbosityOverride?: VerbosityLevel;
  reason: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Deterministic mapping from a mood/fatigue signal to a workout
 * adjustment. The LLM (moodCheckIn.ts) only produces the signal — this
 * function, not the model, decides what happens to the workout.
 */
export function adjustForMoodSignal(signal: MoodSignal): IntensityAdjustment {
  if (signal.fatigue === "high" || signal.mood === "rough") {
    return {
      setMultiplier: 0.8,
      repMultiplier: 0.85,
      restMultiplier: 1.25,
      verbosityOverride: "minimal",
      reason: "Sounds like today's rough — dialing the intensity back a bit.",
    };
  }
  if (signal.fatigue === "low" && signal.mood === "great") {
    return {
      setMultiplier: 1.1,
      repMultiplier: 1,
      restMultiplier: 0.9,
      reason: "You sound fresh — pushing a little harder today.",
    };
  }
  return { setMultiplier: 1, repMultiplier: 1, restMultiplier: 1, reason: "Standard session today." };
}

export function applyIntensityAdjustment(
  template: WorkoutTemplate,
  adjustment: IntensityAdjustment
): WorkoutTemplate {
  return {
    ...template,
    exercises: template.exercises.map((exercise) => ({
      ...exercise,
      sets: clamp(Math.round(exercise.sets * adjustment.setMultiplier), 1, 6),
      reps: clamp(Math.round(exercise.reps * adjustment.repMultiplier), 4, 25),
      restSeconds: clamp(Math.round(exercise.restSeconds * adjustment.restMultiplier), 15, 120),
    })),
  };
}
