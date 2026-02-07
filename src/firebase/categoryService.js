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

    const categoryData = {
      ...category,
      userId,
      order: currentCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use addDoc to generate a unique Firestore doc ID (no collisions between users)
    const docRef = await addDoc(categoriesRef, categoryData);
    console.log(
      "✅ Category added to Firebase successfully with order:",
      currentCount,
    );

    return {
      ...categoryData,
      id: category.id,
      docId: docRef.id,
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
  // Use docId (Firestore document ID) if provided, otherwise fall back to categoryId
  const firestoreDocId = docId || categoryId;
  console.log(
    "🔥 Firebase deleteCategory called with ID:",
    categoryId,
    "docId:",
    firestoreDocId,
  );
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, firestoreDocId);
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

    console.log("✅ Categories initialized successfully for user:", userId);
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
    console.log("🔄 Updating category order in Firestore...");
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
    console.log("✅ Category order updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating category order:", error);
    throw error;
  }
};
