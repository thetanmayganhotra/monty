import type { ExerciseKind } from "../workout-engine/types";

/**
 * Rough MET-based estimate — plain arithmetic, no model call. This is a
 * standard fitness-app formula (kcal/min = MET * 3.5 * bodyWeightKg / 200),
 * not a lab measurement; it's meant to give the user a directionally
 * useful number, not clinical accuracy.
 */
const MET_BY_KIND: Record<ExerciseKind, number> = {
  bodyweight: 5.0, // vigorous calisthenics
  dumbbell: 4.5, // general resistance training
};

const DEFAULT_BODY_WEIGHT_KG = 70;
const SECONDS_PER_REP = 3;

export function estimateSetDurationMinutes(reps: number): number {
  return (reps * SECONDS_PER_REP) / 60;
}

export function estimateCaloriesForSet(
  exerciseKind: ExerciseKind,
  actualReps: number,
  bodyWeightKg: number | undefined
): number {
  const met = MET_BY_KIND[exerciseKind];
  const weight = bodyWeightKg ?? DEFAULT_BODY_WEIGHT_KG;
  const minutes = estimateSetDurationMinutes(actualReps);
  const kcalPerMinute = (met * 3.5 * weight) / 200;
  return Math.round(kcalPerMinute * minutes * 10) / 10;
}
