import { doc, setDoc } from "firebase/firestore";
import { getCurrentUid } from "../auth/session";
import { isFirebaseConfigured } from "../config/env";
import { firestore } from "./firebaseClient";

/**
 * Fire-and-forget mirror of a local write to Firestore, under
 * users/{uid}/{collectionName}/{docId}. No-ops silently when Firebase
 * isn't configured or nobody's signed in — AsyncStorage (src/storage/)
 * stays the source of truth for reads either way; this is best-effort
 * cloud backup so the same data is available if the user signs in on
 * another device later.
 */
export function syncWrite<T extends object>(collectionName: string, docId: string, data: T): void {
  if (!isFirebaseConfigured() || !firestore) return;
  const uid = getCurrentUid();
  if (!uid) return;

  setDoc(doc(firestore, "users", uid, collectionName, docId), data, { merge: true }).catch((err) => {
    console.warn(`Firestore sync failed for ${collectionName}/${docId}:`, err);
  });
}
