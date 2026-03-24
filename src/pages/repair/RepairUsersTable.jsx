import { useRepair } from "./RepairContext";

export default function RepairUsersTable() {
  const { users, recipesByUser } = useRepair();

  return (
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
            <th style={{ padding: "0.5rem", border: "1px solid #90caf9", textAlign: "right" }}>שם</th>
            <th style={{ padding: "0.5rem", border: "1px solid #90caf9", textAlign: "right" }}>אימייל</th>
            <th style={{ padding: "0.5rem", border: "1px solid #90caf9", textAlign: "right" }}>User ID</th>
            <th style={{ padding: "0.5rem", border: "1px solid #90caf9", textAlign: "center" }}>מתכונים</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={{ padding: "0.5rem", border: "1px solid #e0e0e0" }}>
                <strong>{u.displayName || "—"}</strong>
              </td>
              <td style={{ padding: "0.5rem", border: "1px solid #e0e0e0" }}>{u.email}</td>
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
  );
}
