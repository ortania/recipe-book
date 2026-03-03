import {
  collection,
  getDocs,
  addDoc,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "./config";
import { translateRecipeContent } from "../utils/translateContent";

const RECIPES_COLLECTION = "recipes";

export const fetchGlobalRecipes = async (currentUserId) => {
  try {
    const ref = collection(db, RECIPES_COLLECTION);
    const snap = await getDocs(
      query(ref, where("shareToGlobal", "==", true)),
    );

    const allRecipes = [];
    snap.forEach((d) => {
      const data = d.data();
      if (currentUserId && data.userId === currentUserId) return;
      allRecipes.push({ id: d.id, ...data });
    });

    allRecipes.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));

    console.log("🔍 fetchGlobalRecipes total:", snap.size, "| shown:", allRecipes.length);
    return { recipes: allRecipes, lastVisible: null, hasMore: false };
  } catch (error) {
    console.error("Error fetching global recipes:", error);
    return { recipes: [], lastVisible: null, hasMore: false };
  }
};

export const fetchSharerRecipes = async (sharerUserId, isPublicProfile) => {
  try {
    const ref = collection(db, RECIPES_COLLECTION);

    console.log("🔍 fetchSharerRecipes query:", { sharerUserId, isPublicProfile });

    const snap = await getDocs(query(ref, where("userId", "==", sharerUserId)));
    console.log("🔍 fetchSharerRecipes raw docs from Firestore:", snap.size);

    let recipes = [];
    snap.forEach((d) => {
      const data = d.data();
      console.log("🔍 sharerDoc:", data.name, "| shareToGlobal:", data.shareToGlobal, "| userId:", data.userId);
      recipes.push({ id: d.id, ...data });
    });

    if (!isPublicProfile) {
      recipes = recipes.filter((r) => r.shareToGlobal === true);
      console.log("🔍 after shareToGlobal filter:", recipes.length);
    }

    recipes.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    console.log("🔍 fetchSharerRecipes final:", recipes.length, "recipes");
    return recipes;
  } catch (error) {
    console.error("Error fetching sharer recipes:", error);
    return [];
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
      shareToGlobal: false,
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
