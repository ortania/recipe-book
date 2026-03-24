import { useRepair } from "./RepairContext";

export default function RepairRecipesSection() {
  const {
    users, recipes, unknownUserIds, recipesByUser,
    updating, targetUserId, setTargetUserId,
    selectedRecipes, setSelectedRecipes, selectedCount,
    toggleSelectAll, toggleSelectByUser, handleReassign, getUserDisplay,
  } = useRepair();

  return (
    <>
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
              style={{ fontFamily: "monospace", fontSize: "0.85rem", padding: "0.25rem 0" }}
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
            background: updating || !targetUserId || selectedCount === 0 ? "#999" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: updating || !targetUserId || selectedCount === 0 ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          {updating ? "מעביר..." : `העבר ${selectedCount} מתכונים`}
        </button>
      </div>

      {/* Select all + count */}
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
          style={{ padding: "0.4rem 1rem", cursor: "pointer", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          {selectedCount === recipes.length ? "בטל הכל" : "בחר הכל"}
        </button>
        <span style={{ color: "#666" }}>
          סה"כ: <strong>{recipes.length}</strong> מתכונים | נבחרו: <strong>{selectedCount}</strong>
        </span>
      </div>

      {/* Recipes grouped by user */}
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
                  👤 {userName || (userId === "NO_OWNER" ? "ללא בעלים" : "משתמש לא ידוע")}
                </strong>
                <span style={{ marginRight: "0.5rem", color: "#666" }}>
                  ({userRecipes.length} מתכונים)
                </span>
                <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#888", marginTop: "0.25rem" }}>
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
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ddd" }}>
              <thead>
                <tr style={{ background: "#f9f9f9" }}>
                  <th style={{ padding: "0.5rem", border: "1px solid #ddd", width: "40px" }}>✓</th>
                  <th style={{ padding: "0.5rem", border: "1px solid #ddd" }}>שם מתכון</th>
                  <th style={{ padding: "0.5rem", border: "1px solid #ddd", width: "200px" }}>userId (raw)</th>
                  <th style={{ padding: "0.5rem", border: "1px solid #ddd", width: "100px" }}>נוצר</th>
                </tr>
              </thead>
              <tbody>
                {userRecipes.map((recipe) => (
                  <tr
                    key={recipe.id}
                    style={{ background: selectedRecipes[recipe.id] ? "#e3f2fd" : "white", cursor: "pointer" }}
                    onClick={() =>
                      setSelectedRecipes((prev) => ({ ...prev, [recipe.id]: !prev[recipe.id] }))
                    }
                  >
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={!!selectedRecipes[recipe.id]}
                        onChange={() => {}}
                        style={{ cursor: "pointer", width: "18px", height: "18px" }}
                      />
                    </td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", fontWeight: "500" }}>
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
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", fontSize: "0.8rem", color: "#666" }}>
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
    </>
  );
}
