import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { fetchAllUsers } from "../../firebase/authService";
import { categories as defaultCategories } from "../../app/data/data";

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
      // Fetch all users
      const allUsers = await fetchAllUsers();
      setUsers(allUsers);
      console.log(
        "👥 Users found:",
        allUsers.length,
        allUsers.map((u) => ({
          id: u.id,
          name: u.displayName,
          email: u.email,
        })),
      );

      // Fetch ALL recipes (no filter)
      const recipesRef = collection(db, "recipes");
      const recipeSnapshot = await getDocs(recipesRef);
      const allRecipes = [];
      recipeSnapshot.forEach((d) => {
        const data = d.data();
        allRecipes.push({ id: d.id, ...data });
      });
      allRecipes.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setRecipes(allRecipes);
      console.log("📋 Recipes found:", allRecipes.length);
      console.log("📋 Recipe userIds:", [
        ...new Set(allRecipes.map((r) => r.userId)),
      ]);

      // Fetch ALL categories (no filter)
      const catsRef = collection(db, "categories");
      const catSnapshot = await getDocs(catsRef);
      const allCats = [];
      catSnapshot.forEach((d) => {
        allCats.push({ id: d.id, ...d.data() });
      });
      setCategories(allCats);
      console.log("📂 Categories found:", allCats.length);
      console.log("📂 Category userIds:", [
        ...new Set(allCats.map((c) => c.userId)),
      ]);
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
    if (
      Object.keys(selectedRecipes).filter((k) => selectedRecipes[k]).length ===
      recipes.length
    ) {
      setSelectedRecipes({});
    } else {
      const all = {};
      recipes.forEach((r) => {
        all[r.id] = true;
      });
      setSelectedRecipes(all);
    }
  };

  const toggleSelectByUser = (userId) => {
    const userRecipes = recipes.filter((r) => r.userId === userId);
    const allSelected = userRecipes.every((r) => selectedRecipes[r.id]);
    const newSelected = { ...selectedRecipes };
    userRecipes.forEach((r) => {
      if (allSelected) {
        delete newSelected[r.id];
      } else {
        newSelected[r.id] = true;
      }
    });
    setSelectedRecipes(newSelected);
  };

  const selectedCount = Object.keys(selectedRecipes).filter(
    (k) => selectedRecipes[k],
  ).length;

  const handleReassign = async () => {
    if (!targetUserId) {
      setMessage("⚠️ בחר משתמש יעד");
      return;
    }
    const selectedIds = Object.keys(selectedRecipes).filter(
      (id) => selectedRecipes[id],
    );
    if (selectedIds.length === 0) {
      setMessage("⚠️ בחר לפחות מתכון אחד");
      return;
    }

    const targetName = getUserDisplay(targetUserId) || targetUserId;
    if (
      !window.confirm(`להעביר ${selectedIds.length} מתכונים ל-${targetName}?`)
    )
      return;

    setUpdating(true);
    setMessage("");
    try {
      // Firestore batch limit is 500
      for (let i = 0; i < selectedIds.length; i += 450) {
        const chunk = selectedIds.slice(i, i + 450);
        const batch = writeBatch(db);
        chunk.forEach((recipeId) => {
          const recipeRef = doc(db, "recipes", recipeId);
          batch.update(recipeRef, { userId: targetUserId });
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
    if (
      !window.confirm(
        `לתקן קטגוריות של ${userName}? זה ימחק את הקטגוריות הקיימות ויצור חדשות.`,
      )
    )
      return;

    setUpdating(true);
    setMessage("");
    try {
      // 1. Delete ALL existing categories for this user
      const userCats = categories.filter((c) => c.userId === userId);
      console.log(
        `🗑️ Deleting ${userCats.length} broken categories for user ${userId}`,
      );
      for (const cat of userCats) {
        await deleteDoc(doc(db, "categories", cat.id));
      }

      // Also delete any prefixed categories (userId_xxx pattern)
      const prefixedCats = categories.filter((c) =>
        c.id.startsWith(userId + "_"),
      );
      for (const cat of prefixedCats) {
        await deleteDoc(doc(db, "categories", cat.id));
      }

      // 2. Re-create categories using addDoc (auto-generated unique IDs)
      // Skip "all" category - it's virtual
      const catsToCreate = defaultCategories.filter((c) => c.id !== "all");
      const categoriesRef = collection(db, "categories");

      console.log(
        `📂 Creating ${catsToCreate.length} new categories for user ${userId}`,
      );
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

      setMessage(
        `✅ תוקנו ${catsToCreate.length} קטגוריות עבור ${userName}. רענן את הדף הראשי.`,
      );
      await loadData();
    } catch (error) {
      console.error("Error repairing categories:", error);
      setMessage("❌ שגיאה בתיקון קטגוריות: " + error.message);
    }
    setUpdating(false);
  };

  // Group recipes by userId
  const recipesByUser = {};
  recipes.forEach((r) => {
    const uid = r.userId || "NO_OWNER";
    if (!recipesByUser[uid]) recipesByUser[uid] = [];
    recipesByUser[uid].push(r);
  });

  // Unique userIds from recipes that don't match any known user
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

  return (
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
            background: message.includes("✅")
              ? "#d4edda"
              : message.includes("⚠️")
                ? "#fff3cd"
                : "#f8d7da",
            border: `1px solid ${message.includes("✅") ? "#28a745" : message.includes("⚠️") ? "#ffc107" : "#dc3545"}`,
          }}
        >
          {message}
        </div>
      )}

      {/* Debug info */}
      <div
        style={{
          background: "#f8f9fa",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          border: "1px solid #dee2e6",
        }}
      >
        <h3 style={{ margin: "0 0 0.75rem", color: "#333" }}>
          📊 סטטוס נתונים ב-Firebase
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "#e3f2fd",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#1976d2" }}
            >
              {users.length}
            </div>
            <div>משתמשים</div>
          </div>
          <div
            style={{
              background: "#e8f5e9",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#2e7d32" }}
            >
              {recipes.length}
            </div>
            <div>מתכונים</div>
          </div>
          <div
            style={{
              background: "#fff3e0",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#e65100" }}
            >
              {categories.length}
            </div>
            <div>קטגוריות</div>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div
        style={{
          background: "#e3f2fd",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
        }}
      >
        <h3 style={{ margin: "0 0 0.75rem" }}>👥 משתמשים רשומים:</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            borderRadius: "4px",
          }}
        >
          <thead>
            <tr style={{ background: "#bbdefb" }}>
              <th
                style={{
                  padding: "0.5rem",
                  border: "1px solid #90caf9",
                  textAlign: "right",
                }}
              >
                שם
              </th>
              <th
                style={{
                  padding: "0.5rem",
                  border: "1px solid #90caf9",
                  textAlign: "right",
                }}
              >
                אימייל
              </th>
              <th
                style={{
                  padding: "0.5rem",
                  border: "1px solid #90caf9",
                  textAlign: "right",
                }}
              >
                User ID
              </th>
              <th
                style={{
                  padding: "0.5rem",
                  border: "1px solid #90caf9",
                  textAlign: "center",
                }}
              >
                מתכונים
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: "0.5rem", border: "1px solid #e0e0e0" }}>
                  <strong>{u.displayName || "—"}</strong>
                </td>
                <td style={{ padding: "0.5rem", border: "1px solid #e0e0e0" }}>
                  {u.email}
                </td>
                <td
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #e0e0e0",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    wordBreak: "break-all",
                  }}
                >
                  {u.id}
                </td>
                <td
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #e0e0e0",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                  }}
                >
                  {(recipesByUser[u.id] || []).length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Categories per user */}
      <div
        style={{
          background: "#fff8e1",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          border: "1px solid #ffcc02",
        }}
      >
        <h3 style={{ margin: "0 0 0.75rem" }}>📂 קטגוריות לפי משתמש:</h3>
        {users.map((u) => {
          const userCats = categories.filter((c) => c.userId === u.id);
          return (
            <div
              key={u.id}
              style={{
                marginBottom: "1rem",
                background: "white",
                padding: "0.75rem",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <div>
                  <strong>{u.displayName || u.email}</strong>
                  <span style={{ marginRight: "0.5rem", color: "#666" }}>
                    ({userCats.length} קטגוריות)
                  </span>
                  {userCats.length < 5 && (
                    <span
                      style={{
                        color: "#d32f2f",
                        fontWeight: "bold",
                        marginRight: "0.5rem",
                      }}
                    >
                      ⚠️ חסרות קטגוריות!
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRepairCategories(u.id)}
                  disabled={updating}
                  style={{
                    padding: "0.4rem 1rem",
                    background: updating ? "#999" : "#ff9800",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: updating ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  🔧 תקן קטגוריות
                </button>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#555" }}>
                {userCats.length > 0 ? (
                  userCats.map((c) => (
                    <span
                      key={c.id}
                      style={{
                        display: "inline-block",
                        background: c.color || "#eee",
                        color: "white",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "12px",
                        margin: "0.15rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      {c.name} <span style={{ opacity: 0.7 }}>({c.id})</span>
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#d32f2f" }}>אין קטגוריות!</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unknown userIds warning */}
      {unknownUserIds.length > 0 && (
        <div
          style={{
            background: "#fff3cd",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "1px solid #ffc107",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem", color: "#856404" }}>
            ⚠️ נמצאו מתכונים עם userId שלא מתאים לאף משתמש רשום:
          </h3>
          {unknownUserIds.map((uid) => (
            <div
              key={uid}
              style={{
                fontFamily: "monospace",
                fontSize: "0.85rem",
                padding: "0.25rem 0",
              }}
            >
              <strong>{uid}</strong> — {recipesByUser[uid].length} מתכונים
            </div>
          ))}
        </div>
      )}

      {/* Reassign controls */}
      <div
        style={{
          background: "#f5f5f5",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
          border: "2px solid #1976d2",
        }}
      >
        <label style={{ fontWeight: "bold" }}>העבר מתכונים נבחרים ל:</label>
        <select
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          style={{
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #ddd",
            minWidth: "300px",
          }}
        >
          <option value="">-- בחר משתמש יעד --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName || "No name"} — {u.email}
            </option>
          ))}
        </select>
        <button
          onClick={handleReassign}
          disabled={updating || !targetUserId || selectedCount === 0}
          style={{
            padding: "0.5rem 1.5rem",
            background:
              updating || !targetUserId || selectedCount === 0
                ? "#999"
                : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              updating || !targetUserId || selectedCount === 0
                ? "not-allowed"
                : "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          {updating ? "מעביר..." : `העבר ${selectedCount} מתכונים`}
        </button>
      </div>

      {/* Recipes grouped by user */}
      <div
        style={{
          marginBottom: "0.5rem",
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <button
          onClick={toggleSelectAll}
          style={{
            padding: "0.4rem 1rem",
            cursor: "pointer",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
        >
          {selectedCount === recipes.length ? "בטל הכל" : "בחר הכל"}
        </button>
        <span style={{ color: "#666" }}>
          סה"כ: <strong>{recipes.length}</strong> מתכונים | נבחרו:{" "}
          <strong>{selectedCount}</strong>
        </span>
      </div>

      {Object.entries(recipesByUser).map(([userId, userRecipes]) => {
        const userName = getUserDisplay(userId);
        const isUnknown = !userName && userId !== "NO_OWNER";
        return (
          <div key={userId} style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                background: isUnknown ? "#fff3cd" : "#e8e8e8",
                padding: "0.75rem 1rem",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div>
                <strong style={{ fontSize: "1.1rem" }}>
                  👤{" "}
                  {userName ||
                    (userId === "NO_OWNER" ? "ללא בעלים" : "משתמש לא ידוע")}
                </strong>
                <span style={{ marginRight: "0.5rem", color: "#666" }}>
                  ({userRecipes.length} מתכונים)
                </span>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: "#888",
                    marginTop: "0.25rem",
                  }}
                >
                  userId: {userId}
                </div>
              </div>
              <button
                onClick={() => toggleSelectByUser(userId)}
                style={{
                  padding: "0.3rem 0.75rem",
                  cursor: "pointer",
                  borderRadius: "4px",
                  border: "1px solid #bbb",
                  background: "white",
                }}
              >
                בחר/בטל הכל
              </button>
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #ddd",
              }}
            >
              <thead>
                <tr style={{ background: "#f9f9f9" }}>
                  <th
                    style={{
                      padding: "0.5rem",
                      border: "1px solid #ddd",
                      width: "40px",
                    }}
                  >
                    ✓
                  </th>
                  <th style={{ padding: "0.5rem", border: "1px solid #ddd" }}>
                    שם מתכון
                  </th>
                  <th
                    style={{
                      padding: "0.5rem",
                      border: "1px solid #ddd",
                      width: "200px",
                    }}
                  >
                    userId (raw)
                  </th>
                  <th
                    style={{
                      padding: "0.5rem",
                      border: "1px solid #ddd",
                      width: "100px",
                    }}
                  >
                    נוצר
                  </th>
                </tr>
              </thead>
              <tbody>
                {userRecipes.map((recipe) => (
                  <tr
                    key={recipe.id}
                    style={{
                      background: selectedRecipes[recipe.id]
                        ? "#e3f2fd"
                        : "white",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setSelectedRecipes((prev) => ({
                        ...prev,
                        [recipe.id]: !prev[recipe.id],
                      }))
                    }
                  >
                    <td
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        textAlign: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedRecipes[recipe.id]}
                        onChange={() => {}}
                        style={{
                          cursor: "pointer",
                          width: "18px",
                          height: "18px",
                        }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        fontWeight: "500",
                      }}
                    >
                      {recipe.name || "Unnamed"}
                    </td>
                    <td
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        fontFamily: "monospace",
                        fontSize: "0.7rem",
                        color: "#666",
                        wordBreak: "break-all",
                      }}
                    >
                      {recipe.userId || "—"}
                    </td>
                    <td
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        fontSize: "0.8rem",
                        color: "#666",
                      }}
                    >
                      {recipe.createdAt
                        ? new Date(recipe.createdAt).toLocaleDateString("he-IL")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export default Repair;
