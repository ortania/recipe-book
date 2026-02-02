import { useState } from "react";
import {
  migrateLocalStorageCategoriesToFirebase,
  checkLocalStorageCategories,
} from "../../utils/migrateLocalStorageToFirebase";
import { removeDuplicateCategories } from "../../firebase/cleanupCategories";
import { deleteAllCategories } from "../../firebase/deleteAllCategories";
import { initializeCategories } from "../../firebase/categoryService";
import { categories as initialCategories } from "../../app/data/data";
import classes from "./migration-helper.module.css";

function MigrationHelper() {
  const [status, setStatus] = useState("");
  const [localCategories, setLocalCategories] = useState(null);

  const handleCheckLocalStorage = () => {
    const categories = checkLocalStorageCategories();
    setLocalCategories(categories);
    if (categories) {
      setStatus(`Found ${categories.length} categories in LocalStorage`);
    } else {
      setStatus("No categories found in LocalStorage");
    }
  };

  const handleMigrate = async () => {
    setStatus("Migrating...");
    const result = await migrateLocalStorageCategoriesToFirebase();

    if (result.success) {
      setStatus(`✅ ${result.message}`);
      setLocalCategories(null);
    } else {
      setStatus(`❌ Error: ${result.message}`);
    }
  };

  const handleCleanupDuplicates = async () => {
    setStatus("Cleaning up duplicates...");
    const result = await removeDuplicateCategories();

    if (result.success) {
      setStatus(`✅ ${result.message}`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setStatus(`❌ Error: ${result.message}`);
    }
  };

  const handleInitializeCategories = async () => {
    setStatus("Initializing categories in Firebase...");
    try {
      await initializeCategories(initialCategories);
      setStatus(`✅ Categories initialized successfully!`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL categories from Firebase? This cannot be undone!",
      )
    ) {
      return;
    }
    setStatus("Deleting all categories...");
    const result = await deleteAllCategories();

    if (result.success) {
      setStatus(`✅ ${result.message}`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setStatus(`❌ Error: ${result.message}`);
    }
  };

  return (
    <div className={classes.container}>
      <h3>LocalStorage to Firebase Migration</h3>
      <div className={classes.buttons}>
        <button onClick={handleCheckLocalStorage} className={classes.checkBtn}>
          Check LocalStorage
        </button>
        <button onClick={handleMigrate} className={classes.migrateBtn}>
          Migrate to Firebase
        </button>
      </div>
      <div className={classes.buttons}>
        <button
          onClick={handleCleanupDuplicates}
          className={classes.cleanupBtn}
        >
          Remove Duplicates
        </button>
      </div>
      <div className={classes.buttons}>
        <button onClick={handleDeleteAll} className={classes.deleteBtn}>
          Delete ALL Categories
        </button>
      </div>
      <div className={classes.buttons}>
        <button
          onClick={handleInitializeCategories}
          className={classes.initBtn}
        >
          Initialize Categories
        </button>
      </div>

      {status && <p className={classes.status}>{status}</p>}

      {localCategories && (
        <div className={classes.categoriesList}>
          <h4>Categories in LocalStorage:</h4>
          <ul>
            {localCategories.map((cat) => (
              <li key={cat.id}>
                <strong>{cat.name}</strong> - {cat.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MigrationHelper;
