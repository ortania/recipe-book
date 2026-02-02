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
import {
  fetchCategories,
  initializeCategories,
  addCategory as addCategoryToFirestore,
  updateCategory as updateCategoryInFirestore,
  deleteCategory as deleteCategoryFromFirestore,
  reorderCategories as reorderCategoriesInFirestore,
} from "../firebase/categoryService";
import { updateRecipe as updateRecipeInFirebase } from "../firebase/recipeService";

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
  const [isLoading, setIsLoading] = useState(false);
  const [recipesLoaded, setRecipesLoaded] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // Load categories from Firestore on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log("🔄 Loading categories from Firebase...");
        let categoriesFromFirestore = await fetchCategories();

        // If no categories exist, initialize with default ones
        if (categoriesFromFirestore.length === 0) {
          console.log("📦 No categories found, initializing...");
          await initializeCategories(initialCategories);
          categoriesFromFirestore = await fetchCategories();
        }

        console.log("✅ Loaded categories:", categoriesFromFirestore);
        setCategories(categoriesFromFirestore);
        setCategoriesLoaded(true);
      } catch (error) {
        console.error("Error loading categories from Firestore:", error);
        setCategories(initialCategories);
        setCategoriesLoaded(true);
      }
    };
    loadCategories();
  }, []);

  // Category handlers using Firestore
  const addCategory = async (category) => {
    try {
      const newCategory = await addCategoryToFirestore(category);
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

      // Remove the deleted category from all recipes
      setRecipes((prev) =>
        prev.map((recipe) => {
          if (recipe.categories && recipe.categories.includes(categoryId)) {
            const updatedCategories = recipe.categories.filter(
              (catId) => catId !== categoryId,
            );
            // Update recipe in Firebase
            updateRecipeInFirebase(recipe.id, {
              categories: updatedCategories,
            }).catch((error) =>
              console.error("Error updating recipe categories:", error),
            );
            return { ...recipe, categories: updatedCategories };
          }
          return recipe;
        }),
      );

      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  };
  const addRecipe = handleAddRecipe(setRecipes);
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

      // Update order field for all recipes and persist to Firebase
      newRecipes.forEach(async (recipe, index) => {
        if (recipe.order !== index) {
          try {
            console.log("💾 Updating order for:", recipe.name, "to", index);
            const { updateRecipe } = await import("../firebase/recipeService");
            await updateRecipe(recipe.id, { order: index });
          } catch (error) {
            console.error("Error updating recipe order:", error);
          }
        }
      });

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

  const login = async (adminStatus) => {
    try {
      setIsLoading(true);
      const fetchedRecipes = await fetchRecipes(50);
      setRecipes(fetchedRecipes);
      setIsAdmin(adminStatus);
      setIsLoggedIn(true);
      setRecipesLoaded(true);
    } catch (error) {
      console.error("Error loading recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAdmin(false);
    setIsLoggedIn(false);
    setRecipes([]);
    setRecipesLoaded(false);
  };

  const value = {
    categories,
    recipes,
    isAdmin,
    isLoggedIn,
    isLoading,
    recipesLoaded,
    categoriesLoaded,
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
