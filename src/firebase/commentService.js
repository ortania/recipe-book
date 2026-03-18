import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./config";

const getCommentsRef = (recipeId) =>
  collection(db, "recipes", recipeId, "comments");

export function subscribeToComments(recipeId, callback) {
  const q = query(getCommentsRef(recipeId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(comments);
  });
}

export async function addComment(recipeId, { userId, userName, userPhoto, text }) {
  const ref = getCommentsRef(recipeId);
  return addDoc(ref, {
    userId,
    userName,
    userPhoto: userPhoto || "",
    text: text.trim(),
    likes: [],
    likeCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function deleteComment(recipeId, commentId) {
  const ref = doc(db, "recipes", recipeId, "comments", commentId);
  return deleteDoc(ref);
}

export async function toggleCommentLike(recipeId, commentId, userId) {
  const ref = doc(db, "recipes", recipeId, "comments", commentId);
  return updateDoc(ref, {
    likes: arrayUnion(userId),
  }).catch(async () => {
    await updateDoc(ref, {
      likes: arrayRemove(userId),
    });
  });
}

export async function likeComment(recipeId, commentId, userId) {
  const ref = doc(db, "recipes", recipeId, "comments", commentId);
  await updateDoc(ref, {
    likes: arrayUnion(userId),
    likeCount: 0, // will be overridden by snapshot
  });
}

export async function unlikeComment(recipeId, commentId, userId) {
  const ref = doc(db, "recipes", recipeId, "comments", commentId);
  await updateDoc(ref, {
    likes: arrayRemove(userId),
  });
}

export async function getCommentCount(recipeId) {
  try {
    const ref = getCommentsRef(recipeId);
    const snap = await getCountFromServer(ref);
    return snap.data().count;
  } catch {
    return 0;
  }
}
