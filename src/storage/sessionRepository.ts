import { syncWrite } from "../backend/firestoreSync";
import { getJSON, setJSON } from "./asyncStore";
import type { WorkoutSessionRecord } from "./types";

const KEY = "monty:sessions";

export async function getAllSessions(): Promise<WorkoutSessionRecord[]> {
  return (await getJSON<WorkoutSessionRecord[]>(KEY)) ?? [];
}

export async function saveSession(session: WorkoutSessionRecord): Promise<void> {
  const sessions = await getAllSessions();
  const withoutExisting = sessions.filter((s) => s.id !== session.id);
  await setJSON(KEY, [...withoutExisting, session]);
  syncWrite("sessions", session.id, session);
}

export async function getRecentSessions(limit: number): Promise<WorkoutSessionRecord[]> {
  const sessions = await getAllSessions();
  return sessions
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .slice(0, limit);
}

export async function getSessionsForExercise(exerciseId: string, limit: number): Promise<WorkoutSessionRecord[]> {
  const sessions = await getRecentSessions(50);
  return sessions
    .filter((s) => s.sets.some((set) => set.exerciseId === exerciseId))
    .slice(0, limit);
}
