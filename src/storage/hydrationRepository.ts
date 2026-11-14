import { syncWrite } from "../backend/firestoreSync";
import { getJSON, setJSON } from "./asyncStore";
import type { HydrationDay } from "./types";

const KEY = "monty:hydration";
const DEFAULT_TARGET_CUPS = 8;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getAllHydrationDays(): Promise<HydrationDay[]> {
  return (await getJSON<HydrationDay[]>(KEY)) ?? [];
}

export async function getTodayHydration(): Promise<HydrationDay> {
  const all = await getAllHydrationDays();
  const today = todayISO();
  return all.find((d) => d.dateISO === today) ?? { dateISO: today, cupsLogged: 0, targetCups: DEFAULT_TARGET_CUPS };
}

export async function logCup(): Promise<HydrationDay> {
  const all = await getAllHydrationDays();
  const today = todayISO();
  const existing = all.find((d) => d.dateISO === today);
  const updated: HydrationDay = existing
    ? { ...existing, cupsLogged: existing.cupsLogged + 1 }
    : { dateISO: today, cupsLogged: 1, targetCups: DEFAULT_TARGET_CUPS };

  await setJSON(KEY, [...all.filter((d) => d.dateISO !== today), updated]);
  syncWrite("hydration", today, updated);
  return updated;
}
