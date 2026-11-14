require("dotenv").config();
const { expo } = require("./app.json");

/**
 * Layers .env values into Constants.expoConfig.extra so they're readable
 * at runtime via expo-constants (src/config/env.ts). Note: anything
 * exposed this way ships inside the client bundle — fine for local dev,
 * but GROQ_API_KEY in particular should move behind a backend/edge
 * function before shipping (see src/llm/README notes / prior chat).
 */
module.exports = {
  expo: {
    ...expo,
    extra: {
      groqApiKey: process.env.GROQ_API_KEY ?? "",
      groqModel: process.env.GROQ_MODEL ?? "",
      supabaseUrl: process.env.SUPABASE_URL ?? "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
      firebaseApiKey: process.env.FIREBASE_API_KEY ?? "",
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN ?? "",
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? "",
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "",
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? "",
      firebaseAppId: process.env.FIREBASE_APP_ID ?? "",
    },
  },
};
