import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./config";

const USERS_COLLECTION = "users";
const BLOCKED_SUBCOLLECTION = "blockedUsers";

const blockedCol = (currentUserId) =>
  collection(db, USERS_COLLECTION, currentUserId, BLOCKED_SUBCOLLECTION);

const blockedDoc = (currentUserId, blockedUserId) =>
  doc(db, USERS_COLLECTION, currentUserId, BLOCKED_SUBCOLLECTION, blockedUserId);

/**
 * Block another user. Creates / overwrites
 * `users/{currentUserId}/blockedUsers/{blockedUserId}` with minimal fields.
 *
 * Required Firestore rules:
 *   match /users/{userId}/blockedUsers/{blockedUserId} {
 *     allow read, write: if request.auth != null && request.auth.uid == userId;
 *   }
 */
export const blockUser = async (currentUserId, blockedUserId) => {
  if (!currentUserId) throw new Error("currentUserId is required");
  if (!blockedUserId) throw new Error("blockedUserId is required");
  if (currentUserId === blockedUserId) {
    throw new Error("Cannot block yourself");
  }
  await setDoc(blockedDoc(currentUserId, blockedUserId), {
    blockedUserId,
    createdAt: serverTimestamp(),
  });
};

/**
 * Remove a block entry. Deletes
 * `users/{currentUserId}/blockedUsers/{blockedUserId}`.
 */
export const unblockUser = async (currentUserId, blockedUserId) => {
  if (!currentUserId) throw new Error("currentUserId is required");
  if (!blockedUserId) throw new Error("blockedUserId is required");
  await deleteDoc(blockedDoc(currentUserId, blockedUserId));
};

/**
 * Fetch all users blocked by the current user, enriched with basic profile
 * info (displayName, email) from `/users/{blockedUserId}`. Missing profile
 * docs are still returned (displayName/email will be empty strings) so the UI
 * can still offer "unblock".
 *
 * @returns {Promise<Array<{ blockedUserId: string, displayName: string, email: string, createdAt: any }>>}
 */
export const fetchBlockedUsers = async (currentUserId) => {
  if (!currentUserId) return [];
  const snap = await getDocs(blockedCol(currentUserId));
  const rows = snap.docs.map((d) => ({
    blockedUserId: d.id,
    createdAt: d.data()?.createdAt || null,
  }));

  const enriched = await Promise.all(
    rows.map(async (row) => {
      try {
        const userSnap = await getDoc(
          doc(db, USERS_COLLECTION, row.blockedUserId),
        );
        const data = userSnap.exists() ? userSnap.data() : {};
        return {
          ...row,
          displayName: data.displayName || "",
          email: data.email || "",
        };
      } catch {
        return { ...row, displayName: "", email: "" };
      }
    }),
  );
  return enriched;
};
