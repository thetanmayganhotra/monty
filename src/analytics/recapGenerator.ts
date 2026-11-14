import { computeStreak } from "../gamification/streaks";
import type { WorkoutSessionRecord } from "../storage/types";
import { totalCaloriesForSession } from "./exerciseTrends";

export interface RecapStats {
  periodLabel: string;
  workoutsCompleted: number;
  totalSets: number;
  totalCalories: number;
  currentStreak: number;
}

/** All arithmetic — no LLM. The LLM only writes copy on top of this (see generateRecapIntro). */
export function computeRecapStats(
  sessions: WorkoutSessionRecord[],
  periodDays: number,
  periodLabel: string
): RecapStats {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffISO = cutoff.toISOString();

  const inPeriod = sessions.filter((s) => s.completed && s.dateISO >= cutoffISO);
  const totalSets = inPeriod.reduce((sum, s) => sum + s.sets.length, 0);
  const totalCalories = Math.round(inPeriod.reduce((sum, s) => sum + totalCaloriesForSession(s), 0) * 10) / 10;
  const { currentStreak } = computeStreak(sessions);

  return { periodLabel, workoutsCompleted: inPeriod.length, totalSets, totalCalories, currentStreak };
}
