import { useState } from "react";
import { migrateDataToUser } from "../../firebase/migrateData";
import { useRecipeBook } from "../../context";

function MigratePage() {
  const { currentUser } = useRecipeBook();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleMigrate = async () => {
    if (!currentUser) {
      setError("You must be logged in to migrate data");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const migrationResult = await migrateDataToUser(currentUser.uid);
      setResult(migrationResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Migrate Existing Data</h1>
      
      {currentUser && (
        <div style={{ marginBottom: "2rem", padding: "1rem", background: "#f0f0f0", borderRadius: "8px" }}>
          <p><strong>Current User:</strong></p>
          <p>Email: {currentUser.email}</p>
          <p>UID: {currentUser.uid}</p>
        </div>
      )}

      <p style={{ marginBottom: "2rem" }}>
        This will add your user ID to all existing recipes and categories in the database.
        This is a one-time operation.
      </p>

      <button
        onClick={handleMigrate}
        disabled={isLoading || !currentUser}
        style={{
          padding: "1rem 2rem",
          fontSize: "1.2rem",
          background: isLoading ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "Migrating..." : "Migrate Data"}
      </button>

      {error && (
        <div style={{ marginTop: "2rem", padding: "1rem", background: "#fee", color: "#c33", borderRadius: "8px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: "2rem", padding: "1rem", background: "#efe", color: "#363", borderRadius: "8px" }}>
          <h2>✅ Migration Complete!</h2>
          <p>Recipes updated: {result.recipesUpdated}</p>
          <p>Categories updated: {result.categoriesUpdated}</p>
          <p style={{ marginTop: "1rem" }}>
            <strong>You can now close this page and refresh the app!</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default MigratePage;
