import { useRepair } from "./RepairContext";

export default function RepairStats() {
  const { users, recipes, categories } = useRepair();

  return (
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
        <div style={{ background: "#e3f2fd", padding: "1rem", borderRadius: "8px" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1976d2" }}>
            {users.length}
          </div>
          <div>משתמשים</div>
        </div>
        <div style={{ background: "#e8f5e9", padding: "1rem", borderRadius: "8px" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#2e7d32" }}>
            {recipes.length}
          </div>
          <div>מתכונים</div>
        </div>
        <div style={{ background: "#fff3e0", padding: "1rem", borderRadius: "8px" }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#e65100" }}>
            {categories.length}
          </div>
          <div>קטגוריות</div>
        </div>
      </div>
    </div>
  );
}
