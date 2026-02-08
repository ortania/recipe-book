import { useState, useEffect } from "react";
import { Modal } from "../../modal";
import { Button } from "../../controls/button";
import { FaGripVertical } from "react-icons/fa";
import { useLanguage } from "../../../context";
import classes from "../form.module.css";

function EditRecipe({ person, onSave, onCancel, groups = [] }) {
  const { t } = useLanguage();
  const [editedPerson, setEditedPerson] = useState({
    name: person.name,
    image_src: person.image_src || "",
    ingredients: Array.isArray(person.ingredients)
      ? [...person.ingredients]
      : [],
    instructions: Array.isArray(person.instructions)
      ? [...person.instructions]
      : [],
    prepTime: person.prepTime || "",
    cookTime: person.cookTime || "",
    servings: person.servings || "",
    difficulty: person.difficulty || "Easy",
    sourceUrl: person.sourceUrl || "",
    categories: person.categories || [],
    isFavorite: person.isFavorite || false,
    notes: person.notes || "",
    rating: person.rating || 0,
    nutrition: {
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
      sugars: "",
      note: "",
      ...person.nutrition,
    },
  });

  const [originalServings] = useState(parseInt(person.servings) || 1);
  const [originalNutrition] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    sugars: "",
    note: "",
    ...person.nutrition,
  });
  const [draggedIngredientIndex, setDraggedIngredientIndex] = useState(null);
  const [draggedInstructionIndex, setDraggedInstructionIndex] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const scaleNutritionValue = (text, ratio) => {
    if (!text || typeof text !== "string") return text;
    return text.replace(/(\d+\.?\d*)/g, (match) => {
      const num = parseFloat(match);
      const scaled = num * ratio;
      return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
    });
  };

  const handleServingsChange = (e) => {
    const newServings = e.target.value;
    const newServingsNum = parseInt(newServings);

    if (newServingsNum > 0 && originalServings > 0) {
      const ratio = originalServings / newServingsNum;
      const scaledNutrition = {};
      for (const key of [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugars",
      ]) {
        scaledNutrition[key] = scaleNutritionValue(
          originalNutrition[key],
          ratio,
        );
      }
      scaledNutrition.note = editedPerson.nutrition.note;
      setEditedPerson((prev) => ({
        ...prev,
        servings: newServings,
        nutrition: scaledNutrition,
      }));
    } else {
      setEditedPerson((prev) => ({
        ...prev,
        servings: newServings,
      }));
    }
  };

  useEffect(() => {
    setEditedPerson({
      name: person.name,
      image_src: person.image_src || "",
      ingredients: Array.isArray(person.ingredients)
        ? [...person.ingredients]
        : [],
      instructions: Array.isArray(person.instructions)
        ? [...person.instructions]
        : [],
      prepTime: person.prepTime || "",
      cookTime: person.cookTime || "",
      servings: person.servings || "",
      difficulty: person.difficulty || "Easy",
      sourceUrl: person.sourceUrl || "",
      categories: person.categories || [],
      isFavorite: person.isFavorite || false,
      notes: person.notes || "",
      rating: person.rating || 0,
      nutrition: {
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        fiber: "",
        sugars: "",
        note: "",
        ...person.nutrition,
      },
    });
  }, [person]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedPerson({
      ...editedPerson,
      [name]: type === "checkbox" ? checked : value,
    });
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
            "📸 Image compressed from",
            reader.result.length,
            "to",
            compressedBase64.length,
            "bytes",
          );

          setEditedPerson((prev) => ({
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
    setEditedPerson((prev) => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = value;
      return { ...prev, ingredients: newIngredients };
    });
  };

  const addIngredient = () => {
    setEditedPerson((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ""],
    }));
  };

  const removeIngredient = (index) => {
    setEditedPerson((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleInstructionChange = (index, value) => {
    setEditedPerson((prev) => {
      const newInstructions = [...prev.instructions];
      newInstructions[index] = value;
      return { ...prev, instructions: newInstructions };
    });
  };

  const addInstruction = () => {
    setEditedPerson((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ""],
    }));
  };

  const removeInstruction = (index) => {
    setEditedPerson((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }));
  };

  const toggleFavorite = () => {
    setEditedPerson((prev) => ({
      ...prev,
      isFavorite: !prev.isFavorite,
    }));
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

    const newIngredients = [...editedPerson.ingredients];
    const draggedItem = newIngredients[draggedIngredientIndex];
    newIngredients.splice(draggedIngredientIndex, 1);
    newIngredients.splice(dropIndex, 0, draggedItem);

    setEditedPerson((prev) => ({
      ...prev,
      ingredients: newIngredients,
    }));
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

    const newInstructions = [...editedPerson.instructions];
    const draggedItem = newInstructions[draggedInstructionIndex];
    newInstructions.splice(draggedInstructionIndex, 1);
    newInstructions.splice(dropIndex, 0, draggedItem);

    setEditedPerson((prev) => ({
      ...prev,
      instructions: newInstructions,
    }));
    setDraggedInstructionIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("📝 EDIT FORM - editedPerson.rating:", editedPerson.rating);
    console.log(
      "📝 EDIT FORM - editedPerson.image_src length:",
      editedPerson.image_src?.length,
    );
    console.log(
      "📝 EDIT FORM - image_src starts with:",
      editedPerson.image_src?.substring(0, 50),
    );
    const updatedPerson = {
      ...person,
      name: editedPerson.name,
      image_src: editedPerson.image_src,
      ingredients: editedPerson.ingredients
        .map((i) => i.trim())
        .filter((i) => i),
      instructions: editedPerson.instructions
        .map((i) => i.trim())
        .filter((i) => i),
      prepTime: editedPerson.prepTime,
      cookTime: editedPerson.cookTime,
      servings: parseInt(editedPerson.servings) || 1,
      difficulty: editedPerson.difficulty,
      sourceUrl: editedPerson.sourceUrl,
      categories: editedPerson.categories,
      isFavorite: editedPerson.isFavorite,
      notes: editedPerson.notes,
      rating: editedPerson.rating || 0,
      nutrition: editedPerson.nutrition,
    };
    console.log("📝 EDIT FORM - updatedPerson.rating:", updatedPerson.rating);
    console.log(
      "📝 EDIT FORM - updatedPerson.image_src length:",
      updatedPerson.image_src?.length,
    );
    console.log("📝 EDIT FORM - Full updated person:", updatedPerson);
    onSave(updatedPerson);
  };

  return (
    <Modal onClose={onCancel}>
      <form className={classes.form} onSubmit={handleSubmit}>
        <h2 className={classes.formTitle}>{t("recipes", "editRecipe")}</h2>
        <input
          type="text"
          placeholder={t("recipes", "recipeName")}
          name="name"
          value={editedPerson.name}
          onChange={handleChange}
          required
        />

        <div className={classes.imageSection}>
          <label className={classes.imageLabel}>
            🖼️ {t("recipes", "imageUrl")}
          </label>
          <input
            type="text"
            placeholder="Enter image URL"
            name="image_src"
            value={editedPerson.image_src}
            onChange={handleChange}
          />
          {editedPerson.image_src && (
            <img
              src={editedPerson.image_src}
              alt="Preview"
              className={classes.imagePreview}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
        </div>
        <div className={classes.listSection}>
          <div className={classes.listHeader}>
            <h3>📝 {t("recipes", "ingredients")}</h3>
            <Button onClick={addIngredient} title={t("recipes", "add")}>
              {t("recipes", "add")}
            </Button>
          </div>
          <div className={classes.itemsList}>
            {editedPerson.ingredients.map((ingredient, index) => (
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
                  placeholder={`Ingredient ${index + 1}`}
                  value={ingredient}
                  onChange={(e) =>
                    handleIngredientChange(index, e.target.value)
                  }
                  className={classes.itemInput}
                />
                <Button
                  onClick={() => removeIngredient(index)}
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
            <h3>👨‍🍳 {t("recipes", "instructions")}</h3>
            <Button onClick={addInstruction} title={t("recipes", "add")}>
              {t("recipes", "add")}
            </Button>
          </div>
          <div className={classes.itemsList}>
            {editedPerson.instructions.map((instruction, index) => (
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
                  placeholder={`Step ${index + 1}`}
                  value={instruction}
                  onChange={(e) =>
                    handleInstructionChange(index, e.target.value)
                  }
                  className={classes.itemTextarea}
                  rows="2"
                />
                <Button
                  onClick={() => removeInstruction(index)}
                  variant="danger"
                  title="Remove"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className={classes.difficultySection}>
          <label className={classes.difficultyLabel}>
            ⏱️ {t("recipes", "prepTime")}
          </label>
          <input
            type="text"
            placeholder="e.g., 15 min"
            name="prepTime"
            value={editedPerson.prepTime}
            onChange={handleChange}
            className={classes.difficultySelect}
          />
        </div>

        <div className={classes.difficultySection}>
          <label className={classes.difficultyLabel}>
            🔥 {t("recipes", "cookTime")}
          </label>
          <input
            type="text"
            placeholder="e.g., 30 min"
            name="cookTime"
            value={editedPerson.cookTime}
            onChange={handleChange}
            className={classes.difficultySelect}
          />
        </div>

        <div className={classes.difficultySection}>
          <label className={classes.difficultyLabel}>
            {t("recipes", "servings")}
          </label>
          <input
            type="number"
            placeholder="Number of servings"
            name="servings"
            value={editedPerson.servings}
            onChange={handleServingsChange}
            min="1"
            className={classes.difficultySelect}
          />
        </div>

        <div className={classes.difficultySection}>
          <label className={classes.difficultyLabel}>
            {t("recipes", "difficulty")}
          </label>
          <select
            name="difficulty"
            value={editedPerson.difficulty}
            onChange={handleChange}
            className={classes.difficultySelect}
          >
            <option value="Unknown">{t("difficulty", "Unknown")}</option>
            <option value="VeryEasy">{t("difficulty", "VeryEasy")}</option>
            <option value="Easy">{t("difficulty", "Easy")}</option>
            <option value="Medium">{t("difficulty", "Medium")}</option>
            <option value="Hard">{t("difficulty", "Hard")}</option>
          </select>
        </div>

        <div className={classes.fieldSection}>
          <label className={classes.fieldLabel}>
            {t("recipes", "sourceUrl")}
          </label>
          <input
            type="url"
            placeholder="Source URL (where recipe is from)"
            name="sourceUrl"
            value={editedPerson.sourceUrl}
            onChange={handleChange}
          />
        </div>

        <div className={classes.fieldSection}>
          <label className={classes.fieldLabel}>
            {t("recipes", "imageOptional")}
          </label>
          <input
            type="url"
            placeholder="Image URL (optional)"
            name="image_src"
            value={editedPerson.image_src}
            onChange={handleChange}
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
              {t("recipes", "uploadFromComputer")}
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
                {t("recipes", "uploading")}
              </span>
            )}
          </div>
        </div>

        <div className={classes.fieldSection}>
          <label className={classes.fieldLabel}>{t("recipes", "notes")}</label>
          <textarea
            placeholder="Notes (optional - personal comments, tips, modifications)"
            name="notes"
            value={editedPerson.notes}
            onChange={handleChange}
            className={classes.textarea}
            rows="3"
          />
        </div>

        <div className={classes.nutritionSection}>
          <label className={classes.fieldLabel}>
            🥗 {t("recipes", "nutrition")}
          </label>
          <div className={classes.nutritionGrid}>
            <div className={classes.nutritionField}>
              <label>🔥 {t("recipes", "calories")}</label>
              <input
                type="text"
                placeholder='לדוגמה: כ~150 קק"ל'
                value={editedPerson.nutrition.calories}
                onChange={(e) =>
                  setEditedPerson({
                    ...editedPerson,
                    nutrition: {
                      ...editedPerson.nutrition,
                      calories: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className={classes.nutritionField}>
              <label>🍗 {t("recipes", "protein")}</label>
              <input
                type="text"
                placeholder="לדוגמה: כ~2.5 גרם"
                value={editedPerson.nutrition.protein}
                onChange={(e) =>
                  setEditedPerson({
                    ...editedPerson,
                    nutrition: {
                      ...editedPerson.nutrition,
                      protein: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className={classes.nutritionField}>
              <label>🥑 {t("recipes", "fat")}</label>
              <input
                type="text"
                placeholder="לדוגמה: כ~9-10 גרם"
                value={editedPerson.nutrition.fat}
                onChange={(e) =>
                  setEditedPerson({
                    ...editedPerson,
                    nutrition: {
                      ...editedPerson.nutrition,
                      fat: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className={classes.nutritionField}>
              <label>🍞 {t("recipes", "carbs")}</label>
              <input
                type="text"
                placeholder="לדוגמה: כ~14-15 גרם"
                value={editedPerson.nutrition.carbs}
                onChange={(e) =>
                  setEditedPerson({
                    ...editedPerson,
                    nutrition: {
                      ...editedPerson.nutrition,
                      carbs: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className={classes.nutritionField}>
              <label>🍬 {t("recipes", "sugars")}</label>
              <input
                type="text"
                placeholder="לדוגמה: כ~11-12 גרם"
                value={editedPerson.nutrition.sugars}
                onChange={(e) =>
                  setEditedPerson({
                    ...editedPerson,
                    nutrition: {
                      ...editedPerson.nutrition,
                      sugars: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className={classes.nutritionField}>
              <label>🥬 {t("recipes", "fiber")}</label>
              <input
                type="text"
                placeholder="לדוגמה: כ~0.5-1 גרם"
                value={editedPerson.nutrition.fiber}
                onChange={(e) =>
                  setEditedPerson({
                    ...editedPerson,
                    nutrition: {
                      ...editedPerson.nutrition,
                      fiber: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
          <div className={classes.nutritionNoteField}>
            <label>📝 {t("recipes", "note")}</label>
            <input
              type="text"
              placeholder="לדוגמה: בלי אגוזים/צימוקים"
              value={editedPerson.nutrition.note}
              onChange={(e) =>
                setEditedPerson({
                  ...editedPerson,
                  nutrition: {
                    ...editedPerson.nutrition,
                    note: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>

        <div className={classes.difficultySection}>
          <label className={classes.difficultyLabel}>
            {t("recipes", "rating")}
          </label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() =>
                  setEditedPerson({ ...editedPerson, rating: star })
                }
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "2rem",
                  cursor: "pointer",
                  color:
                    star <= (editedPerson.rating || 0) ? "#ffc107" : "#e0e0e0",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#ffc107")}
                onMouseLeave={(e) =>
                  (e.target.style.color =
                    star <= (editedPerson.rating || 0) ? "#ffc107" : "#e0e0e0")
                }
              >
                ★
              </button>
            ))}
            {editedPerson.rating > 0 && (
              <button
                type="button"
                onClick={() => setEditedPerson({ ...editedPerson, rating: 0 })}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  color: "#666",
                  textDecoration: "underline",
                }}
              >
                {t("recipes", "clear")}
              </button>
            )}
          </div>
        </div>

        <select
          multiple
          value={editedPerson.categories}
          onChange={(e) => {
            const selectedCategories = Array.from(
              e.target.selectedOptions,
              (option) => option.value,
            );
            setEditedPerson({
              ...editedPerson,
              categories: selectedCategories,
            });
          }}
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
              checked={editedPerson.isFavorite}
              onChange={toggleFavorite}
              className={classes.favoriteCheckbox}
            />
            <span className={classes.favoriteText}>
              {editedPerson.isFavorite
                ? t("recipes", "favorite")
                : t("recipes", "addToFavorites")}
            </span>
          </label>
        </div>

        <div className={classes.formButtons}>
          <button
            type="button"
            onClick={onCancel}
            className={classes.cancelBtn}
          >
            {t("recipes", "cancel")}
          </button>
          <button type="submit" className={classes.submitBtn}>
            {t("recipes", "saveChanges")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditRecipe;
