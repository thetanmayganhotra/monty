import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const GROQ_API_KEY: string = extra.groqApiKey ?? "";
export const GROQ_MODEL: string | undefined = extra.groqModel || undefined;
export const SUPABASE_URL: string = extra.supabaseUrl ?? "";
export const SUPABASE_ANON_KEY: string = extra.supabaseAnonKey ?? "";

export const FIREBASE_CONFIG = {
  apiKey: extra.firebaseApiKey ?? "",
  authDomain: extra.firebaseAuthDomain ?? "",
  projectId: extra.firebaseProjectId ?? "",
  storageBucket: extra.firebaseStorageBucket ?? "",
  messagingSenderId: extra.firebaseMessagingSenderId ?? "",
  appId: extra.firebaseAppId ?? "",
};

export function isGroqConfigured(): boolean {
  return Boolean(GROQ_API_KEY);
}

export function isFirebaseConfigured(): boolean {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId);
}
