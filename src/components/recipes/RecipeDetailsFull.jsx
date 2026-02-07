import React, { useState, useMemo } from "react";
import classes from "./recipe-details-full.module.css";
import { formatDifficulty } from "./utils";
import { FaRegEdit } from "react-icons/fa";
import { BsTrash3 } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { GiMeal } from "react-icons/gi";
import { IoCopyOutline } from "react-icons/io5";
import { ConfirmDialog } from "../forms/confirm-dialog";
import { CopyRecipeDialog } from "../forms/copy-recipe-dialog";
import { ExportImageButton } from "./export-image-button";

function RecipeDetailsFull({
  recipe,
  onClose,
  onEdit,
  onDelete,
  isAdmin,
  getCategoryName,
  onEnterCookingMode,
  onCopyRecipe,
  currentUserId,
}) {
  // State management
  const [activeTab, setActiveTab] = useState("ingredients");
  const [servings, setServings] = useState(recipe.servings || 4);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [checkedInstructions, setCheckedInstructions] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  const handleCopyClick = () => {
    setShowCopyDialog(true);
  };

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

  const scaleNutrition = (value) => {
    if (!value || servings === originalServings) return value;
    const ratio = servings / originalServings;
    const numberRegex = /(\d+\.?\d*)/g;
    return value.replace(numberRegex, (match) => {
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
      <button onClick={onClose} className={classes.closeButton}>
        ✕
      </button>

      {showCopyDialog && (
        <CopyRecipeDialog
          recipeName={recipe.name}
          currentUserId={currentUserId}
          onCopy={(targetUserId) => onCopyRecipe(recipe, targetUserId)}
          onCancel={() => setShowCopyDialog(false)}
        />
      )}

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

      {isAdmin && (
        <div className={classes.actionBar}>
          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(recipe);
              }}
              className={classes.actionButton}
              title="Edit"
            >
              <FaRegEdit />
              <span>Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              className={`${classes.actionButton} ${classes.actionDelete}`}
              title="Delete"
            >
              <BsTrash3 />
              <span>Delete</span>
            </button>
          )}
          {onCopyRecipe && (
            <button
              onClick={handleCopyClick}
              className={classes.actionButton}
              title="Copy"
            >
              <IoCopyOutline />
              <span>Copy</span>
            </button>
          )}
          <ExportImageButton recipe={recipe} />
        </div>
      )}

      {!isAdmin && (
        <div className={classes.actionBar}>
          <ExportImageButton recipe={recipe} />
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
            <span className={classes.infoItem}>Prep {recipe.prepTime}</span>
          )}
          {recipe.prepTime && recipe.cookTime && (
            <span className={classes.infoDot}>•</span>
          )}
          {recipe.cookTime && (
            <span className={classes.infoItem}>Cook {recipe.cookTime}</span>
          )}
          {(recipe.prepTime || recipe.cookTime) &&
            recipe.difficulty !== "Unknown" && (
              <span className={classes.infoDot}>•</span>
            )}
          {recipe.difficulty && (
            <span className={classes.infoItem}>
              {formatDifficulty(recipe.difficulty)}
            </span>
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

        {recipe.nutrition &&
          Object.entries(recipe.nutrition).some(
            ([k, v]) => v && k !== "note",
          ) && (
            <div className={classes.nutritionSection}>
              <button
                className={classes.nutritionToggle}
                onClick={() => setShowNutrition(!showNutrition)}
                title="ערכים תזונתיים"
              >
                <div className={classes.nutritionTitleWrapper}>
                  <GiMeal className={classes.nutritionIcon} />
                  <span>ערכים תזונתיים</span>
                </div>
                <span className={classes.expandIcon}>
                  {showNutrition ? <MdExpandLess /> : <MdExpandMore />}
                </span>
              </button>
              {showNutrition && (
                <div className={classes.nutritionContent}>
                  <p className={classes.nutritionTitle}>
                    למנה אחת של {recipe.name} (מתוך {servings} מנות
                    {recipe.nutrition.note ? `, ${recipe.nutrition.note}` : ""}
                    ):
                  </p>
                  <ul className={classes.nutritionList}>
                    {recipe.nutrition.calories && (
                      <li>
                        <span className={classes.nutritionEmoji}>🔥</span>{" "}
                        קלוריות: {scaleNutrition(recipe.nutrition.calories)}
                      </li>
                    )}
                    {recipe.nutrition.protein && (
                      <li>
                        <span className={classes.nutritionEmoji}>🍗</span>{" "}
                        חלבון: {scaleNutrition(recipe.nutrition.protein)}
                      </li>
                    )}
                    {recipe.nutrition.fat && (
                      <li>
                        <span className={classes.nutritionEmoji}>🥑</span> שומן:{" "}
                        {scaleNutrition(recipe.nutrition.fat)}
                      </li>
                    )}
                    {recipe.nutrition.carbs && (
                      <li>
                        <span className={classes.nutritionEmoji}>🍞</span>{" "}
                        פחמימות: {scaleNutrition(recipe.nutrition.carbs)}
                      </li>
                    )}
                    {recipe.nutrition.sugars && (
                      <li>
                        <span className={classes.nutritionEmoji}>🍬</span>{" "}
                        סוכרים: {scaleNutrition(recipe.nutrition.sugars)}
                      </li>
                    )}
                    {recipe.nutrition.fiber && (
                      <li>
                        <span className={classes.nutritionEmoji}>🥬</span> סיבים
                        תזונתיים: {scaleNutrition(recipe.nutrition.fiber)}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

        {recipe.notes && (
          <div className={classes.notesSection}>
            <button
              className={classes.notesHeader}
              onClick={() => setNotesExpanded(!notesExpanded)}
            >
              <div className={classes.notesTitleWrapper}>
                <span className={classes.notesIcon}>📝</span>
                <h3 className={classes.notesTitle}>Notes</h3>
              </div>
              <span className={classes.expandIcon}>
                {notesExpanded ? <MdExpandLess /> : <MdExpandMore />}
              </span>
            </button>
            {notesExpanded && (
              <div className={classes.notesContent}>
                <p className={classes.notesText}>{recipe.notes}</p>
              </div>
            )}
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
