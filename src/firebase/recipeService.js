import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import { translateRecipeContent } from "../utils/translateContent";

const RECIPES_COLLECTION = "recipes";
export const RECIPES_PER_PAGE = 50;

export const fetchRecipes = async (
  limitCount = RECIPES_PER_PAGE,
  userId = null,
  lastDoc = null,
) => {
  try {
    const recipesRef = collection(db, RECIPES_COLLECTION);

    let q;
    if (userId) {
      q = lastDoc
        ? query(
            recipesRef,
            where("userId", "==", userId),
            orderBy("order"),
            startAfter(lastDoc),
            limit(limitCount),
          )
        : query(
            recipesRef,
            where("userId", "==", userId),
            orderBy("order"),
            limit(limitCount),
          );
    } else {
      q = lastDoc
        ? query(
            recipesRef,
            orderBy("order"),
            startAfter(lastDoc),
            limit(limitCount),
          )
        : query(recipesRef, orderBy("order"), limit(limitCount));
    }

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (indexError) {
      console.warn(
        "⚠️ fetchRecipes index query failed, falling back:",
        indexError.message,
      );
      if (userId) {
        q = query(recipesRef, where("userId", "==", userId), limit(limitCount));
      } else {
        q = query(recipesRef, limit(limitCount));
      }
      querySnapshot = await getDocs(q);
    }

    const recipes = [];
    querySnapshot.forEach((doc) => {
      recipes.push({ id: doc.id, ...doc.data() });
    });

    recipes.sort((a, b) => (a.order || 0) - (b.order || 0));

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = querySnapshot.docs.length === limitCount;

    return { recipes, lastVisible, hasMore };
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return { recipes: [], lastVisible: null, hasMore: false };
  }
};

export const getRecipeById = async (recipeId) => {
  try {
    const docRef = doc(db, RECIPES_COLLECTION, recipeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error("Error fetching recipe by ID:", error);
    return null;
  }
};

export const addRecipe = async (recipe, userId) => {
  try {
    const recipesRef = collection(db, RECIPES_COLLECTION);

    const recipeData = {
      ...recipe,
      userId,
      order: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(recipesRef, recipeData);

    return {
      id: docRef.id,
      ...recipe,
      order: recipeData.order,
    };
  } catch (error) {
    console.error("Error adding recipe:", error);
    throw error;
  }
};

export const updateRecipe = async (recipeId, updatedData) => {
  try {
    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);
    const raw = {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    const dataToSave = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined),
    );

    await updateDoc(recipeRef, dataToSave);

    return { id: recipeId, ...updatedData };
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
};

export const deleteRecipe = async (recipeId) => {
  try {
    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);
    await deleteDoc(recipeRef);
    return true;
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
};

export const deleteRecipesByCategory = async (categoryId, userId = null) => {
  try {
    const recipesRef = collection(db, RECIPES_COLLECTION);
    let q;

    if (categoryId === "all") {
      q = userId
        ? query(recipesRef, where("userId", "==", userId))
        : query(recipesRef);
    } else {
      q = userId
        ? query(
            recipesRef,
            where("userId", "==", userId),
            where("categories", "array-contains", categoryId),
          )
        : query(recipesRef, where("categories", "array-contains", categoryId));
    }

    const querySnapshot = await getDocs(q);

    const BATCH_LIMIT = 500;
    const docs = querySnapshot.docs;

    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + BATCH_LIMIT);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.error("Error deleting recipes by category:", error);
    throw error;
  }
};

export const copyRecipeToUser = async (recipe, targetUserId, targetLang) => {
  try {
    const recipesRef = collection(db, RECIPES_COLLECTION);

    const { id, userId, createdAt, updatedAt, categories, ...recipeData } =
      recipe;

    let translatedData = recipeData;
    if (targetLang && targetLang !== "mixed") {
      try {
        translatedData = await translateRecipeContent(recipeData, targetLang);
      } catch (err) {
        console.warn("Translation failed, copying without translation:", err);
      }
    }

    const copiedRecipe = {
      ...translatedData,
      categories: [],
      userId: targetUserId,
      order: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(recipesRef, copiedRecipe);

    return { id: docRef.id, ...copiedRecipe };
  } catch (error) {
    console.error("Error copying recipe to user:", error);
    throw error;
  }
};

export const fetchRecipesByCategory = async (categoryId, userId = null) => {
  try {
    const recipesRef = collection(db, RECIPES_COLLECTION);

    if (categoryId === "all") {
      return await fetchRecipes(RECIPES_PER_PAGE, userId);
    }

    const constraints = [
      where("categories", "array-contains", categoryId),
      orderBy("name"),
      limit(200),
    ];

    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }

    let querySnapshot;
    try {
      querySnapshot = await getDocs(query(recipesRef, ...constraints));
    } catch (indexError) {
      console.warn(
        "⚠️ fetchRecipesByCategory index failed, falling back:",
        indexError.message,
      );
      const fallback = [
        where("categories", "array-contains", categoryId),
        limit(200),
      ];
      if (userId) fallback.unshift(where("userId", "==", userId));
      querySnapshot = await getDocs(query(recipesRef, ...fallback));
    }

    const recipes = [];
    querySnapshot.forEach((doc) => {
      recipes.push({ id: doc.id, ...doc.data() });
    });

    return recipes;
  } catch (error) {
    console.error("Error fetching recipes by category:", error);
    return [];
  }
};
