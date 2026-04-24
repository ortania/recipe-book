import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  verifyBeforeUpdateEmail,
  sendEmailVerification,
  reload,
} from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { ref as storageRef, listAll, deleteObject } from "firebase/storage";
import { auth, db, storage } from "./config";
import { DEFAULT_USAGE } from "../config/entitlements";

const USERS_COLLECTION = "users";
const RECIPES_COLLECTION = "recipes";

export const signupUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    await setDoc(doc(db, USERS_COLLECTION, user.uid), {
      email: user.email,
      displayName: displayName || email.split("@")[0],
      isAdmin: true,
      accessRole: "normal",
      plan: "free",
      usage: { ...DEFAULT_USAGE },
      createdAt: new Date().toISOString(),
    });

    // Best-effort: fire the verification email right after signup.
    // A failure here (rate limit, transient network) must NOT block the
    // signup flow; the user can resend from the in-app banner.
    try {
      await sendEmailVerification(user);
      console.log("📧 Verification email sent to:", user.email);
    } catch (verifyErr) {
      console.warn("Failed to send verification email:", verifyErr);
    }

    console.log("✅ User created:", user.uid);
    return user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

/**
 * Resend the verification email to the currently signed-in user. Used by
 * the in-app banner and by the typo-recovery flow in Settings → Account.
 *
 * Safe to call only for password accounts. Google users are always
 * verified by Google itself, so the banner is never shown for them.
 */
export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  await sendEmailVerification(user);
  console.log("📧 Verification email resent to:", user.email);
};

/**
 * Force Firebase Auth to reload the current user's profile from the server.
 * After the user clicks the verification link in their inbox, the
 * `emailVerified` flag on the local `auth.currentUser` object is still
 * stale — calling `reload()` refreshes it without requiring a full sign-out.
 *
 * Returns the refreshed `user.emailVerified` for convenience.
 */
export const reloadAuthUser = async () => {
  const user = auth.currentUser;
  if (!user) return false;
  await reload(user);
  return auth.currentUser?.emailVerified ?? false;
};

