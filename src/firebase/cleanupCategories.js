import { getDocs, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "./config";

const CATEGORIES_COLLECTION = "categories";

/**
 * Remove duplicate categories from Firebase, keeping only one of each unique ID
 */
export const removeDuplicateCategories = async () => {
  try {
    console.log("🔄 Checking for duplicate categories...");
    
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const querySnapshot = await getDocs(categoriesRef);
    
    const categoriesMap = new Map();
    const duplicates = [];
    
    // Identify duplicates
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const categoryId = data.id;
      
      if (categoriesMap.has(categoryId)) {
        // This is a duplicate - mark for deletion
        duplicates.push({
          docId: docSnapshot.id,
          categoryId: categoryId,
          name: data.name
        });
        console.log(`🔍 Found duplicate: ${data.name} (${categoryId})`);
      } else {
        // First occurrence - keep it
        categoriesMap.set(categoryId, {
          docId: docSnapshot.id,
          data: data
        });
      }
    });
    
    if (duplicates.length === 0) {
      console.log("✅ No duplicates found!");
      return {
        success: true,
        message: "No duplicates found",
        removed: 0,
        kept: categoriesMap.size
      };
    }
    
    console.log(`🗑️ Removing ${duplicates.length} duplicate categories...`);
    
    // Delete duplicates
    const deletePromises = duplicates.map(dup => 
      deleteDoc(doc(db, CATEGORIES_COLLECTION, dup.docId))
    );
    
    await Promise.all(deletePromises);
    
    console.log(`✅ Removed ${duplicates.length} duplicates, kept ${categoriesMap.size} unique categories`);
    
    return {
      success: true,
      message: `Removed ${duplicates.length} duplicates, kept ${categoriesMap.size} unique categories`,
      removed: duplicates.length,
      kept: categoriesMap.size,
      duplicates: duplicates
    };
    
  } catch (error) {
    console.error("❌ Error removing duplicates:", error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
};
