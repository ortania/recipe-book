import {
  collection,
  getDocs,
  addDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
} from "firebase/firestore";
import { db } from "./config";
import { translateRecipeContent } from "../utils/translateContent";

const RECIPES_COLLECTION = "recipes";
const FETCH_SIZE = 40;

export const fetchGlobalRecipes = async (currentUserId, lastDoc = null) => {
  try {
    const ref = collection(db, RECIPES_COLLECTION);

    const constraints = [
      where("shareToGlobal", "==", true),
      orderBy("name"),
      limit(FETCH_SIZE),
    ];
    if (lastDoc) {
      constraints.splice(2, 0, startAfter(lastDoc));
    }

    let snap;
    try {
      snap = await getDocs(query(ref, ...constraints));
    } catch (indexError) {
      console.warn(
        "⚠️ fetchGlobalRecipes composite index missing, falling back:",
        indexError.message,
      );
      const fallback = [where("shareToGlobal", "==", true), limit(FETCH_SIZE)];
      if (lastDoc) fallback.splice(1, 0, startAfter(lastDoc));
      snap = await getDocs(query(ref, ...fallback));
    }

    const recipes = [];
    snap.forEach((d) => {
      const data = d.data();
      if (currentUserId && data.userId === currentUserId) return;
      recipes.push({ id: d.id, ...data });
    });

    const lastVisible = snap.docs[snap.docs.length - 1] || null;
    const hasMore = snap.docs.length === FETCH_SIZE;
    return { recipes, lastVisible, hasMore };
  } catch (error) {
    console.error("Error fetching global recipes:", error);
    return { recipes: [], lastVisible: null, hasMore: false };
  }
};

export const copyRecipeToUser = async (recipeId, targetUserId, targetLang) => {
  try {
    const srcRef = doc(db, RECIPES_COLLECTION, recipeId);
    const snap = await getDoc(srcRef);
    if (!snap.exists()) throw new Error("Recipe not found");

    const srcData = snap.data();
    const { userId, createdAt, updatedAt, order, categories, ...recipeData } =
      srcData;

    let translatedData = recipeData;
    if (targetLang && targetLang !== "mixed") {
      try {
        translatedData = await translateRecipeContent(recipeData, targetLang);
      } catch (err) {
        console.warn("Translation failed, copying without translation:", err);
      }
    }

    const newRecipe = {
      ...translatedData,
      userId: targetUserId,
      categories: [],
      order: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      copiedFrom: recipeId,
    };

    const userRecipesRef = collection(db, RECIPES_COLLECTION);
    const docRef = await addDoc(userRecipesRef, newRecipe);
    return { id: docRef.id, ...newRecipe };
  } catch (error) {
    console.error("Error copying recipe to user:", error);
    throw error;
  }
};
