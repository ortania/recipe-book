import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

const REPORTS_COLLECTION = "communityReports";

/**
 * Submit a report on a community recipe.
 *
 * Writes one document to the top-level `communityReports` collection with
 * `status: "open"` so future moderation tooling can sort/filter by status.
 *
 * Firestore rules required (create-only from clients):
 *   match /communityReports/{reportId} {
 *     allow create: if request.auth != null
 *                   && request.resource.data.reporterUserId == request.auth.uid;
 *     allow read, update, delete: if false;
 *   }
 *
 * @param {Object} params
 * @param {string} params.recipeId        — ID of the reported recipe
 * @param {string} params.recipeOwnerId   — recipe.userId at report time
 * @param {string} params.reporterUserId  — current user's uid
 * @param {"offensive"|"infringement"|"misleading"|"spam"|"other"} params.reason
 * @param {string} [params.details]       — free-text, only meaningful for "other"
 * @returns {Promise<string>} the new report's document id
 */
export const reportCommunityRecipe = async ({
  recipeId,
  recipeOwnerId,
  reporterUserId,
  reason,
  details = "",
}) => {
  if (!recipeId) throw new Error("recipeId is required");
  if (!reporterUserId) throw new Error("reporterUserId is required");
  if (!reason) throw new Error("reason is required");

  const ref = await addDoc(collection(db, REPORTS_COLLECTION), {
    recipeId,
    recipeOwnerId: recipeOwnerId || "",
    reporterUserId,
    reason,
    details: details.trim().slice(0, 500),
    createdAt: serverTimestamp(),
    status: "open",
  });
  return ref.id;
};
