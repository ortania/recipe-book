import { initializeCategories } from "../firebase/categoryService";

export const migrateLocalStorageCategoriesToFirebase = async () => {
  try {
    console.log("🔄 Starting migration from LocalStorage to Firebase...");
    
    const storedCategories = localStorage.getItem("recipeCategories");
    
    if (!storedCategories) {
      console.log("❌ No categories found in LocalStorage");
      return { success: false, message: "No categories in LocalStorage" };
    }

    const categories = JSON.parse(storedCategories);
    console.log(`📦 Found ${categories.length} categories in LocalStorage:`, categories);

    await initializeCategories(categories);
    console.log("✅ Categories successfully migrated to Firebase!");

    console.log("🗑️ Removing categories from LocalStorage...");
    localStorage.removeItem("recipeCategories");
    
    return { 
      success: true, 
      message: `Successfully migrated ${categories.length} categories to Firebase`,
      categories 
    };
  } catch (error) {
    console.error("❌ Error migrating categories:", error);
    return { 
      success: false, 
      message: error.message,
      error 
    };
  }
};

export const checkLocalStorageCategories = () => {
  const storedCategories = localStorage.getItem("recipeCategories");
  if (storedCategories) {
    const categories = JSON.parse(storedCategories);
    console.log("📋 Categories in LocalStorage:", categories);
    return categories;
  }
  console.log("❌ No categories in LocalStorage");
  return null;
};
