import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

const CATEGORIES_COLLECTION = "categories";

/**
 * Fetch all categories from Firestore for a specific user
 */
export const fetchCategories = async (userId = null) => {
  try {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    let q = query(categoriesRef, orderBy("order"));

    if (userId) {
      q = query(categoriesRef, where("userId", "==", userId), orderBy("order"));
    }

    const querySnapshot = await getDocs(q);

    const categories = [];
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

/**
 * Add a new category to Firestore using the provided category ID
 */
export const addCategory = async (category, userId) => {
  try {
    console.log(
      "💾 FIREBASE - Adding category:",
      category.name,
      "with ID:",
      category.id,
    );

    // Get current categories for this user to determine the order
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const userCategoriesQuery = userId
      ? query(categoriesRef, where("userId", "==", userId))
      : categoriesRef;
    const querySnapshot = await getDocs(userCategoriesQuery);
    const currentCount = querySnapshot.size;

    const categoryRef = doc(db, CATEGORIES_COLLECTION, category.id);
    const categoryData = {
      ...category,
      userId,
      order: currentCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(categoryRef, categoryData);
    console.log(
      "✅ Category added to Firebase successfully with order:",
      currentCount,
    );

    return {
      id: category.id,
      ...categoryData,
    };
  } catch (error) {
    console.error("❌ Error adding category:", error);
    throw error;
  }
};

/**
 * Update an existing category in Firestore
 */
export const updateCategory = async (categoryId, updatedData) => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    const dataToSave = {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(categoryRef, dataToSave);

    return {
      id: categoryId,
      ...updatedData,
    };
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

/**
 * Delete a category from Firestore
 */
export const deleteCategory = async (categoryId) => {
  console.log("🔥 Firebase deleteCategory called with ID:", categoryId);
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    console.log("🔥 Category reference path:", categoryRef.path);

    const beforeSnapshot = await getDoc(categoryRef);
    console.log("🔥 Document exists before delete:", beforeSnapshot.exists());

    if (!beforeSnapshot.exists()) {
      console.log("🔥 Document doesn't exist, nothing to delete");
      return true;
    }

    console.log("🔥 Creating batch delete operation...");
    const batch = writeBatch(db);
    batch.delete(categoryRef);

    console.log("🔥 Committing batch...");
    await batch.commit();
    console.log("🔥 Batch committed successfully");

    const afterSnapshot = await getDoc(categoryRef);
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

/**
 * Initialize categories in Firestore with their original IDs
 */
export const initializeCategories = async (defaultCategories, userId) => {
  try {
    console.log("🔄 Initializing categories in Firestore for user:", userId);
    const batch = writeBatch(db);

    const categoriesWithMetadata = defaultCategories.map((category, index) => ({
      ...category,
      userId,
      order: index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    categoriesWithMetadata.forEach((category) => {
      const categoryRef = doc(db, CATEGORIES_COLLECTION, category.id);
      batch.set(categoryRef, category);
    });

    await batch.commit();
    console.log("✅ Categories initialized successfully with original IDs");
    return categoriesWithMetadata;
  } catch (error) {
    console.error("Error initializing categories:", error);
    throw error;
  }
};

/**
 * Update the order of categories in Firestore
 */
export const reorderCategories = async (categories) => {
  try {
    console.log("🔄 Updating category order in Firestore...");
    const batch = writeBatch(db);

    categories.forEach((category, index) => {
      const categoryRef = doc(db, CATEGORIES_COLLECTION, category.id);
      batch.update(categoryRef, {
        order: index,
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    console.log("✅ Category order updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating category order:", error);
    throw error;
  }
};
