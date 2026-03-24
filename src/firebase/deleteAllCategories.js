import { getDocs, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "./config";

const CATEGORIES_COLLECTION = "categories";

/**
 * Delete ALL categories from Firebase
 */
export const deleteAllCategories = async () => {
  try {
    console.log("🗑️ Deleting ALL categories from Firebase...");
    
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const querySnapshot = await getDocs(categoriesRef);
    
    const deletePromises = [];
    querySnapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, CATEGORIES_COLLECTION, docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    
    console.log(`✅ Deleted ${deletePromises.length} categories from Firebase`);
    
    return {
      success: true,
      message: `Deleted ${deletePromises.length} categories`,
      count: deletePromises.length
    };
    
  } catch (error) {
    console.error("❌ Error deleting categories:", error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
};
