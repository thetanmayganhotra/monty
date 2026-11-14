import { syncWrite } from "../backend/firestoreSync";
import { getJSON, setJSON } from "./asyncStore";
import type { UserProfile } from "./types";

const KEY = "monty:profile";

export async function getProfile(): Promise<UserProfile | null> {
  return getJSON<UserProfile>(KEY);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await setJSON(KEY, profile);
  syncWrite("profile", profile.id, profile);
}

export async function incrementApprovedPlanCount(): Promise<UserProfile | null> {
  const profile = await getProfile();
  if (!profile) return null;
  const updated = { ...profile, approvedPlanCount: profile.approvedPlanCount + 1 };
  await saveProfile(updated);
  return updated;
}