export const loginUser = async (email, password, rememberMe = true) => {
  try {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence,
    );
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    console.log("✅ User logged in:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

const googleProvider = new GoogleAuthProvider();

export const ensureGoogleUserDoc = async (user) => {
  if (!user) return;
  const existing = await getDoc(doc(db, USERS_COLLECTION, user.uid));
  if (!existing.exists()) {
    await setDoc(doc(db, USERS_COLLECTION, user.uid), {
      email: user.email,
      displayName: user.displayName || user.email.split("@")[0],
      isAdmin: true,
      accessRole: "normal",
      plan: "free",
      usage: { ...DEFAULT_USAGE },
      createdAt: new Date().toISOString(),
    });
  }
};

export const signInWithGoogle = async () => {
  const isNative =
    typeof window !== "undefined" &&
    window.Capacitor?.isNativePlatform?.() === true;

  if (isNative) {
    // Native Android/iOS: use the Capacitor Firebase plugin
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (!idToken) throw new Error("Google sign-in: no idToken returned");
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      console.log("✅ Google sign-in (native):", userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      if (
        error.message?.includes("cancelled") ||
        error.message?.includes("canceled") ||
        error.code === "SIGN_IN_CANCELLED"
      ) {
        return null;
      }
      console.error("Error signing in with Google (native):", error);
      throw error;
    }
  }

  // Web: popup with redirect fallback
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log("✅ Google sign-in (popup):", user.uid);
    return user;
  } catch (error) {
    if (
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request"
    ) {
      return null;
    }
    if (error.code === "auth/popup-blocked") {
      console.log("Popup blocked, falling back to redirect…");
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("✅ User logged out");
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

/**
 * Return the primary sign-in provider for the currently signed-in user.
 * Useful for the Settings > Account UI to decide whether to ask for a
 * password (email/password) or to trigger a Google reauth popup/native flow.
 *
 * Returns: "password" | "google.com" | null
 */
export const getPrimaryAuthProvider = () => {
  const user = auth.currentUser;
  if (!user || !user.providerData || user.providerData.length === 0) {
    return null;
  }
  return user.providerData[0]?.providerId || null;
};

/**
 * Extract the Storage object path from a Firebase download URL.
 *
 * Download URLs follow the shape:
 *   https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<urlEncodedPath>?...
 * Returns `null` for anything that isn't a Firebase Storage URL (e.g. an
 * external/hotlinked image from a legacy import).
 */
const extractStoragePathFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("firebasestorage")) return null;
    const match = parsed.pathname.match(/\/o\/([^?]+)/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};

/**
 * Clean up the user's owned content right before the Auth account is deleted.
 *
 * Strategy (privacy-aware):
 *  - Private recipes  (shareToGlobal !== true) → delete the Firestore doc AND
 *    delete any uploaded images that belong to it from Storage.
 *  - Shared recipes   (shareToGlobal === true) → keep the recipe but clear
 *    `sharerName` and `sharerUserId` so the community feed no longer shows
 *    the deleted user's name. Their uploaded image is KEPT in Storage so the
 *    recipe stays useful for other users.
 *  - Categories owned by the user → delete.
 *  - Meal plan docs (`mealPlans/{uid}`, `{uid}_checked`, `{uid}_shoppingList`)
 *    → delete.
 *  - Any leftover files in `recipes/{uid}/` in Storage that aren't referenced
 *    by a surviving (shared) recipe → delete.
 *
 * NOT handled here (known limitation):
 *  - Comments the user left on other users' recipes. They live in a
 *    subcollection (`recipes/{recipeId}/comments/{commentId}`); finding them
 *    requires a Firestore collection-group index on `comments.userId` that
 *    isn't deployed today. These comments keep the user's name for now.
 *
 * Every step is best-effort: failures are logged and swallowed so a single
 * failed doc doesn't block the full delete flow.
 */
const cleanupUserContent = async (uid) => {
  // Paths of images we must KEEP (belong to shared recipes we're keeping).
  const imagesToKeep = new Set();

  try {
    const recipesSnap = await getDocs(
      query(collection(db, RECIPES_COLLECTION), where("userId", "==", uid)),
    );
    await Promise.all(
      recipesSnap.docs.map((d) => {
        const data = d.data();
        if (data.shareToGlobal === true) {
          // Collect shared recipes' image paths so we don't delete them.
          // Community viewers see the snapshot fields, so preserve images
          // referenced there too (in addition to the live fields, which
          // are there for legacy shared recipes without a snapshot).
          const primary = extractStoragePathFromUrl(data.image_src);
          if (primary) imagesToKeep.add(primary);
          (data.images || []).forEach((u) => {
            const p = extractStoragePathFromUrl(u);
            if (p) imagesToKeep.add(p);
          });
          const snap = data.publishedSnapshot;
          if (snap) {
            const snapPrimary = extractStoragePathFromUrl(snap.image_src);
            if (snapPrimary) imagesToKeep.add(snapPrimary);
            (snap.images || []).forEach((u) => {
              const p = extractStoragePathFromUrl(u);
              if (p) imagesToKeep.add(p);
            });
          }
          // Anonymize the recipe at both the top level (used by the
          // sharer-profile query and the community feed filter) and
          // inside the frozen snapshot (used by community viewers).
          return updateDoc(d.ref, {
            sharerName: "",
            sharerUserId: "",
            showMyName: false,
            ...(snap
              ? {
                  "publishedSnapshot.sharerName": "",
                  "publishedSnapshot.sharerUserId": "",
                }
              : {}),
          }).catch((e) =>
            console.warn("Failed to anonymize recipe", d.id, e),
          );
        }
        return deleteDoc(d.ref).catch((e) =>
          console.warn("Failed to delete recipe", d.id, e),
        );
      }),
    );
  } catch (err) {
    console.warn("cleanupUserContent: recipes step failed:", err);
  }

  // Storage cleanup: delete every uploaded image under `recipes/{uid}/` that
  // doesn't belong to a surviving shared recipe.
  try {
    const folderRef = storageRef(storage, `recipes/${uid}`);
    const listResult = await listAll(folderRef);
    await Promise.all(
      listResult.items
        .filter((itemRef) => !imagesToKeep.has(itemRef.fullPath))
        .map((itemRef) =>
          deleteObject(itemRef).catch((e) =>
            console.warn("Failed to delete storage file", itemRef.fullPath, e),
          ),
        ),
    );
  } catch (err) {
    console.warn("cleanupUserContent: storage step failed:", err);
  }

  try {
    const catsSnap = await getDocs(
      query(collection(db, "categories"), where("userId", "==", uid)),
    );
    await Promise.all(
      catsSnap.docs.map((d) =>
        deleteDoc(d.ref).catch((e) =>
          console.warn("Failed to delete category", d.id, e),
        ),
      ),
    );
  } catch (err) {
    console.warn("cleanupUserContent: categories step failed:", err);
  }

  try {
    await Promise.all([
      deleteDoc(doc(db, "mealPlans", uid)).catch(() => {}),
      deleteDoc(doc(db, "mealPlans", `${uid}_checked`)).catch(() => {}),
      deleteDoc(doc(db, "mealPlans", `${uid}_shoppingList`)).catch(() => {}),
    ]);
  } catch (err) {
    console.warn("cleanupUserContent: mealPlans step failed:", err);
  }
};

/**
 * Permanently delete the current user's account.
 *
 * Flow:
 *  1. Reauthenticate (Firebase requires a fresh credential for destructive ops):
 *     - password users → EmailAuthProvider.credential + reauthenticateWithCredential
 *     - google.com users on native → FirebaseAuthentication.signInWithGoogle() then reauthenticateWithCredential
 *     - google.com users on web    → reauthenticateWithPopup
 *  2. Clean up user content: delete private recipes, anonymize shared recipes
 *     (clear sharerName/sharerUserId), delete categories, delete meal plans.
 *  3. Delete the Firestore users/{uid} document (done while still authenticated).
 *  4. Delete the Firebase Auth account.
 *
 * On failure in step 1 nothing is deleted. Steps 2–3 are best-effort (errors
 * are logged but don't block step 4) so the user isn't left with a half-
 * deleted account they can log back into.
 *
 * @param {{ password?: string }} options
 */
export const deleteAccount = async ({ password } = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const providerId = user.providerData[0]?.providerId;

  if (providerId === "password") {
    if (!password) {
      const err = new Error("Password required");
      err.code = "auth/missing-password";
      throw err;
    }
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  } else if (providerId === "google.com") {
    const isNative =
      typeof window !== "undefined" &&
      window.Capacitor?.isNativePlatform?.() === true;
    if (isNative) {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (!idToken) {
        const err = new Error("Google reauth failed");
        err.code = "auth/reauth-failed";
        throw err;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await reauthenticateWithCredential(user, credential);
    } else {
      await reauthenticateWithPopup(user, googleProvider);
    }
  } else {
    const err = new Error(`Unsupported provider: ${providerId}`);
    err.code = "auth/unsupported-provider";
    throw err;
  }

  const uid = user.uid;

  await cleanupUserContent(uid);

  try {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
  } catch (docErr) {
    console.warn("Failed to delete user doc:", docErr);
  }

  await deleteUser(user);
  console.log("✅ User account deleted:", uid);
};

/**
 * Start the "change email" flow for the current user.
 *
 * Firebase requires:
 *  - A recent credential (fresh reauth) for security.
 *  - The new email to be verified by the owner: Firebase sends a
 *    verification link to the new address, and the email actually changes
 *    only after the user clicks that link.
 *
 * Only supported for email/password accounts. Google users' email is
 * controlled by Google itself; the UI hides this action for them, and this
 * function throws `auth/unsupported-provider` as a safety net.
 *
 * Side effects:
 *  - Sends an email to `newEmail` via Firebase's hosted verification page.
 *  - Does NOT update Firestore yet. `RecipeBookProvider` syncs the
 *    Firestore `users/{uid}.email` the next time Auth reports a new email
 *    (i.e. after the user clicks the verification link).
 *
 * @param {{ newEmail: string, password: string }} options
 */
export const changeUserEmail = async ({ newEmail, password } = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const providerId = user.providerData[0]?.providerId;
  if (providerId !== "password") {
    const err = new Error(
      "Email change is only available for password accounts.",
    );
    err.code = "auth/unsupported-provider";
    throw err;
  }

  const trimmed = (newEmail || "").trim();
  if (!trimmed) {
    const err = new Error("New email is required");
    err.code = "auth/missing-email";
    throw err;
  }

  if (
    user.email &&
    trimmed.toLowerCase() === user.email.toLowerCase()
  ) {
    const err = new Error("The new email is the same as the current one");
    err.code = "auth/same-email";
    throw err;
  }

  if (!password) {
    const err = new Error("Password required");
    err.code = "auth/missing-password";
    throw err;
  }

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  await verifyBeforeUpdateEmail(user, trimmed);
  console.log("✅ Verification email sent to:", trimmed);
};

export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const fetchAllUsers = async () => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const querySnapshot = await getDocs(usersRef);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

export const findUserByEmail = async (email) => {
  try {
    const currentUser = auth.currentUser;
    console.log("🔍 findUserByEmail:", {
      email,
      authUid: currentUser?.uid,
      isLoggedIn: !!currentUser,
    });
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);
    console.log(
      "🔍 Query result: empty =",
      querySnapshot.empty,
      "size =",
      querySnapshot.size,
    );
    if (querySnapshot.empty) return null;
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error("Error finding user by email:", error.code, error.message);
    return null;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("✅ Password reset email sent to:", email);
    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export const updateUserProfile = async (userId, fields) => {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), fields);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const toggleFollowUser = async (currentUserId, targetUserId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, currentUserId);
    const userDoc = await getDoc(userRef);
    const data = userDoc.data();
    const following = data.following || [];
    const isFollowing = following.includes(targetUserId);
    const updated = isFollowing
      ? following.filter((id) => id !== targetUserId)
      : [...following, targetUserId];
    await updateDoc(userRef, { following: updated });
    return updated;
  } catch (error) {
    console.error("Error toggling follow:", error);
    throw error;
  }
};
