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
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

const RECIPES_COLLECTION = "recipes";

export const fetchRecipes = async (limitCount = 50) => {
  try {
    const recipesRef = collection(db, RECIPES_COLLECTION);
    const querySnapshot = await getDocs(recipesRef);

    const recipes = [];
    querySnapshot.forEach((doc) => {
      recipes.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by order field if it exists, otherwise by name
    recipes.sort((a, b) => {
      if (typeof a.order === "number" && typeof b.order === "number") {
        return a.order - b.order;
      }
      return (a.name || "").localeCompare(b.name || "");
    });

    return recipes.slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
};

export const addRecipe = async (recipe) => {
  try {
    console.log("💾 FIREBASE - Received recipe:", recipe.name);
    console.log("💾 FIREBASE - Recipe rating:", recipe.rating);
    console.log("💾 FIREBASE - Full recipe object:", recipe);

    const recipesRef = collection(db, RECIPES_COLLECTION);

    // Get current recipe count to set order
    const querySnapshot = await getDocs(recipesRef);
    const order = querySnapshot.size;

    const recipeData = {
      ...recipe,
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
    const dataToSave = {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    console.log("💾 FIREBASE UPDATE - Final data to save:", dataToSave);
    console.log(
      "💾 FIREBASE UPDATE - Rating in final data:",
      dataToSave.rating,
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

export const deleteRecipesByCategory = async (categoryId) => {
  try {
    const recipesRef = collection(db, RECIPES_COLLECTION);
    let q;

    if (categoryId === "all") {
      q = query(recipesRef);
    } else {
      q = query(recipesRef, where("categories", "array-contains", categoryId));
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
