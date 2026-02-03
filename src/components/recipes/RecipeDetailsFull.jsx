import React, { useState, useMemo } from "react";
import classes from "./recipe-details-full.module.css";
import { formatDifficulty } from "./utils";
import { FaRegEdit } from "react-icons/fa";
import { HiOutlineTrash } from "react-icons/hi2";
import { BsTrash3 } from "react-icons/bs";
import { GoTrash } from "react-icons/go";
import { ConfirmDialog } from "../forms/confirm-dialog";

function RecipeDetailsFull({
  recipe,
  onClose,
  onEdit,
  onDelete,
  isAdmin,
  getCategoryName,
  onEnterCookingMode,
}) {
  // State management
  const [activeTab, setActiveTab] = useState("ingredients");
  const [servings, setServings] = useState(recipe.servings || 4);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [checkedInstructions, setCheckedInstructions] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const originalServings = recipe.servings || 4;

  // Parse ingredients and instructions
  const ingredientsArray = useMemo(() => {
    return Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : recipe.ingredients
          ?.split(",")
          .map((item) => item.trim())
          .filter((item) => item) || [];
  }, [recipe.ingredients]);

  const instructionsArray = useMemo(() => {
    return Array.isArray(recipe.instructions)
      ? recipe.instructions
      : recipe.instructions
          ?.split(".")
          .map((item) => item.trim())
          .filter((item) => item && item.length > 10) || [];
  }, [recipe.instructions]);

  // Toggle functions
  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleInstruction = (index) => {
    setCheckedInstructions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Scale ingredient based on servings
  const scaleIngredient = (ingredient) => {
    if (servings === originalServings) return ingredient;

    const ratio = servings / originalServings;
    const numberRegex = /(\d+\.?\d*|\d*\.\d+|\d+\/\d+)/g;

    return ingredient.replace(numberRegex, (match) => {
      if (match.includes("/")) {
        const [num, denom] = match.split("/").map(Number);
        const scaled = (num / denom) * ratio;
        if (scaled === 0.5) return "1/2";
        if (scaled === 0.25) return "1/4";
        if (scaled === 0.75) return "3/4";
        if (scaled === 0.33 || scaled === 0.34) return "1/3";
        if (scaled === 0.67 || scaled === 0.66) return "2/3";
        return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
      }

      const num = parseFloat(match);
      const scaled = num * ratio;
      return scaled % 1 === 0
        ? scaled.toString()
        : scaled.toFixed(1).replace(/\.0$/, "");
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      await onDelete(recipe.id);
      onClose();
    }
  };

  return (
    <div className={classes.recipeCard}>
      <div className={classes.headerButtons}>
        <button onClick={onClose} className={classes.closeButton}>
          ✕
        </button>
        {isAdmin && (
          <div className={classes.adminButtons}>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(recipe);
                }}
                className={classes.editButton}
              >
                <FaRegEdit title="Edit" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className={classes.deleteButton}
              >
                <BsTrash3 title="Delete" />
              </button>
            )}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          message={`האם אתה בטוח שברצונך למחוק את המתכון "${recipe.name}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {recipe.image_src && (
        <div className={classes.imageContainer}>
          <img
            src={recipe.image_src}
            alt={recipe.name}
            className={classes.recipeImage}
          />
        </div>
      )}

      <div className={classes.recipeContent}>
        <h2 className={classes.recipeName}>{recipe.name}</h2>

        {recipe.rating > 0 && (
          <div className={classes.rating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                style={{
                  color: star <= recipe.rating ? "#ffc107" : "#e0e0e0",
                  fontSize: "1.5rem",
                }}
              >
                ★
              </span>
            ))}
          </div>
        )}

        <div className={classes.recipeInfo}>
          {recipe.prepTime && (
            <span className={classes.infoItem}>{recipe.prepTime}</span>
          )}
          {recipe.cookTime && <span className={classes.infoDot}>•</span>}
          {recipe.cookTime && (
            <span className={classes.infoItem}>{recipe.cookTime}</span>
          )}
          {recipe.difficulty && (
            <>
              <span className={classes.infoDot}>•</span>
              <span className={classes.infoItem}>
                {formatDifficulty(recipe.difficulty)}
              </span>
            </>
          )}
        </div>

        {recipe.categories && recipe.categories.length > 0 && (
          <div className={classes.categoryTags}>
            {recipe.categories.map((cat, idx) => (
              <span key={idx} className={classes.categoryTag}>
                {getCategoryName(cat)}
              </span>
            ))}
          </div>
        )}

        {recipe.sourceUrl && (
          <div className={classes.sourceUrl}>
            <span className={classes.sourceLabel}>Source:</span>
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.sourceLink}
            >
              {recipe.sourceUrl}
            </a>
          </div>
        )}

        {recipe.notes && (
          <div className={classes.notesSection}>
            <h3 className={classes.notesTitle}>📝 Notes</h3>
            <p className={classes.notesText}>{recipe.notes}</p>
          </div>
        )}

        {recipe.servings && (
          <div className={classes.servingSelector}>
            <div className={classes.servingControls}>
              <button
                className={classes.servingButton}
                onClick={() => setServings(servings + 1)}
              >
                +
              </button>
              <span>{servings}</span>
              <button
                className={classes.servingButton}
                onClick={() => setServings(Math.max(1, servings - 1))}
              >
                -
              </button>
            </div>
            <span className={classes.servingLabel}>Serving {servings}</span>
          </div>
        )}

        <div className={classes.tabs}>
          <button
            className={`${classes.tab} ${activeTab === "ingredients" ? classes.activeTab : ""}`}
            onClick={() => setActiveTab("ingredients")}
          >
            Ingredients
          </button>
          <button
            className={`${classes.tab} ${activeTab === "instructions" ? classes.activeTab : ""}`}
            onClick={() => setActiveTab("instructions")}
          >
            Instructions
          </button>
          <button
            className={classes.tab}
            onClick={onEnterCookingMode}
            style={{ marginLeft: "auto" }}
          >
            👨‍🍳 Cooking Mode
          </button>
        </div>

        <div className={classes.tabContent}>
          {activeTab === "ingredients" && (
            <ul className={classes.ingredientsList}>
              {ingredientsArray.length > 0 ? (
                ingredientsArray.map((ingredient, index) => (
                  <li key={index} className={classes.ingredientItem}>
                    <label className={classes.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={checkedIngredients[index] || false}
                        onChange={() => toggleIngredient(index)}
                        className={classes.checkbox}
                      />
                      <span
                        className={
                          checkedIngredients[index] ? classes.checkedText : ""
                        }
                      >
                        {scaleIngredient(ingredient)}
                      </span>
                    </label>
                  </li>
                ))
              ) : (
                <p>No ingredients listed</p>
              )}
            </ul>
          )}

          {activeTab === "instructions" && (
            <ol className={classes.instructionsList}>
              {instructionsArray.length > 0 ? (
                instructionsArray.map((instruction, index) => (
                  <li key={index} className={classes.instructionItem}>
                    <label className={classes.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={checkedInstructions[index] || false}
                        onChange={() => toggleInstruction(index)}
                        className={classes.checkbox}
                      />
                      <span
                        className={
                          checkedInstructions[index] ? classes.checkedText : ""
                        }
                      >
                        {instruction}
                      </span>
                    </label>
                  </li>
                ))
              ) : (
                <p>No instructions provided</p>
              )}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeDetailsFull;
