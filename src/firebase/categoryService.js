import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
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
    let q;

    if (userId) {
      q = query(categoriesRef, where("userId", "==", userId), orderBy("order"));
    } else {
      q = query(categoriesRef, orderBy("order"));
    }

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (indexError) {
      console.warn(
        "⚠️ fetchCategories index query failed, falling back to simple query:",
        indexError.message,
      );
      // Fallback: query without orderBy (no composite index needed)
      if (userId) {
        q = query(categoriesRef, where("userId", "==", userId));
      } else {
        q = query(categoriesRef);
      }
      querySnapshot = await getDocs(q);
    }

    const categories = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      categories.push({
        ...data,
        // Use the data 'id' field if it exists (e.g. "salads"), otherwise use Firestore doc ID
        id: data.id || docSnap.id,
        // Always keep the Firestore doc ID for update/delete operations
        docId: docSnap.id,
      });
    });

    // Sort client-side if we used fallback
    categories.sort((a, b) => (a.order || 0) - (b.order || 0));

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
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);

    const categoryData = {
      ...category,
      userId,
      order: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(categoriesRef, categoryData);

    return {
      ...categoryData,
      id: category.id,
      docId: docRef.id,
    };
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

/**
 * Update an existing category in Firestore
 */
export const updateCategory = async (categoryId, updatedData) => {
  try {
    // Use docId (Firestore document ID) if available, otherwise fall back to categoryId
    const firestoreDocId = updatedData.docId || categoryId;
    const categoryRef = doc(db, CATEGORIES_COLLECTION, firestoreDocId);
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
export const deleteCategory = async (categoryId, docId = null) => {
  const firestoreDocId = docId || categoryId;
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, firestoreDocId);
    await deleteDoc(categoryRef);
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

/**
 * Initialize categories in Firestore with their original IDs
 */
export const initializeCategories = async (defaultCategories, userId) => {
  try {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const results = [];

    // Filter out "all" - it's a virtual UI category, not stored in Firestore
    const categoriesToStore = defaultCategories.filter((c) => c.id !== "all");

    for (let index = 0; index < categoriesToStore.length; index++) {
      const category = categoriesToStore[index];
      const categoryData = {
        ...category,
        userId,
        order: index,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Use addDoc to get a unique auto-generated Firestore doc ID per user
      const docRef = await addDoc(categoriesRef, categoryData);
      results.push({ ...categoryData, docId: docRef.id });
    }

    return results;
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
    const batch = writeBatch(db);

    categories.forEach((category, index) => {
      const firestoreDocId = category.docId || category.id;
      const categoryRef = doc(db, CATEGORIES_COLLECTION, firestoreDocId);
      batch.update(categoryRef, {
        order: index,
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error updating category order:", error);
    throw error;
  }
};
