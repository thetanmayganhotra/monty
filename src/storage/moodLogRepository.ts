import { syncWrite } from "../backend/firestoreSync";
import { getJSON, setJSON } from "./asyncStore";
import type { MoodLogEntry, MoodSignal } from "./types";

const KEY = "monty:moodLogs";

export async function getAllMoodLogs(): Promise<MoodLogEntry[]> {
  return (await getJSON<MoodLogEntry[]>(KEY)) ?? [];
}

export async function addMoodLog(id: string, signal: MoodSignal): Promise<void> {
  const all = await getAllMoodLogs();
  const entry: MoodLogEntry = { id, dateISO: new Date().toISOString(), signal };
  await setJSON(KEY, [...all, entry]);
  syncWrite("moodLogs", id, entry);
}

export async function getMoodLogsSorted(): Promise<MoodLogEntry[]> {
  const all = await getAllMoodLogs();
  return all.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}
