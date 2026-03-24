import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  writeBatch,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { fetchAllUsers } from "../../firebase/authService";
import { categories as defaultCategories } from "../../app/data/data";

import { RepairContext } from "./RepairContext";
import RepairStats from "./RepairStats";
import RepairUsersTable from "./RepairUsersTable";
import RepairCategoriesSection from "./RepairCategoriesSection";
import RepairRecipesSection from "./RepairRecipesSection";

function Repair() {
  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState({});
  const [targetUserId, setTargetUserId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allUsers = await fetchAllUsers();
      setUsers(allUsers);
      console.log(
        "👥 Users found:",
        allUsers.length,
        allUsers.map((u) => ({ id: u.id, name: u.displayName, email: u.email })),
      );

      const recipesRef = collection(db, "recipes");
      const allRecipes = [];
      for (const user of allUsers) {
        try {
          const userQuery = query(recipesRef, where("userId", "==", user.id));
          const userSnapshot = await getDocs(userQuery);
          userSnapshot.forEach((d) => { allRecipes.push({ id: d.id, ...d.data() }); });
        } catch (err) {
          console.warn(`⚠️ Could not fetch recipes for user ${user.id}:`, err.message);
        }
      }
      try {
        const allSnapshot = await getDocs(recipesRef);
        allSnapshot.forEach((d) => {
          const data = d.data();
          if (!data.userId) allRecipes.push({ id: d.id, ...data });
        });
      } catch (err) {
        console.warn("⚠️ Could not fetch orphaned recipes:", err.message);
      }
      allRecipes.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setRecipes(allRecipes);
      console.log("📋 Recipes found:", allRecipes.length);
      console.log("📋 Recipe userIds:", [...new Set(allRecipes.map((r) => r.userId))]);

      const catsRef = collection(db, "categories");
      const allCats = [];
      for (const user of allUsers) {
        try {
          const userCatQuery = query(catsRef, where("userId", "==", user.id));
          const userCatSnapshot = await getDocs(userCatQuery);
          userCatSnapshot.forEach((d) => { allCats.push({ id: d.id, ...d.data() }); });
        } catch (err) {
          console.warn(`⚠️ Could not fetch categories for user ${user.id}:`, err.message);
        }
      }
      setCategories(allCats);
      console.log("📂 Categories found:", allCats.length);
      console.log("📂 Category userIds:", [...new Set(allCats.map((c) => c.userId))]);
    } catch (error) {
      console.error("Error loading data:", error);
      setMessage("Error loading data: " + error.message);
    }
    setLoading(false);
  };

  const getUserDisplay = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (user) return `${user.displayName || user.email}`;
    return null;
  };

  const toggleSelectAll = () => {
    if (Object.keys(selectedRecipes).filter((k) => selectedRecipes[k]).length === recipes.length) {
      setSelectedRecipes({});
    } else {
      const all = {};
      recipes.forEach((r) => { all[r.id] = true; });
      setSelectedRecipes(all);
    }
  };

  const toggleSelectByUser = (userId) => {
    const userRecipes = recipes.filter((r) => r.userId === userId);
    const allSelected = userRecipes.every((r) => selectedRecipes[r.id]);
    const newSelected = { ...selectedRecipes };
    userRecipes.forEach((r) => {
      if (allSelected) delete newSelected[r.id];
      else newSelected[r.id] = true;
    });
    setSelectedRecipes(newSelected);
  };

  const selectedCount = Object.keys(selectedRecipes).filter((k) => selectedRecipes[k]).length;

  const handleReassign = async () => {
    if (!targetUserId) { setMessage("⚠️ בחר משתמש יעד"); return; }
    const selectedIds = Object.keys(selectedRecipes).filter((id) => selectedRecipes[id]);
    if (selectedIds.length === 0) { setMessage("⚠️ בחר לפחות מתכון אחד"); return; }

    const targetName = getUserDisplay(targetUserId) || targetUserId;
    if (!window.confirm(`להעביר ${selectedIds.length} מתכונים ל-${targetName}?`)) return;

    setUpdating(true);
    setMessage("");
    try {
      for (let i = 0; i < selectedIds.length; i += 450) {
        const chunk = selectedIds.slice(i, i + 450);
        const batch = writeBatch(db);
        chunk.forEach((recipeId) => {
          batch.update(doc(db, "recipes", recipeId), { userId: targetUserId });
        });
        await batch.commit();
      }
      setMessage(`✅ הועברו ${selectedIds.length} מתכונים ל-${targetName}`);
      setSelectedRecipes({});
      await loadData();
    } catch (error) {
      console.error("Error reassigning:", error);
      setMessage("❌ שגיאה: " + error.message);
    }
    setUpdating(false);
  };

  const handleRepairCategories = async (userId) => {
    const userName = getUserDisplay(userId) || userId;
    if (!window.confirm(`לתקן קטגוריות של ${userName}? זה ימחק את הקטגוריות הקיימות ויצור חדשות.`)) return;

    setUpdating(true);
    setMessage("");
    try {
      const userCats = categories.filter((c) => c.userId === userId);
      console.log(`🗑️ Deleting ${userCats.length} broken categories for user ${userId}`);
      for (const cat of userCats) await deleteDoc(doc(db, "categories", cat.id));

      const prefixedCats = categories.filter((c) => c.id.startsWith(userId + "_"));
      for (const cat of prefixedCats) await deleteDoc(doc(db, "categories", cat.id));

      const catsToCreate = defaultCategories.filter((c) => c.id !== "all");
      const categoriesRef = collection(db, "categories");
      console.log(`📂 Creating ${catsToCreate.length} new categories for user ${userId}`);
      for (let i = 0; i < catsToCreate.length; i++) {
        const cat = catsToCreate[i];
        await addDoc(categoriesRef, {
          ...cat,
          userId,
          order: i,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setMessage(`✅ תוקנו ${catsToCreate.length} קטגוריות עבור ${userName}. רענן את הדף הראשי.`);
      await loadData();
    } catch (error) {
      console.error("Error repairing categories:", error);
      setMessage("❌ שגיאה בתיקון קטגוריות: " + error.message);
    }
    setUpdating(false);
  };

  const recipesByUser = {};
  recipes.forEach((r) => {
    const uid = r.userId || "NO_OWNER";
    if (!recipesByUser[uid]) recipesByUser[uid] = [];
    recipesByUser[uid].push(r);
  });

  const unknownUserIds = Object.keys(recipesByUser).filter(
    (uid) => uid !== "NO_OWNER" && !users.find((u) => u.id === uid),
  );

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>⏳ טוען נתונים מ-Firebase...</h2>
      </div>
    );
  }

  const contextValue = {
    users, recipes, categories,
    updating, selectedRecipes, setSelectedRecipes, targetUserId, setTargetUserId,
    selectedCount, recipesByUser, unknownUserIds,
    getUserDisplay, toggleSelectAll, toggleSelectByUser, handleReassign, handleRepairCategories,
  };

  return (
    <RepairContext.Provider value={contextValue}>
      <div
        style={{
          padding: "2rem",
          maxWidth: "1000px",
          margin: "0 auto",
          direction: "rtl",
          fontFamily: "sans-serif",
        }}
      >
        <h1 style={{ marginBottom: "1rem" }}>🔧 תיקון נתונים - העברת מתכונים</h1>

        {message && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              background: message.includes("✅") ? "#d4edda" : message.includes("⚠️") ? "#fff3cd" : "#f8d7da",
              border: `1px solid ${message.includes("✅") ? "#28a745" : message.includes("⚠️") ? "#ffc107" : "#dc3545"}`,
            }}
          >
            {message}
          </div>
        )}

        <RepairStats />
        <RepairUsersTable />
        <RepairCategoriesSection />
        <RepairRecipesSection />
      </div>
    </RepairContext.Provider>
  );
}

export default Repair;
