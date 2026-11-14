import type { WorkoutSessionRecord } from "../storage/types";

export interface ExerciseTrendPoint {
  dateISO: string;
  maxWeight?: number;
  weightUnit?: "kg" | "lb";
  totalReps: number;
  totalCalories: number;
}

/** One point per session that touched this exercise, oldest first. */
export function getExerciseTrend(sessions: WorkoutSessionRecord[], exerciseId: string): ExerciseTrendPoint[] {
  return sessions
    .filter((s) => s.sets.some((set) => set.exerciseId === exerciseId))
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .map((session) => {
      const sets = session.sets.filter((set) => set.exerciseId === exerciseId);
      const maxWeight = sets.reduce<number | undefined>(
        (max, set) => (set.weight !== undefined && (max === undefined || set.weight > max) ? set.weight : max),
        undefined
      );
      return {
        dateISO: session.dateISO,
        maxWeight,
        weightUnit: sets.find((s) => s.weightUnit)?.weightUnit,
        totalReps: sets.reduce((sum, s) => sum + s.reps, 0),
        totalCalories: Math.round(sets.reduce((sum, s) => sum + (s.caloriesBurnt ?? 0), 0) * 10) / 10,
      };
    });
}

export function totalCaloriesForSession(session: WorkoutSessionRecord): number {
  return Math.round(session.sets.reduce((sum, s) => sum + (s.caloriesBurnt ?? 0), 0) * 10) / 10;
}
