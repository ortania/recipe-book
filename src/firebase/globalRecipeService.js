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
import { resolveCommunityView } from "../utils/publishedSnapshot";

const RECIPES_COLLECTION = "recipes";
const SEARCH_COMMUNITY_URL = import.meta.env.VITE_CLOUD_SEARCH_URL;

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
    // Defense in depth: even if the deployed Cloud Function returns the
    // raw doc (e.g. an older revision that hasn't been redeployed since
    // the snapshot system was introduced), apply the snapshot projection
    // on the client too so the community view never leaks the sharer's
    // post-publish edits.
    const recipes = (data.recipes || []).map((r) => resolveCommunityView(r));
    return {
      recipes,
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

export const fetchSharerRecipes = async (sharerUserId) => {
  try {
    const ref = collection(db, RECIPES_COLLECTION);

    // Always restrict to recipes the user explicitly shared to the community.
    // publicProfile only controls whether the profile itself is visible; it
    // must never expose private/personal recipes.
    const snap = await getDocs(
      query(
        ref,
        where("userId", "==", sharerUserId),
        where("shareToGlobal", "==", true),
      ),
    );

    const recipes = [];
    snap.forEach((d) => {
      // Always surface the frozen community version, not the sharer's
      // current private edits.
      recipes.push(resolveCommunityView({ id: d.id, ...d.data() }));
    });

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

    // Always copy the community-visible version of the recipe — this is
    // the frozen snapshot that was published, not the sharer's current
    // private edits. Legacy recipes without a snapshot fall back to the
    // live fields (which IS what the community sees for them).
    const communityView = resolveCommunityView({ id: snap.id, ...snap.data() });
    const {
      id: _srcId,
      userId, createdAt, updatedAt, order, categories,
      avgRating, ratingCount,
      publishedSnapshot,
      shareToGlobal,
      sharerUserId,
      sharerName,
      showMyName,
      ...recipeData
    } = communityView;

    // If the source recipe was imported from the web (either explicitly
    // flagged or legacy recipes that have a non-empty sourceUrl), keep
    // attribution on the copy and do NOT carry over the external image.
    const isImported =
      recipeData.importedFromUrl === true ||
      (recipeData.importedFromUrl === undefined && !!recipeData.sourceUrl);
    if (isImported) {
      recipeData.importedFromUrl = true;
      recipeData.image_src = "";
      recipeData.images = [];
    }

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
