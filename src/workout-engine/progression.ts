import type { WorkoutSessionRecord } from "../storage/types";

export type ProgressionAction = "increase" | "deload" | "hold";

export interface ProgressionDecision {
  action: ProgressionAction;
  weightMultiplier: number;
  reason: string;
}

const CLEAN_SESSIONS_TO_INCREASE = 2;
const INCREASE_PCT = 0.05;
const DELOAD_PCT = 0.1;
const CONSECUTIVE_FAILURES_TO_DELOAD = 2;
const LOOKBACK_SESSIONS = 5;

function setsFor(session: WorkoutSessionRecord, exerciseId: string) {
  return session.sets.filter((s) => s.exerciseId === exerciseId);
}

function isCleanSession(session: WorkoutSessionRecord, exerciseId: string): boolean {
  const sets = setsFor(session, exerciseId);
  return sets.length > 0 && sets.every((s) => !s.failure && s.reps >= s.targetReps);
}

function hasFailure(session: WorkoutSessionRecord, exerciseId: string): boolean {
  return setsFor(session, exerciseId).some((s) => s.failure);
}

function countLeadingWhile(
  sessions: WorkoutSessionRecord[],
  exerciseId: string,
  predicate: (s: WorkoutSessionRecord, id: string) => boolean
): number {
  let count = 0;
  for (const session of sessions) {
    if (!predicate(session, exerciseId)) break;
    count += 1;
  }
  return count;
}

/**
 * Plain rule-based progression — no model call. `recentSessions` must
 * already be sorted newest-first (sessionRepository.getSessionsForExercise
 * does this).
 */
export function decideProgression(
  recentSessions: WorkoutSessionRecord[],
  exerciseId: string
): ProgressionDecision {
  const relevant = recentSessions
    .filter((s) => setsFor(s, exerciseId).length > 0)
    .slice(0, LOOKBACK_SESSIONS);

  const failureStreak = countLeadingWhile(relevant, exerciseId, hasFailure);
  if (failureStreak >= CONSECUTIVE_FAILURES_TO_DELOAD) {
    return {
      action: "deload",
      weightMultiplier: 1 - DELOAD_PCT,
      reason: `${failureStreak} sessions in a row with a missed rep — dropping the weight to reset.`,
    };
  }

  const cleanStreak = countLeadingWhile(relevant, exerciseId, isCleanSession);
  if (cleanStreak >= CLEAN_SESSIONS_TO_INCREASE) {
    return {
      action: "increase",
      weightMultiplier: 1 + INCREASE_PCT,
      reason: `${cleanStreak} clean sessions in a row — bumping the weight up.`,
    };
  }

  return { action: "hold", weightMultiplier: 1, reason: "Same weight as last time." };
}
