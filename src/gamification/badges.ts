import type { Badge, WorkoutSessionRecord } from "../storage/types";
import { computeStreak } from "./streaks";

/**
 * Badges are derived fresh from session history every time, not stored —
 * same reasoning as streaks: no separate counter that can drift out of
 * sync with the actual data.
 */
export function computeEarnedBadges(sessions: WorkoutSessionRecord[]): Badge[] {
  const completed = sessions.filter((s) => s.completed).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const totalSets = completed.reduce((sum, s) => sum + s.sets.length, 0);
  const { longestStreak } = computeStreak(sessions);
  const latestDate = completed[completed.length - 1]?.dateISO ?? new Date().toISOString();

  const badges: Badge[] = [];
  const earn = (id: string, label: string, description: string, dateISO: string) =>
    badges.push({ id, label, description, earnedAtISO: dateISO });

  if (completed.length >= 1) earn("first_workout", "First Rep", "Completed your first workout", completed[0].dateISO);
  if (completed.length >= 10) earn("ten_workouts", "Regular", "Completed 10 workouts", completed[9].dateISO);
  if (completed.length >= 50) earn("fifty_workouts", "Veteran", "Completed 50 workouts", completed[49].dateISO);
  if (totalSets >= 50) earn("fifty_sets", "Set Machine", "Logged 50 sets total", latestDate);
  if (longestStreak >= 3) earn("streak_3", "On a Roll", "3-day streak", latestDate);
  if (longestStreak >= 7) earn("streak_7", "Unstoppable", "7-day streak", latestDate);
  if (longestStreak >= 30) earn("streak_30", "Iron Will", "30-day streak", latestDate);

  return badges;
}
