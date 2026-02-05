import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./config";

/**
 * Migrate existing recipes and categories to a specific user
 * Run this once to add userId to all existing data
 */
export const migrateDataToUser = async (userId) => {
  try {
    console.log("🔄 Starting data migration for user:", userId);

    // Migrate recipes
    const recipesRef = collection(db, "recipes");
    const recipesSnapshot = await getDocs(recipesRef);
    
    let recipesUpdated = 0;
    for (const recipeDoc of recipesSnapshot.docs) {
      const recipeData = recipeDoc.data();
      
      // Only update if userId doesn't exist
      if (!recipeData.userId) {
        await updateDoc(doc(db, "recipes", recipeDoc.id), {
          userId: userId,
        });
        recipesUpdated++;
        console.log(`✅ Updated recipe: ${recipeData.name}`);
      }
    }

    // Migrate categories
    const categoriesRef = collection(db, "categories");
    const categoriesSnapshot = await getDocs(categoriesRef);
    
    let categoriesUpdated = 0;
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data();
      
      // Only update if userId doesn't exist
      if (!categoryData.userId) {
        await updateDoc(doc(db, "categories", categoryDoc.id), {
          userId: userId,
        });
        categoriesUpdated++;
        console.log(`✅ Updated category: ${categoryData.name}`);
      }
    }

    console.log("🎉 Migration complete!");
    console.log(`📊 Updated ${recipesUpdated} recipes`);
    console.log(`📊 Updated ${categoriesUpdated} categories`);
    
    return {
      recipesUpdated,
      categoriesUpdated,
    };
  } catch (error) {
    console.error("❌ Error migrating data:", error);
    throw error;
  }
};
