import type { WorkoutSessionRecord } from "../storage/types";

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

function toDateOnly(dateISO: string): string {
  return dateISO.slice(0, 10);
}

function daysBetween(earlierISO: string, laterISO: string): number {
  const earlier = new Date(`${earlierISO}T00:00:00Z`).getTime();
  const later = new Date(`${laterISO}T00:00:00Z`).getTime();
  return Math.round((later - earlier) / (1000 * 60 * 60 * 24));
}

/**
 * Deterministic streak calc — no LLM, no persisted counter (always
 * recomputed from session history so it can never drift out of sync).
 * A streak counts distinct calendar days with a completed workout;
 * "current" tolerates today not having a workout logged yet (counts from
 * yesterday) but breaks on any earlier gap.
 */
export function computeStreak(sessions: WorkoutSessionRecord[]): StreakInfo {
  const uniqueDates = Array.from(new Set(sessions.filter((s) => s.completed).map((s) => toDateOnly(s.dateISO)))).sort();

  if (uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    run = daysBetween(uniqueDates[i - 1], uniqueDates[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const mostRecent = uniqueDates[uniqueDates.length - 1];
  let current = 0;
  if (daysBetween(mostRecent, todayISO) <= 1) {
    current = 1;
    for (let i = uniqueDates.length - 1; i > 0; i--) {
      if (daysBetween(uniqueDates[i - 1], uniqueDates[i]) === 1) current += 1;
      else break;
    }
  }

  return { currentStreak: current, longestStreak: longest };
}
