import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { FIREBASE_CONFIG, isFirebaseConfigured } from "../config/env";

/**
 * Not connected to a live project yet — FIREBASE_* vars are empty until
 * you create a project at console.firebase.google.com (your own account;
 * not something that can be done on your behalf), add a Web app, enable
 * Phone auth + Firestore, and paste the config into .env. Until then,
 * isFirebaseConfigured() is false and every repository in src/storage/
 * keeps using local AsyncStorage — same record shapes, so once this is
 * live, writes just also get mirrored to Firestore (see syncWrite in
 * src/backend/firestoreSync.ts) without changing how screens read data.
 */
export { isFirebaseConfigured };

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured()) {
  app = getApps().length ? getApps()[0]! : initializeApp(FIREBASE_CONFIG);
  firestore = getFirestore(app);
  // TODO before shipping: plain getAuth() doesn't persist sign-in across
  // app restarts on native (no window.localStorage there), so users will
  // get logged out every relaunch. Fix once a real project exists to
  // test against: `import { initializeAuth, getReactNativePersistence }
  // from "@firebase/auth"` (not the "firebase" wrapper package — its
  // ./auth export has no react-native condition in this SDK version) and
  // pass `{ persistence: getReactNativePersistence(AsyncStorage) }` on
  // native only. Left as plain getAuth() here rather than an unverified
  // import, since a wrong one would crash the app at startup.
  auth = getAuth(app);
}

export { app as firebaseApp, firestore, auth };
