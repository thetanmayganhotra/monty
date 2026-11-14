import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../backend/firebaseClient";
import { isFirebaseConfigured } from "../config/env";

let currentUser: User | null = null;
const listeners = new Set<(user: User | null) => void>();

if (isFirebaseConfigured() && auth) {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    listeners.forEach((l) => l(user));
  });
}

export function getCurrentUid(): string | null {
  return currentUser?.uid ?? null;
}

/** Returns an unsubscribe function; fires immediately with the current state. */
export function subscribeAuthState(listener: (user: User | null) => void): () => void {
  listeners.add(listener);
  listener(currentUser);
  return () => listeners.delete(listener);
}
