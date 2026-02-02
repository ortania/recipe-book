import React, { useState } from "react";
import { Modal } from "../../modal";
import { Button } from "../../controls/button";
import { FaGripVertical } from "react-icons/fa";
import classes from "../form.module.css";
import {
  parseRecipeFromUrl,
  parseRecipeFromText,
} from "../../../app/recipeParser";

function AddRecipe({
  onAddPerson,
  onCancel,
  onEditPerson,
  defaultGroup = null,
  groups = [],
}) {
  const [newPerson, setNewPerson] = useState({
    name: "",
    ingredients: [],
    instructions: [],
    prepTime: "",
    cookTime: "",
    servings: "",
    difficulty: "Easy",
    sourceUrl: "",
    image_src: "",
    categories: defaultGroup ? [defaultGroup] : [],
    isFavorite: false,
    notes: "",
    rating: 0,
  });

  const [recipeText, setRecipeText] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [importMode, setImportMode] = useState("url");
  const [draggedIngredientIndex, setDraggedIngredientIndex] = useState(null);
  const [draggedInstructionIndex, setDraggedInstructionIndex] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("🎯 FORM SUBMIT - Rating value:", newPerson.rating);
    console.log("🎯 FORM SUBMIT - Full recipe data:", {
      name: newPerson.name,
      rating: newPerson.rating,
    });
    onAddPerson({
      name: newPerson.name,
      ingredients: Array.isArray(newPerson.ingredients)
        ? newPerson.ingredients
        : newPerson.ingredients
            .split(",")
            .map((i) => i.trim())
            .filter((i) => i),
      instructions: Array.isArray(newPerson.instructions)
        ? newPerson.instructions
        : newPerson.instructions
            .split(".")
            .map((i) => i.trim())
            .filter((i) => i),
      prepTime: newPerson.prepTime,
      cookTime: newPerson.cookTime,
      servings: newPerson.servings ? parseInt(newPerson.servings) : null,
      difficulty: newPerson.difficulty,
      sourceUrl: newPerson.sourceUrl,
      image_src: newPerson.image_src,
      categories: newPerson.categories,
      isFavorite: newPerson.isFavorite,
      notes: newPerson.notes,
      rating: newPerson.rating || 0,
    });
    setNewPerson({
      name: "",
      ingredients: [],
      instructions: [],
      prepTime: "",
      cookTime: "",
      servings: "",
      difficulty: "Easy",
      sourceUrl: "",
      image_src: "",
      categories: defaultGroup ? [defaultGroup] : [],
      isFavorite: false,
      notes: "",
      rating: 0,
    });
    onCancel();
  };

  const handleGroupChange = (e) => {
    const selectedGroups = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setNewPerson({ ...newPerson, categories: selectedGroups });
  };

  const handleFavoriteToggle = () => {
    setNewPerson({ ...newPerson, isFavorite: !newPerson.isFavorite });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image to fit Firebase 1MB limit
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions to keep image under 800KB
          const maxSize = 800 * 1024; // 800KB to be safe
          let quality = 0.7;

          // Scale down if image is too large
          const maxDimension = 1200;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          let compressedBase64 = canvas.toDataURL("image/jpeg", quality);

          // If still too large, reduce quality further
          while (compressedBase64.length > maxSize && quality > 0.1) {
            quality -= 0.1;
            compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          }

          console.log(
            " Image compressed from",
            reader.result.length,
            "to",
            compressedBase64.length,
            "bytes",
          );

          setNewPerson((prev) => ({
            ...prev,
            image_src: compressedBase64,
          }));
          setUploadingImage(false);
        };
        img.onerror = () => {
          setUploadingImage(false);
          alert("Error processing image");
        };
        img.src = reader.result;
      };
      reader.onerror = () => {
        setUploadingImage(false);
        alert("Error uploading image");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIngredientChange = (index, value) => {
    const updatedIngredients = [...newPerson.ingredients];
    updatedIngredients[index] = value;
    setNewPerson({ ...newPerson, ingredients: updatedIngredients });
  };

  const handleAddIngredient = () => {
    setNewPerson({ ...newPerson, ingredients: [...newPerson.ingredients, ""] });
  };

  const handleRemoveIngredient = (index) => {
    const updatedIngredients = newPerson.ingredients.filter(
      (_, i) => i !== index,
    );
    setNewPerson({ ...newPerson, ingredients: updatedIngredients });
  };

  const handleInstructionChange = (index, value) => {
    const updatedInstructions = [...newPerson.instructions];
    updatedInstructions[index] = value;
    setNewPerson({ ...newPerson, instructions: updatedInstructions });
  };

  const handleAddInstruction = () => {
    setNewPerson({
      ...newPerson,
      instructions: [...newPerson.instructions, ""],
    });
  };

  const handleRemoveInstruction = (index) => {
    const updatedInstructions = newPerson.instructions.filter(
      (_, i) => i !== index,
    );
    setNewPerson({ ...newPerson, instructions: updatedInstructions });
  };

  const handleIngredientDragStart = (index) => {
    setDraggedIngredientIndex(index);
  };

  const handleIngredientDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleIngredientDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIngredientIndex === null || draggedIngredientIndex === dropIndex)
      return;

    const newIngredients = [...newPerson.ingredients];
    const draggedItem = newIngredients[draggedIngredientIndex];
    newIngredients.splice(draggedIngredientIndex, 1);
    newIngredients.splice(dropIndex, 0, draggedItem);

    setNewPerson({ ...newPerson, ingredients: newIngredients });
    setDraggedIngredientIndex(null);
  };

  const handleInstructionDragStart = (index) => {
    setDraggedInstructionIndex(index);
  };

  const handleInstructionDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleInstructionDrop = (e, dropIndex) => {
    e.preventDefault();
    if (
      draggedInstructionIndex === null ||
      draggedInstructionIndex === dropIndex
    )
      return;

    const newInstructions = [...newPerson.instructions];
    const draggedItem = newInstructions[draggedInstructionIndex];
    newInstructions.splice(draggedInstructionIndex, 1);
    newInstructions.splice(dropIndex, 0, draggedItem);

    setNewPerson({ ...newPerson, instructions: newInstructions });
    setDraggedInstructionIndex(null);
  };

  const handleImportFromUrl = async () => {
    if (!recipeUrl.trim()) {
      setImportError("Please enter a URL");
      return;
    }

    setIsImporting(true);
    setImportError("");

    try {
      const parsedRecipe = await parseRecipeFromUrl(recipeUrl);
      setNewPerson({
        ...newPerson,
        name: parsedRecipe.name || newPerson.name,
        ingredients: parsedRecipe.ingredients
          ? parsedRecipe.ingredients
              .split(",")
              .map((i) => i.trim())
              .filter((i) => i)
          : newPerson.ingredients,
        instructions: parsedRecipe.instructions
          ? parsedRecipe.instructions
              .split(".")
              .map((i) => i.trim())
              .filter((i) => i)
          : newPerson.instructions,
        prepTime: parsedRecipe.prepTime || newPerson.prepTime,
        cookTime: parsedRecipe.cookTime || newPerson.cookTime,
        servings: parsedRecipe.servings || newPerson.servings,
        image_src: parsedRecipe.image_src || newPerson.image_src,
        sourceUrl: recipeUrl,
      });
      setShowImportOptions(false);
      setRecipeUrl("");
    } catch (error) {
      setImportError(
        error.message || "Failed to import recipe. Please try again.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromText = () => {
    if (!recipeText.trim()) {
      setImportError("Please paste recipe text");
      return;
    }

    setIsImporting(true);
    setImportError("");

    try {
      const parsedRecipe = parseRecipeFromText(recipeText);
      setNewPerson({
        ...newPerson,
        name: parsedRecipe.name || newPerson.name,
        ingredients: parsedRecipe.ingredients
          ? parsedRecipe.ingredients
              .split(",")
              .map((i) => i.trim())
              .filter((i) => i)
          : newPerson.ingredients,
        instructions: parsedRecipe.instructions
          ? parsedRecipe.instructions
              .split(".")
              .map((i) => i.trim())
              .filter((i) => i)
          : newPerson.instructions,
        prepTime: parsedRecipe.prepTime || newPerson.prepTime,
        cookTime: parsedRecipe.cookTime || newPerson.cookTime,
        servings: parsedRecipe.servings || newPerson.servings,
        image_src: parsedRecipe.image_src || newPerson.image_src,
      });
      setShowImportOptions(false);
      setRecipeText("");
    } catch (error) {
      setImportError(
        error.message || "Failed to parse recipe. Please try again.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal onClose={onCancel}>
      <form className={classes.form} onSubmit={handleSubmit}>
        <h2 className={classes.formTitle}>Add New Recipe</h2>

        {!showImportOptions ? (
          <button
            type="button"
            onClick={() => setShowImportOptions(true)}
            className={classes.importBtn}
          >
            🔗 Import Recipe from Web
          </button>
        ) : (
          <div className={classes.urlImportSection}>
            <div className={classes.importTabs}>
              <button
                type="button"
                className={
                  importMode === "url" ? classes.tabActive : classes.tab
                }
                onClick={() => setImportMode("url")}
              >
                📎 URL
              </button>
              <button
                type="button"
                className={
                  importMode === "text" ? classes.tabActive : classes.tab
                }
                onClick={() => setImportMode("text")}
              >
                📋 Text
              </button>
            </div>

            {importMode === "url" ? (
              <>
                <div className={classes.helpText}>
                  <strong>💡 Paste recipe URL:</strong>
                  <p>
                    Copy the URL from recipe websites like AllRecipes, Food
                    Network, etc.
                  </p>
                </div>
                <input
                  type="url"
                  placeholder="https://www.allrecipes.com/recipe/..."
                  value={recipeUrl}
                  onChange={(e) => setRecipeUrl(e.target.value)}
                  className={classes.urlInput}
                />
                <div className={classes.urlButtons}>
                  <button
                    type="button"
                    onClick={handleImportFromUrl}
                    disabled={isImporting}
                    className={classes.importSubmitBtn}
                  >
                    {isImporting ? "Importing..." : "Import"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportOptions(false);
                      setRecipeUrl("");
                      setImportError("");
                    }}
                    className={classes.importCancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={classes.helpText}>
                  <strong>💡 Paste recipe text:</strong>
                  <p>
                    Select only the recipe part (name, ingredients,
                    instructions) from the website and paste here.
                  </p>
                </div>
                <textarea
                  placeholder="Paste recipe text here...\n\nExample:\nChocolate Cake\nIngredients:\n- 2 cups flour\n- 1 cup sugar\nInstructions:\n1. Mix ingredients\n2. Bake at 180°C"
                  value={recipeText}
                  onChange={(e) => setRecipeText(e.target.value)}
                  className={classes.pasteTextarea}
                  rows="10"
                />
                <div className={classes.urlButtons}>
                  <button
                    type="button"
                    onClick={handleImportFromText}
                    disabled={isImporting}
                    className={classes.importSubmitBtn}
                  >
                    {isImporting ? "Importing..." : "Import"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportOptions(false);
                      setRecipeText("");
                      setImportError("");
                    }}
                    className={classes.importCancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {importError && (
              <p className={classes.errorMessage}>{importError}</p>
            )}
          </div>
        )}

        <div className={classes.divider}></div>
        <input
          type="text"
          placeholder="Recipe Name *"
          value={newPerson.name}
          onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
          required
        />
        <div className={classes.listSection}>
          <div className={classes.listHeader}>
            <h3>📝 Ingredients</h3>
            <Button onClick={handleAddIngredient} title="Add ingredient">
              + Add
            </Button>
          </div>
          <div className={classes.itemsList}>
            {newPerson.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className={`${classes.itemRow} ${draggedIngredientIndex === index ? classes.dragging : ""}`}
                onDragOver={(e) => handleIngredientDragOver(e, index)}
                onDrop={(e) => handleIngredientDrop(e, index)}
              >
                <span
                  className={classes.dragHandle}
                  draggable
                  onDragStart={() => handleIngredientDragStart(index)}
                >
                  <FaGripVertical />
                </span>
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) =>
                    handleIngredientChange(index, e.target.value)
                  }
                  placeholder={`Ingredient ${index + 1}`}
                  className={classes.itemInput}
                />
                <Button
                  onClick={() => handleRemoveIngredient(index)}
                  variant="danger"
                  title="Remove"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className={classes.listSection}>
          <div className={classes.listHeader}>
            <h3>👨‍🍳 Instructions</h3>
            <Button onClick={handleAddInstruction} title="Add instruction">
              + Add
            </Button>
          </div>
          <div className={classes.itemsList}>
            {newPerson.instructions.map((instruction, index) => (
              <div
                key={index}
                className={`${classes.itemRow} ${draggedInstructionIndex === index ? classes.dragging : ""}`}
                onDragOver={(e) => handleInstructionDragOver(e, index)}
                onDrop={(e) => handleInstructionDrop(e, index)}
              >
                <span
                  className={classes.dragHandle}
                  draggable
                  onDragStart={() => handleInstructionDragStart(index)}
                >
                  <FaGripVertical />
                </span>
                <textarea
                  value={instruction}
                  onChange={(e) =>
                    handleInstructionChange(index, e.target.value)
                  }
                  placeholder={`Step ${index + 1}`}
                  className={classes.itemTextarea}
                  rows="2"
                />
                <Button
                  onClick={() => handleRemoveInstruction(index)}
                  variant="danger"
                  title="Remove"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>
        <input
          type="text"
          placeholder="Prep Time (e.g., 15 min)"
          value={newPerson.prepTime}
          onChange={(e) =>
            setNewPerson({ ...newPerson, prepTime: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Cook Time (e.g., 30 min)"
          value={newPerson.cookTime}
          onChange={(e) =>
            setNewPerson({ ...newPerson, cookTime: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Servings"
          value={newPerson.servings}
          onChange={(e) =>
            setNewPerson({ ...newPerson, servings: e.target.value })
          }
          min="1"
        />

        <div className={classes.difficultySection}>
          <label className={classes.difficultyLabel}>Difficulty</label>
          <select
            value={newPerson.difficulty}
            onChange={(e) =>
              setNewPerson({ ...newPerson, difficulty: e.target.value })
            }
            className={classes.difficultySelect}
          >
            <option value="VeryEasy">Very Easy</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className={classes.fieldSection}>
          <label className={classes.fieldLabel}>Source URL</label>
          <input
            type="url"
            placeholder="Source URL (where recipe is from)"
            value={newPerson.sourceUrl}
            onChange={(e) =>
              setNewPerson({ ...newPerson, sourceUrl: e.target.value })
            }
          />
        </div>

        <div className={classes.fieldSection}>
          <label className={classes.fieldLabel}>Image (Optional)</label>
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={newPerson.image_src}
            onChange={(e) =>
              setNewPerson({ ...newPerson, image_src: e.target.value })
            }
          />
          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.9rem", color: "#666" }}>
              Or upload from computer:
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ fontSize: "0.9rem" }}
              disabled={uploadingImage}
            />
            {uploadingImage && (
              <span style={{ fontSize: "0.9rem", color: "#666" }}>
                Uploading...
              </span>
            )}
          </div>
        </div>

        <div className={classes.fieldSection}>
          <label className={classes.fieldLabel}>Notes</label>
          <textarea
            placeholder="Notes (optional - personal comments, tips, modifications)"
            value={newPerson.notes}
            onChange={(e) =>
              setNewPerson({ ...newPerson, notes: e.target.value })
            }
            className={classes.textarea}
            rows="3"
          />
        </div>

        <div className={classes.difficultySection}>
          <label className={classes.difficultyLabel}>Rating</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewPerson({ ...newPerson, rating: star })}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "2rem",
                  cursor: "pointer",
                  color:
                    star <= (newPerson.rating || 0) ? "#ffc107" : "#e0e0e0",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#ffc107")}
                onMouseLeave={(e) =>
                  (e.target.style.color =
                    star <= (newPerson.rating || 0) ? "#ffc107" : "#e0e0e0")
                }
              >
                ★
              </button>
            ))}
            {newPerson.rating > 0 && (
              <button
                type="button"
                onClick={() => setNewPerson({ ...newPerson, rating: 0 })}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  color: "#666",
                  textDecoration: "underline",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <select
          multiple
          value={newPerson.categories}
          onChange={handleGroupChange}
          className={classes.select}
        >
          {groups
            .filter((group) => group.id !== "all")
            .map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
        </select>

        <div className={classes.favoriteToggle}>
          <label className={classes.favoriteLabel}>
            <input
              type="checkbox"
              checked={newPerson.isFavorite}
              onChange={handleFavoriteToggle}
              className={classes.favoriteCheckbox}
            />
            <span className={classes.favoriteText}>
              {newPerson.isFavorite ? "★ Favorite" : "☆ Add to favorites"}
            </span>
          </label>
        </div>

        <div className={classes.formButtons}>
          <button
            type="button"
            onClick={onCancel}
            className={classes.cancelBtn}
          >
            Cancel
          </button>
          <button type="submit" className={classes.submitBtn}>
            Add Recipe
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddRecipe;
