import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "./config";

const SETTINGS_COLLECTION = "appSettings";
const API_KEY_DOC = "openaiKey";

let cachedKey = null;

/**
 * Fetch the OpenAI API key from Firestore (appSettings/openaiKey).
 * Falls back to VITE_OPENAI_API_KEY env var for backwards compatibility.
 * Caches the result in memory so Firestore is only queried once per session.
 */
export async function getOpenAIKey() {
  if (cachedKey) return cachedKey;

  // Try Firestore first (only if user is authenticated)
  if (auth.currentUser) {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, API_KEY_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().key) {
        cachedKey = snap.data().key;
        return cachedKey;
      }
    } catch (err) {
      console.warn("Could not fetch OpenAI key from Firestore:", err.message);
    }
  }

  // Fallback to env var
  const envKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (envKey) {
    cachedKey = envKey;
    return cachedKey;
  }

  return null;
}

/**
 * Save the OpenAI API key to Firestore so it doesn't need to be in .env.
 * Only admins / the app owner should call this.
 */
export async function saveOpenAIKey(key) {
  const docRef = doc(db, SETTINGS_COLLECTION, API_KEY_DOC);
  await setDoc(docRef, { key, updatedAt: new Date().toISOString() });
  cachedKey = key;
}

/**
 * Clear the cached key (e.g. on logout).
 */
export function clearCachedKey() {
  cachedKey = null;
}
