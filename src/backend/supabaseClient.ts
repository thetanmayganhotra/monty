import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config/env";

/**
 * Not connected to a live project yet — SUPABASE_URL / SUPABASE_ANON_KEY
 * are empty until you create a project at supabase.com (requires your
 * own account; not something that can be done on your behalf) and paste
 * the values into .env. Until then, isSupabaseConfigured() is false and
 * the app keeps using the local AsyncStorage repositories in src/storage/
 * — same shape, so migrating a repository to Supabase later means
 * rewriting its internals, not its call sites.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
