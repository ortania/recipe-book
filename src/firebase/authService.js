import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "./config";

const USERS_COLLECTION = "users";

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
      createdAt: new Date().toISOString(),
    });

    console.log("✅ User created:", user.uid);
    return user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
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
      createdAt: new Date().toISOString(),
    });
  }
};

export const signInWithGoogle = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await ensureGoogleUserDoc(user);
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

export const handleGoogleRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await ensureGoogleUserDoc(result.user);
      console.log("✅ Google sign-in (redirect):", result.user.uid);
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Error handling Google redirect:", error);
    return null;
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
