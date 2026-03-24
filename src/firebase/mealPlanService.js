import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./config";

const MEAL_PLANS_COLLECTION = "mealPlans";

export const fetchMealPlan = async (userId) => {
  try {
    const docRef = doc(db, MEAL_PLANS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return null;
  }
};

export const saveMealPlan = async (userId, plan) => {
  try {
    const docRef = doc(db, MEAL_PLANS_COLLECTION, userId);
    await setDoc(docRef, {
      plan,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving meal plan:", error);
    throw error;
  }
};

export const fetchShoppingChecked = async (userId) => {
  try {
    const docRef = doc(db, MEAL_PLANS_COLLECTION, `${userId}_checked`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().checked || {};
    }
    return {};
  } catch (error) {
    console.error("Error fetching shopping checked:", error);
    return {};
  }
};

export const saveShoppingChecked = async (userId, checked) => {
  try {
    const docRef = doc(db, MEAL_PLANS_COLLECTION, `${userId}_checked`);
    await setDoc(docRef, {
      checked,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving shopping checked:", error);
    throw error;
  }
};
