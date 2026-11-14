import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Local persistence for v0-v2. Every repository here is written behind
 * a narrow interface (get/set by key) so swapping to Supabase later
 * (per the backend deliverable) means changing these two functions,
 * not every call site.
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
