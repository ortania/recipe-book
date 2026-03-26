import { createContext, useContext, useState, useEffect, useRef } from "react";
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
  ensureGoogleUserDoc,
} from "../firebase/authService";
import { doc, writeBatch } from "firebase/firestore";
import { db, auth } from "../firebase/config";

const RecipeBookContext = createContext();

export const useRecipeBook = () => {
  const context = useContext(RecipeBookContext);
  if (!context) {
    throw new Error("useRecipeBook must be used within a RecipeBookProvider");
  }
  return context;
};

const readSessionCache = () => {
  try {
    const s = sessionStorage.getItem("appCache");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

// Captured once at module load — survives re-renders
const SESSION_CACHE = readSessionCache(); // { user, recipes, categories } | null

export const RecipeBookProvider = ({ children }) => {
  const hasCache = !!SESSION_CACHE;
  const [categories, setCategories] = useState(SESSION_CACHE?.categories || []);
  const [recipes, setRecipes] = useState(SESSION_CACHE?.recipes || []);
  const [isAdmin, setIsAdmin] = useState(hasCache);
  const [isLoggedIn, setIsLoggedIn] = useState(hasCache);
  // Skip loading screen when we have a cached session — show app immediately
  const [isLoading, setIsLoading] = useState(!hasCache);
  const [recipesLoaded, setRecipesLoaded] = useState(hasCache);
  const [categoriesLoaded, setCategoriesLoaded] = useState(hasCache);
  const [currentUser, setCurrentUser] = useState(SESSION_CACHE?.user || null);
  const [lastRecipeDoc, setLastRecipeDoc] = useState(null);
  const [hasMoreRecipes, setHasMoreRecipes] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const loginResolverRef = useRef(null);
  const initialLoadDone = useRef(false);

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
    let cancelled = false;
    let expiredCacheTimer = null;

    // For users with no cache: show login page within 3s even if Firebase is slow
    const noAuthFallback = !hasCache
      ? setTimeout(() => {
          if (!initialLoadDone.current && !cancelled) setIsLoading(false);
        }, 3000)
      : null;

    const clearCachedSession = () => {
      try { sessionStorage.removeItem("appCache"); } catch {}
      setCurrentUser(null);
      setIsAdmin(false);
      setIsLoggedIn(false);
      setRecipes([]);
      setCategories([]);
      setSelectedCategories(["all"]);
      setRecipesLoaded(false);
      setCategoriesLoaded(false);
      setIsLoading(false);
    };

    const unsubscribe = onAuthStateChange(async (user) => {
      if (cancelled) return;
      if (user) {
        clearTimeout(expiredCacheTimer);
        clearTimeout(noAuthFallback);
        if (initialLoadDone.current) {
          // Token refresh — update user object but skip full reload
          try {
            const userData = await getUserData(user.uid);
            if (userData) {
              const updated = { uid: user.uid, ...userData };
              setCurrentUser(updated);
              // Keep cache fresh
              try {
                const cached = readSessionCache();
                if (cached) sessionStorage.setItem("appCache", JSON.stringify({ ...cached, user: updated }));
              } catch {}
            }
          } catch (err) {
            console.error("Token refresh user data error:", err);
          }
          return;
        }

        // Unblock the UI immediately using the basic Firebase user object.
        // Full Firestore user data and recipes load in the background.
        const basicUser = { uid: user.uid, email: user.email, displayName: user.displayName };
        setCurrentUser(basicUser);
        setIsAdmin(true);
        setIsLoggedIn(true);
        setIsLoading(false);
        // Unblock Login page navigation immediately — no need to wait for data
        if (loginResolverRef.current) {
          loginResolverRef.current();
          loginResolverRef.current = null;
        }
        initialLoadDone.current = true;

        try {
          const [, fetchedUserData] = await Promise.all([
            ensureGoogleUserDoc(user),
            getUserData(user.uid),
          ]);
          let userData = fetchedUserData;
          if (!userData) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            userData = await getUserData(user.uid);
          }
          if (cancelled) return;
          const confirmedUser = { uid: user.uid, ...userData };
          setCurrentUser(confirmedUser);
          await loadUserData(confirmedUser);
        } catch (err) {
          console.error("Auth load error:", err);
        }
      } else {
        if (initialLoadDone.current) {
          // Genuine logout after being logged in
          initialLoadDone.current = false;
          clearCachedSession();
        }
        // else: null on initial load — handled by authStateReady below
      }
    });

    // authStateReady resolves when Firebase knows the definitive initial auth state.
    // — No cache: if no user, unblock immediately (show login page)
    // — Has cache: if no user fires yet, wait briefly for Android null-before-user.
    //   If user fires in time, the clearTimeout above cancels the expiry.
    //   If not, assume the cached session truly expired and clear it.
    auth.authStateReady().then(() => {
      if (cancelled || initialLoadDone.current) return;
      if (hasCache) {
        // Firebase returned null but we had a cached session.
        // Give it 5s for onAuthStateChanged(user) to arrive (Android pattern).
        expiredCacheTimer = setTimeout(() => {
          if (!initialLoadDone.current && !cancelled) clearCachedSession();
        }, 5000);
      } else {
        // No cache — definitely not logged in
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(expiredCacheTimer);
      clearTimeout(noAuthFallback);
      unsubscribe();
    };
  }, []);

  // Load user's categories and recipes
  const loadUserData = async (confirmedUser) => {
    const userId = confirmedUser.uid;
    try {
      const [categoriesFromFirestore, { recipes: fetchedRecipes }] =
        await Promise.all([
          fetchCategories(userId),
          fetchRecipes(RECIPES_PER_PAGE, userId),
        ]);

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

      setRecipes(fetchedRecipes);
      setHasMoreRecipes(false);
      setRecipesLoaded(true);

      // Save full cache for instant display on next refresh
      try {
        sessionStorage.setItem("appCache", JSON.stringify({
          user: confirmedUser,
          recipes: fetchedRecipes,
          categories: finalCategories,
        }));
      } catch {}
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
      const enriched = { ...newRecipe };
      if (enriched.shareToGlobal) {
        enriched.sharerName =
          currentUser.displayName || currentUser.email?.split("@")[0] || "";
        enriched.sharerUserId = currentUser.uid;
      } else {
        enriched.sharerName = "";
        enriched.sharerUserId = "";
      }
      const addedRecipe = await handleAddRecipe(
        setRecipes,
        currentUser.uid,
      )(enriched);
      return addedRecipe;
    } catch (error) {
      console.error("Error adding recipe:", error);
      throw error;
    }
  };
  const _editRecipeBase = handleEditRecipe(setRecipes);
  const editRecipe = async (editedRecipe) => {
    const enriched = { ...editedRecipe };
    if (enriched.shareToGlobal && currentUser) {
      enriched.sharerName =
        currentUser.displayName || currentUser.email?.split("@")[0] || "";
      enriched.sharerUserId = currentUser.uid;
    } else if (!enriched.copiedFrom) {
      enriched.sharerName = "";
      enriched.sharerUserId = "";
    }
    return _editRecipeBase(enriched);
  };
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

  const login = () => {
    return new Promise((resolve) => {
      // initialLoadDone is a ref — always current, no stale closure
      if (isLoggedIn || initialLoadDone.current) {
        resolve();
        return;
      }
      loginResolverRef.current = resolve;
      setTimeout(() => {
        if (loginResolverRef.current === resolve) {
          loginResolverRef.current = null;
          resolve();
        }
      }, 15000);
    });
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
      initialLoadDone.current = false;
      try { sessionStorage.removeItem("appCache"); } catch {}
      await logoutUser();
      setCurrentUser(null);
      setIsAdmin(false);
      setIsLoggedIn(false);
      setRecipes([]);
      setCategories([]);
      setSelectedCategories(["all"]);
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
    setCurrentUser,
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
    isSearchActive,
    setIsSearchActive,
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
