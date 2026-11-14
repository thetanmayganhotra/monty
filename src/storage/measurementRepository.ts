import { syncWrite } from "../backend/firestoreSync";
import { getJSON, setJSON } from "./asyncStore";
import type { BodyMeasurement } from "./types";

const KEY = "monty:measurements";

export async function getAllMeasurements(): Promise<BodyMeasurement[]> {
  return (await getJSON<BodyMeasurement[]>(KEY)) ?? [];
}

export async function addMeasurement(measurement: BodyMeasurement): Promise<void> {
  const all = await getAllMeasurements();
  await setJSON(KEY, [...all, measurement]);
  syncWrite("measurements", measurement.id, measurement);
}

export async function getMeasurementsSorted(): Promise<BodyMeasurement[]> {
  const all = await getAllMeasurements();
  return all.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}
