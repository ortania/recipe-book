import { createContext, useContext, useState, useEffect } from "react";
import {
  transformRecipe,
  handleAddRecipe,
  handleEditRecipe,
  handleDeleteRecipe,
  handleClearAllRecipes,
  handleClearCategoryRecipes,
} from "../app/utils";
import { fetchRecipes, RECIPES_PER_PAGE } from "../firebase/recipeService";
import {
  fetchCategories,
  addCategory as addCategoryToFirestore,
  updateCategory as updateCategoryInFirestore,
  deleteCategory as deleteCategoryFromFirestore,
  reorderCategories as reorderCategoriesInFirestore,
} from "../firebase/categoryService";
import {
  updateRecipe as updateRecipeInFirebase,
  copyRecipeToUser as copyRecipeToUserInDB,
} from "../firebase/recipeService";
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
  const [selectedCategories, setSelectedCategories] = useState(["all"]);

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      if (categoryId === "all") return ["all"];
      const withoutAll = prev.filter((id) => id !== "all");
      if (withoutAll.includes(categoryId)) {
        const result = withoutAll.filter((id) => id !== categoryId);
        return result.length === 0 ? ["all"] : result;
      }
      return [...withoutAll, categoryId];
    });
  };

  const selectCategory = (categoryId) => {
    setSelectedCategories([categoryId]);
  };

  const clearCategorySelection = () => {
    setSelectedCategories(["all"]);
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        setIsLoading(true);
        let userData = await getUserData(user.uid);
        if (!userData) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          userData = await getUserData(user.uid);
        }
        setCurrentUser({ uid: user.uid, ...userData });
        setIsAdmin(true);

        // Load user's data BEFORE setting isLoggedIn
        // so the redirect to /categories happens only after data is ready
        await loadUserData(user.uid);
        setIsLoggedIn(true);
      } else {
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
      let categoriesFromFirestore = await fetchCategories(userId);

      const allCategory = {
        id: "all",
        name: "All",
        description: "All recipes in the recipe book",
        color: "#607D8B",
      };
      const otherCategory = {
        id: "general",
        name: "General",
        description: "Uncategorized recipes",
        color: "#9E9E9E",
      };
      const hasAll = categoriesFromFirestore.some((c) => c.id === "all");
      const withAll = hasAll
        ? categoriesFromFirestore
        : [allCategory, ...categoriesFromFirestore];
      const finalCategories = [...withAll, otherCategory];
      setCategories(finalCategories);
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
      setCategories((prev) => {
        const otherIndex = prev.findIndex((c) => c.id === "general");
        if (otherIndex !== -1) {
          const updated = [...prev];
          updated.splice(otherIndex, 0, newCategory);
          return updated;
        }
        return [...prev, newCategory];
      });
      return newCategory;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  };

  const editCategory = async (editedCategory) => {
    try {
      const { id, ...updatedData } = editedCategory;
      // Use docId for Firestore operations if available
      const firestoreId = editedCategory.docId || id;
      const updatedCategory = await updateCategoryInFirestore(
        firestoreId,
        updatedData,
      );
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...editedCategory, docId: cat.docId } : cat,
        ),
      );
      return updatedCategory;
    } catch (error) {
      console.error("Error editing category:", error);
      throw error;
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      // Find the docId for this category
      const categoryToDelete = categories.find((cat) => cat.id === categoryId);
      const docId = categoryToDelete?.docId || categoryId;
      await deleteCategoryFromFirestore(categoryId, docId);
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

  const clearAllRecipes = async () => {
    if (!currentUser) throw new Error("No user logged in");
    return handleClearAllRecipes(setRecipes, currentUser.uid)();
  };

  const clearCategoryRecipes = async (categoryId) => {
    if (!currentUser) throw new Error("No user logged in");
    return handleClearCategoryRecipes(setRecipes, currentUser.uid)(categoryId);
  };

  const reorderRecipes = async (fromIndex, toIndex) => {
    setRecipes((prevRecipes) => {
      const newRecipes = [...prevRecipes];
      const [movedRecipe] = newRecipes.splice(fromIndex, 1);
      newRecipes.splice(toIndex, 0, movedRecipe);

      // Use batch write for all recipe order updates
      const batch = writeBatch(db);
      let hasUpdates = false;

      newRecipes.forEach((recipe, index) => {
        if (recipe.order !== index) {
          const recipeRef = doc(db, "recipes", recipe.id);
          batch.update(recipeRef, { order: index });
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        batch
          .commit()
          .catch((error) =>
            console.error("Error updating recipe order:", error),
          );
      }

      return newRecipes;
    });
  };

  const reorderCategories = async (fromIndex, toIndex) => {
    try {
      // Indices come from editableCategories (without "All").
      // Offset by 1 if "All" is the first item in the full categories array.
      const offset =
        categories.length > 0 && categories[0].id === "all" ? 1 : 0;
      const adjustedFrom = fromIndex + offset;
      const adjustedTo = toIndex + offset;

      const newCategories = [...categories];
      const [movedCategory] = newCategories.splice(adjustedFrom, 1);
      newCategories.splice(adjustedTo, 0, movedCategory);

      // Update state immediately for responsive UI
      setCategories(newCategories);

      // Save to Firebase - filter out the virtual "All" and "General" categories
      const categoriesToSave = newCategories.filter(
        (c) => c.id !== "all" && c.id !== "general",
      );
      await reorderCategoriesInFirestore(categoriesToSave);
    } catch (error) {
      console.error("Error reordering categories:", error);
      // Revert to original order on error
      setCategories(categories);
    }
  };

  const sortCategoriesAlphabetically = async (getTranslatedName) => {
    try {
      // Separate fixed categories (all, general) from user categories
      const fixed = categories.filter(
        (c) => c.id === "all" || c.id === "general",
      );
      const userCats = categories.filter(
        (c) => c.id !== "all" && c.id !== "general",
      );
      const sorted = [...userCats].sort((a, b) => {
        const nameA = (getTranslatedName(a) || "").toLowerCase();
        const nameB = (getTranslatedName(b) || "").toLowerCase();
        return nameA.localeCompare(nameB, "he");
      });
      const newCategories = [...fixed, ...sorted];
      setCategories(newCategories);
      await reorderCategoriesInFirestore(sorted);
    } catch (error) {
      console.error("Error sorting categories:", error);
      setCategories(categories);
    }
  };

  const login = async () => {
    // onAuthStateChange handles loading user data and setting isLoggedIn.
    // This function just ensures we wait for that to complete.
  };

  const loadMoreRecipes = async () => {
    if (!hasMoreRecipes || !currentUser) return;

    try {
      const {
        recipes: moreRecipes,
        lastVisible,
        hasMore,
      } = await fetchRecipes(RECIPES_PER_PAGE, currentUser.uid, lastRecipeDoc);

      setRecipes((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newRecipes = moreRecipes.filter((r) => !existingIds.has(r.id));
        return [...prev, ...newRecipes];
      });

      setLastRecipeDoc(lastVisible);
      setHasMoreRecipes(hasMore);
    } catch (error) {
      console.error("Error loading more recipes:", error);
    }
  };

  const copyRecipeToUser = async (recipe, targetUserId, targetLang) => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      const copiedRecipe = await copyRecipeToUserInDB(
        recipe,
        targetUserId,
        targetLang,
      );
      return copiedRecipe;
    } catch (error) {
      console.error("Error copying recipe:", error);
      throw error;
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
    selectedCategories,
    toggleCategory,
    selectCategory,
    clearCategorySelection,
    setSelectedCategories,
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
    sortCategoriesAlphabetically,
    loadMoreRecipes,
    copyRecipeToUser,
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
