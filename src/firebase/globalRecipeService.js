import {
  collection,
  getDocs,
  addDoc,
  doc,
  query,
  where,
  getDoc,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./config";
import { translateRecipeContent } from "../utils/translateContent";

const RECIPES_COLLECTION = "recipes";
const SEARCH_COMMUNITY_URL =
  "https://us-central1-recipe-book-82d57.cloudfunctions.net/searchCommunityRecipes";

export const fetchGlobalRecipesCount = async () => {
  try {
    const ref = collection(db, RECIPES_COLLECTION);
    const q = query(ref, where("shareToGlobal", "==", true));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch (error) {
    console.error("Error fetching global recipes count:", error);
    return 0;
  }
};

export const searchCommunityRecipes = async ({
  searchTerm = "",
  categoryId = "",
  sortBy = "avgRating",
  sortDirection = "desc",
  cursor = null,
  pageSize = 30,
  excludeUserId = null,
  sharerUserId = null,
} = {}) => {
  try {
    const response = await fetch(SEARCH_COMMUNITY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchTerm,
        categoryId,
        sortBy,
        sortDirection,
        cursor,
        pageSize,
        excludeUserId,
        sharerUserId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return {
      recipes: data.recipes || [],
      cursor: data.cursor || null,
      total: data.total || 0,
    };
  } catch (error) {
    console.error("Error searching community recipes:", error);
    return { recipes: [], cursor: null, total: 0 };
  }
};

// Legacy wrapper for backward compatibility
export const fetchGlobalRecipes = async (currentUserId) => {
  return searchCommunityRecipes({
    excludeUserId: currentUserId,
    pageSize: 9999,
  });
};

export const fetchSharerRecipes = async (sharerUserId, isPublicProfile) => {
  try {
    const ref = collection(db, RECIPES_COLLECTION);

    const snap = await getDocs(query(ref, where("userId", "==", sharerUserId)));

    let recipes = [];
    snap.forEach((d) => {
      const data = d.data();
      recipes.push({ id: d.id, ...data });
    });

    if (!isPublicProfile) {
      recipes = recipes.filter((r) => r.shareToGlobal === true);
    }

    recipes.sort((a, b) =>
      (b.updatedAt || "").localeCompare(a.updatedAt || ""),
    );
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
