import { createContext, useContext, useState, useEffect } from "react";
import { categories as initialCategories } from "../app/data/data";
import {
  fetchRecipes,
  transformRecipe,
  handleAddRecipe,
  handleEditRecipe,
  handleDeleteRecipe,
  handleClearAllRecipes,
  handleClearCategoryRecipes,
} from "../app/utils";
import { RECIPES_PER_PAGE } from "../firebase/recipeService";
import {
  fetchCategories,
  initializeCategories,
  addCategory as addCategoryToFirestore,
  updateCategory as updateCategoryInFirestore,
  deleteCategory as deleteCategoryFromFirestore,
  reorderCategories as reorderCategoriesInFirestore,
} from "../firebase/categoryService";
import { updateRecipe as updateRecipeInFirebase } from "../firebase/recipeService";
import {
  onAuthStateChange,
  getUserData,
  logoutUser,
} from "../firebase/authService";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase/config";

const RecipeBookContext = createContext();

export const useRecipeBook = () => {
  const context = useContext(RecipeBookContext);
  if (!context) {
    throw new Error("useRecipeBook must be used within a RecipeBookProvider");
  }
  return context;
};

export const RecipeBookProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recipesLoaded, setRecipesLoaded] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [lastRecipeDoc, setLastRecipeDoc] = useState(null);
  const [hasMoreRecipes, setHasMoreRecipes] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        console.log("✅ User authenticated:", user.uid);
        const userData = await getUserData(user.uid);
        setCurrentUser({ uid: user.uid, ...userData });
        setIsAdmin(userData?.isAdmin || false);
        setIsLoggedIn(true);

        // Load user's data
        await loadUserData(user.uid);
      } else {
        console.log("❌ No user authenticated");
        setCurrentUser(null);
        setIsAdmin(false);
        setIsLoggedIn(false);
        setRecipes([]);
        setCategories([]);
        setRecipesLoaded(false);
        setCategoriesLoaded(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user's categories and recipes
  const loadUserData = async (userId) => {
    try {
      console.log("🔄 Loading user data for:", userId);

      // Load categories
      let categoriesFromFirestore = await fetchCategories(userId);
      if (categoriesFromFirestore.length === 0) {
        console.log("📦 No categories found, initializing...");
        categoriesFromFirestore = await initializeCategories(
          initialCategories,
          userId,
        );
      }
      setCategories(categoriesFromFirestore);
      setCategoriesLoaded(true);

      // Load recipes with pagination
      const {
        recipes: fetchedRecipes,
        lastVisible,
        hasMore,
      } = await fetchRecipes(RECIPES_PER_PAGE, userId);
      setRecipes(fetchedRecipes);
      setLastRecipeDoc(lastVisible);
      setHasMoreRecipes(hasMore);
      setRecipesLoaded(true);

      console.log("✅ User data loaded");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Category handlers using Firestore
  const addCategory = async (category) => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      const newCategory = await addCategoryToFirestore(
        category,
        currentUser.uid,
      );
      setCategories((prev) => [...prev, newCategory]);
      return newCategory;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  };

  const editCategory = async (editedCategory) => {
    try {
      const { id, ...updatedData } = editedCategory;
      const updatedCategory = await updateCategoryInFirestore(id, updatedData);
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? editedCategory : cat)),
      );
      return updatedCategory;
    } catch (error) {
      console.error("Error editing category:", error);
      throw error;
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      await deleteCategoryFromFirestore(categoryId);
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));

      // Remove the deleted category from all recipes using batch write
      setRecipes((prev) => {
        const batch = writeBatch(db);
        let hasUpdates = false;

        const updatedRecipes = prev.map((recipe) => {
          if (recipe.categories && recipe.categories.includes(categoryId)) {
            const updatedCategories = recipe.categories.filter(
              (catId) => catId !== categoryId,
            );

            // Add to batch
            const recipeRef = doc(db, "recipes", recipe.id);
            batch.update(recipeRef, { categories: updatedCategories });
            hasUpdates = true;

            return { ...recipe, categories: updatedCategories };
          }
          return recipe;
        });

        // Commit batch if there are updates
        if (hasUpdates) {
          batch
            .commit()
            .then(() =>
              console.log("✅ Recipe categories batch update successful"),
            )
            .catch((error) =>
              console.error("Error updating recipe categories:", error),
            );
        }

        return updatedRecipes;
      });

      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  };

  // Recipe handlers
  const addRecipe = async (newRecipe) => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      console.log("🔥 CONTEXT - Adding recipe to Firebase:", newRecipe.name);
      const addedRecipe = await handleAddRecipe(
        setRecipes,
        currentUser.uid,
      )(newRecipe);
      return addedRecipe;
    } catch (error) {
      console.error("Error adding recipe:", error);
      throw error;
    }
  };
  const editRecipe = handleEditRecipe(setRecipes);
  const deleteRecipe = handleDeleteRecipe(setRecipes);
  const clearAllRecipes = handleClearAllRecipes(setRecipes);
  const clearCategoryRecipes = handleClearCategoryRecipes(setRecipes);

  const reorderRecipes = async (fromIndex, toIndex) => {
    console.log("🔄 reorderRecipes called:", { fromIndex, toIndex });
    setRecipes((prevRecipes) => {
      console.log("📋 Current recipes count:", prevRecipes.length);
      const newRecipes = [...prevRecipes];
      const [movedRecipe] = newRecipes.splice(fromIndex, 1);
      console.log("📦 Moving recipe:", movedRecipe?.name);
      newRecipes.splice(toIndex, 0, movedRecipe);

      // Use batch write for all recipe order updates
      const batch = writeBatch(db);
      let hasUpdates = false;

      newRecipes.forEach((recipe, index) => {
        if (recipe.order !== index) {
          console.log(
            "💾 Batching order update for:",
            recipe.name,
            "to",
            index,
          );
          const recipeRef = doc(db, "recipes", recipe.id);
          batch.update(recipeRef, { order: index });
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        batch
          .commit()
          .then(() => console.log("✅ Recipe order batch update successful"))
          .catch((error) =>
            console.error("Error updating recipe order:", error),
          );
      }

      return newRecipes;
    });
  };

  const reorderCategories = async (fromIndex, toIndex) => {
    try {
      const newCategories = [...categories];
      const [movedCategory] = newCategories.splice(fromIndex, 1);
      newCategories.splice(toIndex, 0, movedCategory);

      // Update state immediately for responsive UI
      setCategories(newCategories);

      // Save to Firebase
      await reorderCategoriesInFirestore(newCategories);
      console.log("✅ Category order saved to Firebase");
    } catch (error) {
      console.error("Error reordering categories:", error);
      // Revert to original order on error
      setCategories(categories);
    }
  };

  const login = async (userId) => {
    try {
      setIsLoading(true);
      const userData = await getUserData(userId);
      setCurrentUser({ uid: userId, ...userData });
      setIsAdmin(userData?.isAdmin || false);
      setIsLoggedIn(true);
      await loadUserData(userId);
    } catch (error) {
      console.error("Error during login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreRecipes = async () => {
    if (!hasMoreRecipes || !currentUser) return;

    try {
      console.log("📥 Loading more recipes...");
      const {
        recipes: moreRecipes,
        lastVisible,
        hasMore,
      } = await fetchRecipes(RECIPES_PER_PAGE, currentUser.uid, lastRecipeDoc);

      console.log(
        "🔍 More recipes IDs:",
        moreRecipes.map((r) => r.id),
      );

      setRecipes((prev) => {
        console.log("🔍 Current recipe count:", prev.length);
        console.log(
          "🔍 Current recipe IDs:",
          prev.map((r) => r.id),
        );

        // Filter out any duplicates
        const existingIds = new Set(prev.map((r) => r.id));
        const newRecipes = moreRecipes.filter((r) => !existingIds.has(r.id));

        console.log("🔍 New unique recipes:", newRecipes.length);
        const result = [...prev, ...newRecipes];
        console.log("🔍 Total after merge:", result.length);

        return result;
      });

      setLastRecipeDoc(lastVisible);
      setHasMoreRecipes(hasMore);
      console.log("✅ Loaded", moreRecipes.length, "more recipes");
    } catch (error) {
      console.error("Error loading more recipes:", error);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setIsAdmin(false);
      setIsLoggedIn(false);
      setRecipes([]);
      setCategories([]);
      setRecipesLoaded(false);
      setCategoriesLoaded(false);
      setLastRecipeDoc(null);
      setHasMoreRecipes(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const value = {
    categories,
    recipes,
    isAdmin,
    isLoggedIn,
    isLoading,
    recipesLoaded,
    categoriesLoaded,
    currentUser,
    hasMoreRecipes,
    setRecipes,
    setRecipesLoaded,
    addCategory,
    editCategory,
    deleteCategory,
    addRecipe,
    editRecipe,
    deleteRecipe,
    clearAllRecipes,
    clearCategoryRecipes,
    reorderRecipes,
    reorderCategories,
    loadMoreRecipes,
    login,
    logout,
  };

  return (
    <RecipeBookContext.Provider value={value}>
      {children}
    </RecipeBookContext.Provider>
  );
};

export default RecipeBookContext;
