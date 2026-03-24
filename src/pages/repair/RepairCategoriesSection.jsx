import { useRepair } from "./RepairContext";

export default function RepairCategoriesSection() {
  const { users, categories, updating, handleRepairCategories } = useRepair();

  return (
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
                  <span style={{ color: "#d32f2f", fontWeight: "bold", marginRight: "0.5rem" }}>
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
  );
}
