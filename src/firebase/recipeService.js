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
export const RECIPES_PER_PAGE = 50; // Number of recipes to load per page

export const fetchRecipes = async (
  limitCount = RECIPES_PER_PAGE,
  userId = null,
  lastDoc = null,
) => {
  try {
    const recipesRef = collection(db, RECIPES_COLLECTION);
    console.log(
      "📥 fetchRecipes called - userId:",
      userId,
      "limit:",
      limitCount,
      "lastDoc:",
      !!lastDoc,
    );

    // Build query with proper ordering and limit
    let q;
    if (userId) {
      q = query(
        recipesRef,
        where("userId", "==", userId),
        orderBy("order"),
        limit(limitCount),
      );

      // If we have a last document, start after it for pagination
      if (lastDoc) {
        q = query(
          recipesRef,
          where("userId", "==", userId),
          orderBy("order"),
          startAfter(lastDoc),
          limit(limitCount),
        );
      }
    } else {
      q = query(recipesRef, orderBy("order"), limit(limitCount));

      if (lastDoc) {
        q = query(
          recipesRef,
          orderBy("order"),
          startAfter(lastDoc),
          limit(limitCount),
        );
      }
    }

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (indexError) {
      console.warn(
        "⚠️ fetchRecipes index query failed, falling back to simple query:",
        indexError.message,
      );
      // Fallback: query without orderBy (no composite index needed)
      if (userId) {
        q = query(recipesRef, where("userId", "==", userId), limit(limitCount));
      } else {
        q = query(recipesRef, limit(limitCount));
      }
      querySnapshot = await getDocs(q);
    }

    const recipes = [];
    querySnapshot.forEach((doc) => {
      recipes.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort client-side if we used fallback
    recipes.sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log(
      "📥 fetchRecipes result - found:",
      recipes.length,
      "recipes for userId:",
      userId,
    );
    if (recipes.length > 0) {
      console.log(
        "📥 First recipe:",
        recipes[0].name,
        "userId:",
        recipes[0].userId,
      );
    }

    // Get the last document for pagination
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = querySnapshot.docs.length === limitCount;

    return { recipes, lastVisible, hasMore };
  } catch (error) {
    console.error("❌ Error fetching recipes:", error);
    console.error("❌ Error details:", error.message);
    return { recipes: [], lastVisible: null, hasMore: false };
  }
};

export const addRecipe = async (recipe, userId) => {
  try {
    console.log("💾 FIREBASE - Received recipe:", recipe.name);
    console.log("💾 FIREBASE - Recipe rating:", recipe.rating);
    console.log("💾 FIREBASE - Full recipe object:", recipe);
    console.log("💾 FIREBASE - User ID:", userId);

    const recipesRef = collection(db, RECIPES_COLLECTION);

    // Get current recipe count for this user to set order
    const userRecipesQuery = userId
      ? query(recipesRef, where("userId", "==", userId))
      : recipesRef;
    const querySnapshot = await getDocs(userRecipesQuery);
    const order = querySnapshot.size;

    const recipeData = {
      ...recipe,
      userId,
      order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("💾 FIREBASE - Saving to Firebase:", recipeData);
    console.log("💾 FIREBASE - Rating in saved data:", recipeData.rating);

    const docRef = await addDoc(recipesRef, recipeData);

    const returnedRecipe = {
      id: docRef.id,
      ...recipe,
      order,
    };

    console.log("💾 FIREBASE - Returned recipe rating:", returnedRecipe.rating);

    return returnedRecipe;
  } catch (error) {
    console.error("Error adding recipe:", error);
    throw error;
  }
};

export const updateRecipe = async (recipeId, updatedData) => {
  try {
    console.log("💾 FIREBASE UPDATE - Recipe ID:", recipeId);
    console.log("💾 FIREBASE UPDATE - Updated data:", updatedData);
    console.log("💾 FIREBASE UPDATE - Rating in data:", updatedData.rating);
    console.log(
      "💾 FIREBASE UPDATE - image_src length:",
      updatedData.image_src?.length,
    );
    console.log(
      "💾 FIREBASE UPDATE - image_src type:",
      typeof updatedData.image_src,
    );

    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);
    const raw = {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    // Remove undefined values — Firestore updateDoc throws on them
    const dataToSave = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined),
    );

    await updateDoc(recipeRef, dataToSave);

    console.log("💾 FIREBASE UPDATE - Successfully saved to Firebase");

    return {
      id: recipeId,
      ...updatedData,
    };
  } catch (error) {
    console.error("💾 FIREBASE UPDATE - Error updating recipe:", error);
    throw error;
  }
};

export const deleteRecipe = async (recipeId) => {
  console.log("🔥 Firebase deleteRecipe called with ID:", recipeId);
  try {
    const recipeRef = doc(db, RECIPES_COLLECTION, recipeId);
    console.log("🔥 Recipe reference path:", recipeRef.path);

    // Check if document exists before deletion
    const beforeSnapshot = await getDoc(recipeRef);
    console.log("🔥 Document exists before delete:", beforeSnapshot.exists());

    if (!beforeSnapshot.exists()) {
      console.log("🔥 Document doesn't exist, nothing to delete");
      return true;
    }

    // Use writeBatch instead of deleteDoc
    console.log("🔥 Creating batch delete operation...");
    const batch = writeBatch(db);
    batch.delete(recipeRef);

    console.log("🔥 Committing batch...");
    await batch.commit();
    console.log("🔥 Batch committed successfully");

    // Verify deletion
    const afterSnapshot = await getDoc(recipeRef);
    console.log("🔥 Document exists after delete:", afterSnapshot.exists());

    if (afterSnapshot.exists()) {
      console.error("🔥 ERROR: Document still exists after batch delete!");
      throw new Error("Document was not deleted from Firebase");
    } else {
      console.log("🔥 SUCCESS: Document was deleted from Firebase");
    }

    return true;
  } catch (error) {
    console.error("🔥 Firebase delete error:", error);
    console.error("🔥 Error message:", error.message);
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
    const deletePromises = [];

    querySnapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, RECIPES_COLLECTION, document.id)));
    });

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error("Error deleting recipes by category:", error);
    throw error;
  }
};

export const copyRecipeToUser = async (recipe, targetUserId, targetLang) => {
  try {
    const recipesRef = collection(db, RECIPES_COLLECTION);

    // Get current recipe count for target user to set order
    const userRecipesQuery = query(
      recipesRef,
      where("userId", "==", targetUserId),
    );
    const querySnapshot = await getDocs(userRecipesQuery);
    const order = querySnapshot.size;

    // Strip the original id and userId, create a fresh copy
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
      order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(recipesRef, copiedRecipe);
    console.log(
      "📋 Recipe copied to user:",
      targetUserId,
      "new ID:",
      docRef.id,
    );

    return { id: docRef.id, ...copiedRecipe };
  } catch (error) {
    console.error("Error copying recipe to user:", error);
    throw error;
  }
};

export const fetchRecipesByCategory = async (categoryId) => {
  try {
    const recipesRef = collection(db, RECIPES_COLLECTION);

    if (categoryId === "all") {
      return await fetchRecipes();
    }

    const q = query(
      recipesRef,
      where("categories", "array-contains", categoryId),
      orderBy("name"),
    );

    const querySnapshot = await getDocs(q);
    const recipes = [];

    querySnapshot.forEach((doc) => {
      recipes.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return recipes;
  } catch (error) {
    console.error("Error fetching recipes by category:", error);
    return [];
  }
};
