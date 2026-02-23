import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

/**
 * Get a single user's rating for a recipe.
 * Returns 0 if no rating exists.
 */
export async function getUserRating(recipeId, userId) {
  const ref = doc(db, "recipes", recipeId, "ratings", userId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().rating : 0;
}

/**
 * Fetch the current user's ratings for a batch of recipe IDs.
 * Returns a Map<recipeId, rating>.
 */
export async function getUserRatingsBatch(recipeIds, userId) {
  const ratings = new Map();
  if (!recipeIds.length || !userId) return ratings;

  const promises = recipeIds.map(async (rid) => {
    const ref = doc(db, "recipes", rid, "ratings", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) ratings.set(rid, snap.data().rating);
  });

  await Promise.all(promises);
  return ratings;
}

/**
 * Set or update the current user's rating for a recipe.
 */
export async function setUserRating(recipeId, userId, rating) {
  const ref = doc(db, "recipes", recipeId, "ratings", userId);
  await setDoc(ref, { rating, updatedAt: serverTimestamp() });
}
