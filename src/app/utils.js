import {
  fetchRecipes as fetchRecipesFromDB,
  addRecipe as addRecipeToDB,
  updateRecipe as updateRecipeInDB,
  deleteRecipe as deleteRecipeFromDB,
  deleteRecipesByCategory as deleteRecipesByCategoryFromDB,
} from "../firebase/recipeService";

/**
 * Fetches recipes from Firebase database
 * @param {number} limit - Number of recipes to fetch (default: 50)
 * @returns {Promise<Array>} - Promise resolving to an array of recipe objects
 */
export const fetchRecipes = async (limit = 50) => {
  return await fetchRecipesFromDB(limit);
};

/**
 * Selects random categories from available categories
 * @param {Array} availableCategories - Array of category objects to choose from
 * @param {number} maxCategories - Maximum number of categories to select (default: 2)
 * @returns {Array} - Array of selected category IDs
 */
const getRandomCategories = (availableCategories, maxCategories = 2) => {
  const shuffled = [...availableCategories]
    .filter((category) => category.id !== "all") // Exclude 'all' category
    .sort(() => 0.5 - Math.random());

  const numCategories = Math.floor(Math.random() * maxCategories) + 1; // 1 or 2 categories
  return shuffled.slice(0, numCategories).map((c) => c.id);
};

/**
 * Transforms a recipe object from DummyJSON API into the application's recipe format
 * @param {Object} recipe - Recipe object from the API
 * @param {Array} availableCategories - Array of available categories to assign
 * @returns {Object} - Transformed recipe object with application-specific properties
 */
export const transformRecipe = (recipe, availableCategories) => {
  const categoryMap = {
    Pizza: "main",
    Italian: "main",
    Dessert: "desserts",
    Snack: "appetizers",
    Salad: "salads",
    Asian: "main",
    Pakistani: "main",
  };

  const categories =
    recipe.tags?.map((tag) => categoryMap[tag]).filter(Boolean) || [];

  return {
    id: recipe.id.toString(),
    name: recipe.name,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    image_src: recipe.image,
    prepTime: `${recipe.prepTimeMinutes} min`,
    cookTime: `${recipe.cookTimeMinutes} min`,
    servings: recipe.servings,
    categories:
      categories.length > 0
        ? categories
        : getRandomCategories(availableCategories),
    cuisine: recipe.cuisine,
    difficulty: recipe.difficulty,
    isFavorite: false,
  };
};

// Handler functions

/**
 * Creates a handler function for adding a new recipe
 * @param {Function} setRecipes - React state setter for recipes
 * @param {string} userId - User ID to associate with the recipe
 * @returns {Function} - Handler function that takes a new recipe and adds it to Firebase and state
 */
export const handleAddRecipe = (setRecipes, userId) => async (newRecipe) => {
  try {
    console.log("🔥 UTILS - Adding recipe to Firebase:", newRecipe.name);
    console.log("🔥 UTILS - Recipe rating:", newRecipe.rating);
    console.log("🔥 UTILS - User ID:", userId);
    console.log("🔥 UTILS - Full recipe object:", newRecipe);
    const addedRecipe = await addRecipeToDB(newRecipe, userId);
    console.log("🔥 UTILS - Recipe added to Firebase with ID:", addedRecipe.id);
    console.log("🔥 UTILS - Added recipe rating:", addedRecipe.rating);
    setRecipes((prev) => [...prev, addedRecipe]);
    return addedRecipe;
  } catch (error) {
    console.error("Error adding recipe to Firebase:", error);
    throw error;
  }
};

/**
 * Creates a handler function for editing an existing recipe
 * @param {Function} setRecipes - React state setter for recipes
 * @returns {Function} - Handler function that takes an edited recipe and updates it in Firebase and state
 */
export const handleEditRecipe = (setRecipes) => async (editedRecipe) => {
  try {
    console.log(
      "✏️ EDIT UTILS - Editing recipe:",
      editedRecipe.name,
      "ID:",
      editedRecipe.id,
    );
    console.log("✏️ EDIT UTILS - Recipe rating:", editedRecipe.rating);
    console.log(
      "✏️ EDIT UTILS - image_src length:",
      editedRecipe.image_src?.length,
    );
    console.log("✏️ EDIT UTILS - Full edited recipe:", editedRecipe);
    const { id, ...recipeData } = editedRecipe;
    console.log(
      "✏️ EDIT UTILS - Data being sent to Firebase (without id):",
      recipeData,
    );
    console.log("✏️ EDIT UTILS - Rating in data:", recipeData.rating);
    await updateRecipeInDB(id, recipeData);
    console.log("✏️ EDIT UTILS - Recipe updated in Firebase successfully");
    console.log("✏️ EDIT UTILS - Nutrition being set:", editedRecipe.nutrition);
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === editedRecipe.id ? { ...editedRecipe } : recipe,
      ),
    );
  } catch (error) {
    console.error("Error editing recipe in Firebase:", error);
    throw error;
  }
};

/**
 * Creates a handler function for deleting a recipe
 * @param {Function} setRecipes - React state setter for recipes
 * @returns {Function} - Handler function that takes a recipe ID and removes it from Firebase and state
 */
export const handleDeleteRecipe = (setRecipes) => async (recipeId) => {
  try {
    console.log("Deleting recipe from Firebase:", recipeId);
    await deleteRecipeFromDB(recipeId);
    console.log("Recipe deleted from Firebase successfully");
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
  } catch (error) {
    console.error("Error deleting recipe from Firebase:", error);
    throw error;
  }
};

/**
 * Creates a handler function for clearing all recipes
 * @param {Function} setRecipes - React state setter for recipes
 * @returns {Function} - Handler function that clears all recipes from Firebase and state
 */
export const handleClearAllRecipes = (setRecipes, userId) => async () => {
  try {
    console.log("Clearing all recipes from Firebase for user:", userId);
    await deleteRecipesByCategoryFromDB("all", userId);
    console.log("All recipes cleared from Firebase");
    setRecipes([]);
  } catch (error) {
    console.error("Error clearing all recipes from Firebase:", error);
    throw error;
  }
};

/**
 * Creates a handler function for user logout
 * @param {Function} setIsAdmin - React state setter for admin status
 * @param {Function} setIsLoggedIn - React state setter for login status
 * @param {Function} setRecipes - React state setter for recipes
 * @param {Function} setRecipesLoaded - React state setter for recipes loaded status
 * @returns {Function} - Handler function that resets application state on logout
 */
export const handleLogout =
  (setIsAdmin, setIsLoggedIn, setRecipes, setRecipesLoaded) => () => {
    setIsAdmin(false);
    setIsLoggedIn(false);
    setRecipes([]);
    setRecipesLoaded(false);
  };

/**
 * Creates a handler function to clear all recipes from a specific category
 * @param {Function} setRecipes - React state setter for recipes
 * @returns {Function} - Handler function that removes all recipes from a specific category from Firebase and state
 */
export const handleClearCategoryRecipes =
  (setRecipes, userId) => async (categoryId) => {
    try {
      console.log("Clearing category recipes from Firebase:", categoryId);
      await deleteRecipesByCategoryFromDB(categoryId, userId);
      console.log("Category recipes cleared from Firebase");
      if (categoryId === "all") {
        setRecipes([]);
      } else {
        setRecipes((prev) =>
          prev.filter((recipe) => !recipe.categories.includes(categoryId)),
        );
      }
    } catch (error) {
      console.error("Error clearing category recipes from Firebase:", error);
      throw error;
    }
  };
