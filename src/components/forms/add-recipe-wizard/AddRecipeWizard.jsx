import React, { useState, useRef, useEffect, useCallback } from "react";
import { Modal } from "../../modal";
import { useLanguage } from "../../../context";
import {
  parseRecipeFromUrl,
  parseRecipeFromText,
} from "../../../app/recipeParser";
import {
  extractRecipeFromImage,
  calculateNutrition,
} from "../../../services/openai";
import {
  FiLink,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiCamera,
  FiUpload,
  FiX,
  FiStar,
  FiMenu,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";
import { PiPencilSimpleLineLight } from "react-icons/pi";
import { BsClipboardData, BsCalculator } from "react-icons/bs";
import { MdOutlineEditNote } from "react-icons/md";
import { useTouchDragDrop } from "../../../hooks/useTouchDragDrop";
import useTranslatedList from "../../../hooks/useTranslatedList";
import classes from "./add-recipe-wizard.module.css";
import { CloseButton } from "../../controls";

const INITIAL_RECIPE = {
  name: "",
  ingredients: ["", "", ""],
  instructions: ["", "", ""],
  prepTime: "",
  cookTime: "",
  servings: "",
  difficulty: "Unknown",
  sourceUrl: "",
  image_src: "",
  categories: [],
  isFavorite: false,
  notes: "",
  rating: 0,
  nutrition: {
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    sugars: "",
    note: "",
  },
};

const STEP_LABELS = [
  "basicInfo",
  "ingredients",
  "instructions",
  "imageCategories",
  "nutrition",
  "summary",
];

function AddRecipeWizard({
  onAddPerson,
  onCancel,
  groups = [],
  defaultGroup = null,
  initialScreen = "method",
}) {
  const { t } = useLanguage();
  const { getTranslated: getTranslatedGroup } = useTranslatedList(
    groups,
    "name",
  );
  const [screen, setScreen] = useState(initialScreen); // method | url | text | photo | manual
  const [manualStep, setManualStep] = useState(0);
  const [recipe, setRecipe] = useState({
    ...INITIAL_RECIPE,
    categories: defaultGroup ? [defaultGroup] : [],
  });
  const [recipeUrl, setRecipeUrl] = useState("");
  const [recipeText, setRecipeText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragField, setDragField] = useState(null);
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [showPreview, setShowPreview] = useState(false);
  const [calculatingNutrition, setCalculatingNutrition] = useState(false);
  const [nutritionMessage, setNutritionMessage] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const progressRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const photoFileInputRef = useRef(null);
  const ingredientsListRef = useRef(null);
  const instructionsListRef = useRef(null);

  const handleTouchReorder = useCallback((fromIndex, toIndex, field) => {
    setRecipe((prev) => {
      const items = [...prev[field]];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...prev, [field]: items };
    });
  }, []);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } =
    useTouchDragDrop(handleTouchReorder);

  useEffect(() => {
    const onMove = (e) => handleTouchMove(e);
    const onEnd = (e) => handleTouchEnd(e);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  const updateRecipe = (field, value) => {
    setRecipe((prev) => ({ ...prev, [field]: value }));
  };

  const updateNutrition = (field, value) => {
    setRecipe((prev) => ({
      ...prev,
      nutrition: { ...prev.nutrition, [field]: value },
    }));
  };

  const handleCalculateNutrition = async () => {
    const filledIngredients = recipe.ingredients.filter((i) => i.trim());
    if (filledIngredients.length === 0) {
      setNutritionMessage(t("addWizard", "noIngredientsForNutrition"));
      return;
    }
    setCalculatingNutrition(true);
    setNutritionMessage("");
    try {
      const result = await calculateNutrition(
        filledIngredients,
        recipe.servings,
      );
      if (result && !result.error) {
        setRecipe((prev) => ({
          ...prev,
          nutrition: {
            ...prev.nutrition,
            calories: result.calories || prev.nutrition.calories,
            protein: result.protein || prev.nutrition.protein,
            fat: result.fat || prev.nutrition.fat,
            carbs: result.carbs || prev.nutrition.carbs,
            sugars: result.sugars || prev.nutrition.sugars,
            fiber: result.fiber || prev.nutrition.fiber,
          },
        }));
        setNutritionMessage(t("addWizard", "nutritionCalculated"));
      } else {
        setNutritionMessage(t("addWizard", "nutritionError"));
      }
    } catch (err) {
      console.error("Nutrition calculation failed:", err);
      setNutritionMessage(t("addWizard", "nutritionError"));
    } finally {
      setCalculatingNutrition(false);
    }
  };

  // ========== Import handlers ==========
  const handleImportFromUrl = async () => {
    if (!recipeUrl.trim()) {
      setImportError(t("addWizard", "enterUrl"));
      return;
    }
    setIsImporting(true);
    setImportError("");
    setImportProgress(0);
    progressRef.current = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressRef.current);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 400);
    try {
      const parsed = await parseRecipeFromUrl(recipeUrl);
      setRecipe((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        ingredients: parsed.ingredients
          ? parsed.ingredients
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean)
          : prev.ingredients,
        instructions: parsed.instructions
          ? parsed.instructions
              .split(".")
              .map((i) => i.trim())
              .filter(Boolean)
          : prev.instructions,
        prepTime: parsed.prepTime || prev.prepTime,
        cookTime: parsed.cookTime || prev.cookTime,
        servings: parsed.servings || prev.servings,
        image_src: parsed.image_src || prev.image_src,
        sourceUrl: recipeUrl,
      }));
      setImportProgress(100);
      clearInterval(progressRef.current);
      setScreen("manual");
      setManualStep(0);
    } catch (err) {
      if (err.message && err.message.startsWith("BLOCKED:")) {
        setImportError(t("addWizard", "importBlocked"));
      } else {
        setImportError(t("addWizard", "importFailed"));
      }
    } finally {
      clearInterval(progressRef.current);
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleImportFromText = () => {
    if (!recipeText.trim()) {
      setImportError(t("addWizard", "enterText"));
      return;
    }
    setIsImporting(true);
    setImportError("");
    try {
      const parsed = parseRecipeFromText(recipeText);
      setRecipe((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        ingredients:
          Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0
            ? parsed.ingredients
            : typeof parsed.ingredients === "string" && parsed.ingredients
              ? parsed.ingredients
                  .split(",")
                  .map((i) => i.trim())
                  .filter(Boolean)
              : prev.ingredients,
        instructions:
          Array.isArray(parsed.instructions) && parsed.instructions.length > 0
            ? parsed.instructions
            : typeof parsed.instructions === "string" && parsed.instructions
              ? parsed.instructions
                  .split(".")
                  .map((i) => i.trim())
                  .filter(Boolean)
              : prev.instructions,
        prepTime: parsed.prepTime || prev.prepTime,
        cookTime: parsed.cookTime || prev.cookTime,
        servings: parsed.servings || prev.servings,
        image_src: parsed.image_src || prev.image_src,
      }));
      setScreen("manual");
      setManualStep(0);
    } catch (err) {
      setImportError(t("addWizard", "parseFailed"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    setImportError("");
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const parsed = await extractRecipeFromImage(base64);
      if (parsed.error) {
        setImportError(parsed.error);
        return;
      }
      setRecipe((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        ingredients:
          Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0
            ? parsed.ingredients
            : prev.ingredients,
        instructions:
          Array.isArray(parsed.instructions) && parsed.instructions.length > 0
            ? parsed.instructions
            : prev.instructions,
        prepTime: parsed.prepTime || prev.prepTime,
        cookTime: parsed.cookTime || prev.cookTime,
        servings: parsed.servings || prev.servings,
        notes: parsed.notes || prev.notes,
      }));
      setScreen("manual");
      setManualStep(0);
    } catch (err) {
      setImportError(t("addWizard", "photoFailed"));
    } finally {
      setIsImporting(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  // ========== Image upload ==========
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
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
        let quality = 0.7;
        let compressed = canvas.toDataURL("image/jpeg", quality);
        const maxSize = 800 * 1024;
        while (compressed.length > maxSize && quality > 0.1) {
          quality -= 0.1;
          compressed = canvas.toDataURL("image/jpeg", quality);
        }
        updateRecipe("image_src", compressed);
        setUploadingImage(false);
      };
      img.onerror = () => setUploadingImage(false);
      img.src = reader.result;
    };
    reader.onerror = () => setUploadingImage(false);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ========== Ingredient/Instruction handlers ==========
  const handleIngredientChange = (index, value) => {
    const updated = [...recipe.ingredients];
    updated[index] = value;
    updateRecipe("ingredients", updated);
  };

  const handleAddIngredient = () => {
    updateRecipe("ingredients", [...recipe.ingredients, ""]);
  };

  const handleRemoveIngredient = (index) => {
    updateRecipe(
      "ingredients",
      recipe.ingredients.filter((_, i) => i !== index),
    );
  };

  const handleInstructionChange = (index, value) => {
    const updated = [...recipe.instructions];
    updated[index] = value;
    updateRecipe("instructions", updated);
  };

  const handleAddInstruction = () => {
    updateRecipe("instructions", [...recipe.instructions, ""]);
  };

  const handleRemoveInstruction = (index) => {
    updateRecipe(
      "instructions",
      recipe.instructions.filter((_, i) => i !== index),
    );
  };

  const handleDragStart = (index, field) => {
    setDragIndex(index);
    setDragField(field);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex, field) => {
    if (dragIndex === null || dragField !== field) return;
    const items = [...recipe[field]];
    const [moved] = items.splice(dragIndex, 1);
    items.splice(targetIndex, 0, moved);
    updateRecipe(field, items);
    setDragIndex(null);
    setDragField(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragField(null);
  };

  const handleMoveItem = (index, direction, field) => {
    const items = [...recipe[field]];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    updateRecipe(field, items);
  };

  const toggleCategory = (catId) => {
    setRecipe((prev) => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter((c) => c !== catId)
        : [...prev.categories, catId],
    }));
  };

  // ========== Submit ==========
  const handleSubmit = () => {
    onAddPerson({
      name: recipe.name,
      ingredients: recipe.ingredients.filter(Boolean),
      instructions: recipe.instructions.filter(Boolean),
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings ? parseInt(recipe.servings) : null,
      difficulty: recipe.difficulty,
      sourceUrl: recipe.sourceUrl,
      image_src: recipe.image_src,
      categories: recipe.categories,
      isFavorite: recipe.isFavorite,
      notes: recipe.notes,
      rating: recipe.rating || 0,
      nutrition: recipe.nutrition,
    });
    onCancel();
  };

  // ========== Stepper ==========
  const renderStepper = () => (
    <div>
      <div className={classes.stepperHeader}>
        <h2 className={classes.stepperTitle}>{t("addWizard", "manualAdd")}</h2>
        <span className={classes.stepperCount}>
          {t("addWizard", "stepOf")
            .replace("{current}", manualStep + 1)
            .replace("{total}", 6)}
        </span>
      </div>
      <div className={classes.segmentedBar}>
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={`${classes.segment} ${
              i <= manualStep ? classes.segmentActive : ""
            } ${i === manualStep ? classes.segmentCurrent : ""}`}
            onClick={() => visitedSteps.has(i) && handleStepClick(i)}
            style={{ cursor: visitedSteps.has(i) ? "pointer" : "default" }}
          />
        ))}
      </div>
    </div>
  );

  // ========== Step 1: Basic Info ==========
  const renderBasicInfo = () => (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("addWizard", "basicInfo")}
      </h3>

      <div className={classes.formGroup}>
        <label className={classes.formGroupLabel}>
          {t("recipes", "recipeName")}
          <span>*</span>
        </label>
        <input
          type="text"
          className={classes.formInput}
          placeholder={t("addWizard", "namePlaceholder")}
          value={recipe.name}
          onChange={(e) => updateRecipe("name", e.target.value)}
        />
      </div>

      <div className={classes.formRow}>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("recipes", "servings")}
          </label>
          <input
            type="number"
            className={classes.formInput}
            placeholder="4"
            value={recipe.servings}
            onChange={(e) => updateRecipe("servings", e.target.value)}
            min="1"
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("recipes", "difficulty")}
          </label>
          <select
            className={classes.formSelect}
            value={recipe.difficulty}
            onChange={(e) => updateRecipe("difficulty", e.target.value)}
          >
            <option value="Unknown">{t("difficulty", "Unknown")}</option>
            <option value="VeryEasy">{t("difficulty", "VeryEasy")}</option>
            <option value="Easy">{t("difficulty", "Easy")}</option>
            <option value="Medium">{t("difficulty", "Medium")}</option>
            <option value="Hard">{t("difficulty", "Hard")}</option>
          </select>
        </div>
      </div>

      <div className={classes.formRow}>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("addWizard", "cookTimeMin")}
          </label>
          <input
            type="text"
            className={classes.formInput}
            placeholder="45"
            value={recipe.cookTime}
            onChange={(e) => updateRecipe("cookTime", e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("addWizard", "prepTimeMin")}
          </label>
          <input
            type="text"
            className={classes.formInput}
            placeholder="30"
            value={recipe.prepTime}
            onChange={(e) => updateRecipe("prepTime", e.target.value)}
          />
        </div>
      </div>

      <div className={classes.formGroup}>
        <label className={classes.formGroupLabel}>
          {t("recipes", "notes")}
        </label>
        <textarea
          className={classes.formTextarea}
          placeholder={t("addWizard", "notesPlaceholder")}
          value={recipe.notes}
          onChange={(e) => updateRecipe("notes", e.target.value)}
        />
      </div>

      <div className={classes.formGroup}>
        <label className={classes.formGroupLabel}>
          {t("addWizard", "sourceUrl")}
        </label>
        <input
          type="url"
          className={classes.formInput}
          placeholder="https://..."
          value={recipe.sourceUrl}
          onChange={(e) => updateRecipe("sourceUrl", e.target.value)}
        />
      </div>
    </div>
  );

  // ========== Step 2: Ingredients ==========
  const renderIngredients = () => (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("recipes", "ingredients")}
      </h3>
      <p className={classes.stepSectionSubtitle}>
        {t("addWizard", "ingredientsSubtitle")}
      </p>

      <div className={classes.dynamicList} ref={ingredientsListRef}>
        {recipe.ingredients.map((ing, i) => (
          <div
            key={i}
            data-drag-item
            className={`${classes.dynamicItem} ${dragIndex === i && dragField === "ingredients" ? classes.dragging : ""}`}
            draggable
            onDragStart={() => handleDragStart(i, "ingredients")}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(i, "ingredients")}
            onDragEnd={handleDragEnd}
          >
            <span
              className={classes.dragHandle}
              onTouchStart={(e) =>
                handleTouchStart(e, i, "ingredients", ingredientsListRef)
              }
            >
              <FiMenu size={16} />
            </span>
            <div className={classes.inputBox}>
              <textarea
                className={classes.dynamicItemInput}
                placeholder={`${t("addWizard", "ingredient")} ${i + 1}`}
                value={ing}
                rows={1}
                onChange={(e) => handleIngredientChange(i, e.target.value)}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                ref={(el) => {
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = el.scrollHeight + "px";
                  }
                }}
              />
              {recipe.ingredients.length > 1 && (
                <button
                  type="button"
                  className={classes.removeItemBtn}
                  onClick={() => handleRemoveIngredient(i)}
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          className={classes.addItemBtn}
          onClick={handleAddIngredient}
        >
          + {t("addWizard", "addIngredient")}
        </button>
      </div>
    </div>
  );

  // ========== Step 3: Instructions ==========
  const renderInstructions = () => (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("recipes", "instructions")}
      </h3>
      <p className={classes.stepSectionSubtitle}>
        {t("addWizard", "instructionsSubtitle")}
      </p>

      <div className={classes.dynamicList} ref={instructionsListRef}>
        {recipe.instructions.map((inst, i) => (
          <div
            key={i}
            data-drag-item
            className={`${classes.dynamicItem} ${dragIndex === i && dragField === "instructions" ? classes.dragging : ""}`}
            draggable
            onDragStart={() => handleDragStart(i, "instructions")}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(i, "instructions")}
            onDragEnd={handleDragEnd}
          >
            <span
              className={classes.dragHandle}
              onTouchStart={(e) =>
                handleTouchStart(e, i, "instructions", instructionsListRef)
              }
            >
              <FiMenu size={16} />
            </span>
            <div className={classes.instructionBox}>
              {recipe.instructions.length > 1 && (
                <button
                  type="button"
                  className={classes.instructionRemoveBtn}
                  onClick={() => handleRemoveInstruction(i)}
                >
                  <FiX />
                </button>
              )}
              <div className={classes.instructionContent}>
                <span className={classes.dynamicItemNumber}>{i + 1}.</span>
                <textarea
                  className={classes.dynamicItemTextarea}
                  placeholder={`${t("addWizard", "step")} ${i + 1}...`}
                  value={inst}
                  onChange={(e) => handleInstructionChange(i, e.target.value)}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className={classes.addItemBtn}
          onClick={handleAddInstruction}
        >
          + {t("addWizard", "addStep")}
        </button>
      </div>
    </div>
  );

  // ========== Step 4: Image & Categories ==========
  const renderImageCategories = () => (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("addWizard", "imageCategories")}
      </h3>

      <div className={classes.formGroup}>
        <label className={classes.formGroupLabel}>
          {t("addWizard", "recipeImage")}
        </label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
        {recipe.image_src ? (
          <div className={classes.imageUploadArea}>
            <img
              src={recipe.image_src}
              alt="Preview"
              className={classes.imagePreview}
            />
            <button
              type="button"
              className={classes.imageRemoveBtn}
              onClick={() => updateRecipe("image_src", "")}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className={classes.imageUploadButtons}>
            <button
              type="button"
              className={classes.imageOptionBtn}
              onClick={() => cameraInputRef.current?.click()}
            >
              <FiCamera className={classes.imageOptionIcon} />
              <span>{t("addWizard", "takePhoto")}</span>
            </button>
            <button
              type="button"
              className={classes.imageOptionBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload className={classes.imageOptionIcon} />
              <span>{t("addWizard", "fromFile")}</span>
            </button>
          </div>
        )}
      </div>

      <div className={classes.formGroup}>
        <label className={classes.formGroupLabel}>
          {t("addWizard", "categories")}
        </label>
        <div className={classes.categoryChips}>
          {groups
            .filter((g) => g.id !== "all")
            .map((group) => (
              <button
                key={group.id}
                type="button"
                className={`${classes.categoryChip} ${
                  recipe.categories.includes(group.id)
                    ? classes.categoryChipActive
                    : ""
                }`}
                onClick={() => toggleCategory(group.id)}
              >
                {getTranslatedGroup(group)}
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  // ========== Step 5: Nutrition ==========
  const renderNutrition = () => (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("addWizard", "nutritionValues")}
      </h3>
      <p className={classes.stepSectionSubtitle}>
        {t("addWizard", "nutritionSubtitle")}
      </p>

      <div className={classes.nutritionActions}>
        <button
          type="button"
          className={classes.calculateNutritionBtn}
          onClick={handleCalculateNutrition}
          disabled={calculatingNutrition}
        >
          <BsCalculator className={classes.calculateNutritionIcon} />
          <span>
            {calculatingNutrition
              ? t("addWizard", "calculatingNutrition")
              : recipe.nutrition?.calories
                ? t("addWizard", "updateNutrition")
                : t("addWizard", "calculateNutrition")}
          </span>
        </button>
        {nutritionMessage && (
          <p className={classes.nutritionMessage}>{nutritionMessage}</p>
        )}
      </div>
      <p className={classes.nutritionNote}>
        {t("addWizard", "nutritionAutoUpdateNote")}
      </p>

      <div className={classes.formRow}>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("recipes", "protein")} ({t("addWizard", "grams")})
          </label>
          <input
            type="text"
            className={classes.formInput}
            placeholder="10"
            value={recipe.nutrition.protein}
            onChange={(e) => updateNutrition("protein", e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("recipes", "calories")} (kcal)
          </label>
          <input
            type="text"
            className={classes.formInput}
            placeholder="250"
            value={recipe.nutrition.calories}
            onChange={(e) => updateNutrition("calories", e.target.value)}
          />
        </div>
      </div>

      <div className={classes.formRow}>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("recipes", "fat")} ({t("addWizard", "grams")})
          </label>
          <input
            type="text"
            className={classes.formInput}
            placeholder="5"
            value={recipe.nutrition.fat}
            onChange={(e) => updateNutrition("fat", e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("recipes", "carbs")} ({t("addWizard", "grams")})
          </label>
          <input
            type="text"
            className={classes.formInput}
            placeholder="30"
            value={recipe.nutrition.carbs}
            onChange={(e) => updateNutrition("carbs", e.target.value)}
          />
        </div>
      </div>

      <div className={classes.formRow}>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("addWizard", "sugars")} ({t("addWizard", "grams")})
          </label>
          <input
            type="text"
            className={classes.formInput}
            placeholder="8"
            value={recipe.nutrition.sugars}
            onChange={(e) => updateNutrition("sugars", e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("addWizard", "fiber")} ({t("addWizard", "grams")})
          </label>
          <input
            type="text"
            className={classes.formInput}
            placeholder="3"
            value={recipe.nutrition.fiber}
            onChange={(e) => updateNutrition("fiber", e.target.value)}
          />
        </div>
      </div>

      <div className={classes.formGroup}>
        <label className={classes.formGroupLabel}>
          {t("addWizard", "nutritionNote")}
        </label>
        <textarea
          className={classes.formTextarea}
          placeholder={t("addWizard", "nutritionNotePlaceholder")}
          value={recipe.nutrition.note}
          onChange={(e) => updateNutrition("note", e.target.value)}
        />
      </div>
    </div>
  );

  // ========== Step 6: Summary ==========
  const renderPreview = () => {
    const filledIngredients = recipe.ingredients.filter((i) => i.trim());
    const filledInstructions = recipe.instructions.filter((i) => i.trim());
    return (
      <div className={classes.previewOverlay}>
        <div className={classes.previewCard}>
          <button
            type="button"
            className={classes.previewCloseBtn}
            onClick={() => setShowPreview(false)}
          >
            <FiX size={20} />
          </button>
          {recipe.image_src ? (
            <img
              src={recipe.image_src}
              alt={recipe.name}
              className={classes.previewImage}
            />
          ) : (
            <div style={{ height: "2.5rem" }} />
          )}
          <div className={classes.previewBody}>
            <h3 className={classes.previewName}>{recipe.name || "—"}</h3>
            {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
              <div className={classes.previewMeta}>
                {recipe.prepTime && (
                  <span>
                    ⏱ {recipe.prepTime} {t("addWizard", "min")}
                  </span>
                )}
                {recipe.cookTime && (
                  <span>
                    🔥 {recipe.cookTime} {t("addWizard", "min")}
                  </span>
                )}
                {recipe.servings && (
                  <span>
                    🍽 {recipe.servings} {t("recipes", "servings")}
                  </span>
                )}
              </div>
            )}
            {filledIngredients.length > 0 && (
              <>
                <h4 className={classes.previewSectionTitle}>
                  {t("recipes", "ingredients")}
                </h4>
                <ul className={classes.previewList}>
                  {filledIngredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </>
            )}
            {filledInstructions.length > 0 && (
              <>
                <h4 className={classes.previewSectionTitle}>
                  {t("recipes", "instructions")}
                </h4>
                <ol className={classes.previewList}>
                  {filledInstructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSummary = () => (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("addWizard", "summaryTitle")}
      </h3>
      <p className={classes.stepSectionSubtitle}>
        {t("addWizard", "summarySubtitle")}
      </p>

      <div className={classes.summaryBox}>
        <div className={classes.summaryIcon}>
          <FiCheck size={48} />
        </div>
        <h4 className={classes.summaryTitle}>
          {t("addWizard", "recipeReady")}
        </h4>
        <p className={classes.summaryText}>{t("addWizard", "savePrompt")}</p>
        <button
          type="button"
          className={classes.previewBtn}
          onClick={() => setShowPreview(true)}
        >
          👁 {t("addWizard", "previewRecipe")}
        </button>
      </div>

      {showPreview && renderPreview()}

      <div className={classes.formGroup}>
        <label className={classes.formGroupLabel}>
          {t("addWizard", "rating")}
        </label>
        <div className={classes.starRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`${classes.starBtn} ${star <= recipe.rating ? classes.starBtnActive : ""}`}
              onClick={() =>
                updateRecipe("rating", star === recipe.rating ? 0 : star)
              }
            >
              <FiStar size={24} />
            </button>
          ))}
        </div>
      </div>

      <label className={classes.favoriteToggle}>
        <input
          type="checkbox"
          className={classes.favoriteCheckbox}
          checked={recipe.isFavorite}
          onChange={() => updateRecipe("isFavorite", !recipe.isFavorite)}
        />
        <span className={classes.favoriteLabel}>
          {t(
            "recipes",
            recipe.isFavorite ? "removeFromFavorites" : "addToFavorites",
          )}
        </span>
      </label>
    </div>
  );

  // ========== Manual step navigation ==========
  const renderManualStep = () => {
    switch (manualStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderIngredients();
      case 2:
        return renderInstructions();
      case 3:
        return renderImageCategories();
      case 4:
        return renderNutrition();
      case 5:
        return renderSummary();
      default:
        return null;
    }
  };

  const canProceed = () => {
    if (manualStep === 0) return recipe.name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (manualStep === 5) {
      handleSubmit();
    } else {
      const nextStep = manualStep + 1;
      setManualStep(nextStep);
      setNutritionMessage("");
      setVisitedSteps((prev) => new Set([...prev, nextStep]));
    }
  };

  const handlePrev = () => {
    setManualStep(manualStep - 1);
    setNutritionMessage("");
  };

  const handleStepClick = (stepIndex) => {
    setManualStep(stepIndex);
    setNutritionMessage("");
    setVisitedSteps((prev) => new Set([...prev, stepIndex]));
  };

  // ========== Screens ==========
  const renderMethodSelection = () => (
    <div className={classes.wizardContainer}>
      <button
        type="button"
        className={classes.methodCloseBtn}
        onClick={onCancel}
      >
        <FiX size={22} />
      </button>
      <h1 className={classes.methodTitle}>{t("addWizard", "title")}</h1>
      <p className={classes.methodSubtitle}>{t("addWizard", "subtitle")}</p>

      <div className={classes.methodCards}>
        <div
          className={`${classes.methodCard} ${classes.methodCardUrl}`}
          onClick={() => setScreen("url")}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconUrl}`}>
            <FiLink />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromUrl")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromUrlDesc")}
            </p>
          </div>
          <span className={classes.methodCardArrow}>›</span>
        </div>

        <div
          className={`${classes.methodCard} ${classes.methodCardText}`}
          onClick={() => setScreen("text")}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconText}`}>
            <BsClipboardData />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromText")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromTextDesc")}
            </p>
          </div>
          <span className={classes.methodCardArrow}>›</span>
        </div>

        <div
          className={`${classes.methodCard} ${classes.methodCardPhoto}`}
          onClick={() => setScreen("photo")}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconPhoto}`}>
            <FiCamera />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromPhoto")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromPhotoDesc")}
            </p>
          </div>
          <span className={classes.methodCardArrow}>›</span>
        </div>

        <div
          className={`${classes.methodCard} ${classes.methodCardManual}`}
          onClick={() => {
            setScreen("manual");
            setManualStep(0);
          }}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconManual}`}>
            {/* <MdOutlineEditNote /> */}
            <PiPencilSimpleLineLight />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "manual")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "manualDesc")}
            </p>
          </div>
          <span className={classes.methodCardArrow}>›</span>
        </div>
      </div>
    </div>
  );

  const renderUrlScreen = () => (
    <div className={classes.wizardContainer}>
      <div className={classes.screenTopBar}>
        <button
          type="button"
          className={classes.backLink}
          onClick={() => {
            setScreen("method");
            setImportError("");
          }}
        >
          <FiChevronLeft /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton
          // type="button"
          // className={classes.wizardCloseBtn}
          onClick={onCancel}
        >
          {/* <FiX /> */}
        </CloseButton>
      </div>

      <h2 className={classes.screenTitle}>{t("addWizard", "fromUrlTitle")}</h2>
      <p className={classes.screenSubtitle}>
        {t("addWizard", "fromUrlSubtitle")}
      </p>

      <label className={classes.fieldLabel}>
        {t("addWizard", "recipeLink")}
      </label>
      <input
        type="url"
        className={classes.urlInput}
        placeholder="https://example.com/recipe/chocolate-cake"
        value={recipeUrl}
        onChange={(e) => setRecipeUrl(e.target.value)}
      />

      <div className={classes.tipBox}>
        <span className={classes.tipIcon}>💡</span>
        <span>
          <span className={classes.tipBold}>{t("addWizard", "tip")}:</span>{" "}
          {t("addWizard", "urlTip")}
        </span>
      </div>

      {isImporting && (
        <div className={classes.progressBarContainer}>
          <div
            className={classes.progressBar}
            style={{ width: `${Math.min(importProgress, 100)}%` }}
          />
        </div>
      )}

      {importError && <p className={classes.errorText}>{importError}</p>}

      <button
        className={classes.continueBtn}
        onClick={handleImportFromUrl}
        disabled={isImporting || !recipeUrl.trim()}
      >
        {isImporting ? t("addWizard", "importing") : t("addWizard", "continue")}
        {!isImporting && <FiChevronRight />}
      </button>
    </div>
  );

  const renderTextScreen = () => (
    <div className={classes.wizardContainer}>
      <div className={classes.screenTopBar}>
        <button
          type="button"
          className={classes.backLink}
          onClick={() => {
            setScreen("method");
            setImportError("");
          }}
        >
          <FiChevronLeft /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton
          // type="button"
          // className={classes.wizardCloseBtn}
          onClick={onCancel}
        >
          {/* <FiX /> */}
        </CloseButton>
      </div>

      <h2 className={classes.screenTitle}>{t("addWizard", "fromTextTitle")}</h2>
      <p className={classes.screenSubtitle}>
        {t("addWizard", "fromTextSubtitle")}
      </p>

      <label className={classes.fieldLabel}>
        {t("addWizard", "recipeTextLabel")}
      </label>
      <textarea
        className={classes.textArea}
        placeholder={t("addWizard", "textPlaceholder")}
        value={recipeText}
        onChange={(e) => setRecipeText(e.target.value)}
      />

      <div className={`${classes.tipBox} ${classes.tipBoxPurple}`}>
        <span className={classes.tipIcon}>💡</span>
        <span>
          <span className={classes.tipBold}>{t("addWizard", "tip")}:</span>{" "}
          {t("addWizard", "textTip")}
        </span>
      </div>

      {importError && <p className={classes.errorText}>{importError}</p>}

      <button
        className={classes.continueBtn}
        onClick={handleImportFromText}
        disabled={isImporting || !recipeText.trim()}
      >
        {isImporting
          ? t("addWizard", "importing")
          : t("addWizard", "parseAndImport")}
        {!isImporting && <FiChevronRight />}
      </button>
    </div>
  );

  const renderPhotoScreen = () => (
    <div className={classes.wizardContainer}>
      <div className={classes.screenTopBar}>
        <button
          type="button"
          className={classes.backLink}
          onClick={() => {
            setScreen("method");
            setImportError("");
          }}
        >
          <FiChevronLeft /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton
          // type="button"
          // className={classes.wizardCloseBtn}
          onClick={onCancel}
        >
          {/* <FiX /> */}
        </CloseButton>
      </div>

      <h2 className={classes.screenTitle}>
        {t("addWizard", "fromPhotoTitle")}
      </h2>
      <p className={classes.screenSubtitle}>
        {t("addWizard", "fromPhotoSubtitle")}
      </p>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleImportFromPhoto}
      />
      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImportFromPhoto}
      />

      {isImporting ? (
        <div className={classes.photoUploadArea}>
          <FiCamera className={classes.photoUploadIcon} />
          <span className={classes.photoUploadText}>
            {t("addWizard", "analyzingPhoto")}
          </span>
        </div>
      ) : (
        <div className={classes.imageUploadButtons}>
          <button
            type="button"
            className={classes.imageOptionBtn}
            onClick={() => photoInputRef.current?.click()}
          >
            <FiCamera className={classes.imageOptionIcon} />
            <span>{t("addWizard", "takePhoto")}</span>
          </button>
          <button
            type="button"
            className={classes.imageOptionBtn}
            onClick={() => photoFileInputRef.current?.click()}
          >
            <FiUpload className={classes.imageOptionIcon} />
            <span>{t("addWizard", "fromFile")}</span>
          </button>
        </div>
      )}

      <div className={`${classes.tipBox} ${classes.tipBoxGreen}`}>
        <span className={classes.tipIcon}>📸</span>
        <span>
          <span className={classes.tipBold}>{t("addWizard", "tip")}:</span>{" "}
          {t("addWizard", "photoTip")}
        </span>
      </div>

      {importError && <p className={classes.errorText}>{importError}</p>}
    </div>
  );

  const renderManualScreen = () => (
    <div className={classes.wizardContainer}>
      <div className={classes.screenTopBar}>
        <button
          type="button"
          className={classes.backLink}
          onClick={() => setScreen("method")}
        >
          <FiChevronLeft /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton
          // type="button"
          // className={classes.wizardCloseBtn}
          onClick={onCancel}
        >
          {/* <FiX /> */}
        </CloseButton>
      </div>

      {renderStepper()}
      {renderManualStep()}

      <div className={classes.navButtons}>
        {manualStep > 0 && (
          <button
            type="button"
            className={classes.prevBtn}
            onClick={handlePrev}
          >
            {t("addWizard", "previous")}
          </button>
        )}
        <button
          type="button"
          className={classes.nextBtn}
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {manualStep === 5
            ? t("addWizard", "saveRecipe")
            : t("addWizard", "continue")}
          {/* <FiChevronRight /> */}
        </button>
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case "method":
        return renderMethodSelection();
      case "url":
        return renderUrlScreen();
      case "text":
        return renderTextScreen();
      case "photo":
        return renderPhotoScreen();
      case "manual":
        return renderManualScreen();
      default:
        return renderMethodSelection();
    }
  };

  return (
    <Modal onClose={onCancel} maxWidth="550px">
      {renderScreen()}
    </Modal>
  );
}

export default AddRecipeWizard;
