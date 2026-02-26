import React, { useState, useRef, useEffect, useCallback } from "react";
import { Modal } from "../../modal";
import { useLanguage, useRecipeBook } from "../../../context";
import { uploadRecipeImage } from "../../../firebase/imageService";
import {
  parseRecipeFromUrl,
  parseRecipeFromText,
} from "../../../app/recipeParser";
import {
  extractRecipeFromImage,
  calculateNutrition,
  clearNutritionCache,
  parseFreeSpeechRecipe,
} from "../../../services/openai";
import {
  Link,
  ChevronLeft,
  ChevronRight,
  Check,
  Camera,
  Upload,
  X,
  Star,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Globe,
  HelpCircle,
  Mic,
  Heart,
  Pencil,
  FilePenLine,
  ClipboardList,
  Eye,
  Clock,
  Flame,
  Utensils,
  Lightbulb,
  Info,
  Loader2,
} from "lucide-react";
import { useTouchDragDrop } from "../../../hooks/useTouchDragDrop";
import useTranslatedList from "../../../hooks/useTranslatedList";
import classes from "./add-recipe-wizard.module.css";
import { CloseButton } from "../../controls";
import { formatTime } from "../../recipes/utils";
import {
  isGroupHeader,
  getGroupName,
  makeGroupHeader,
  ingredientsOnly,
  parseIngredients,
  expandGroupHeadersInIngredients,
  stripTrailingSectionHeaderFromName,
} from "../../../utils/ingredientUtils";

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
  shareToGlobal: false,
  nutrition: {
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    sugars: "",
    sodium: "",
    calcium: "",
    iron: "",
    cholesterol: "",
    saturatedFat: "",
    note: "",
  },
};

const STEP_LABELS = [
  "basicInfo",
  "ingredients",
  "instructions",
  "imageCategories",
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
  const { currentUser } = useRecipeBook();
  const { getTranslated: getTranslatedGroup } = useTranslatedList(
    groups,
    "name",
  );
  const [screen, setScreen] = useState(initialScreen); // method | url | text | photo | manual | recording
  const [cameFromRecording, setCameFromRecording] = useState(false);
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState("");
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const accumulatedTextRef = useRef("");
  const recordingTextRef = useRef("");
  const [dragIndex, setDragIndex] = useState(null);
  const [dragField, setDragField] = useState(null);
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [showPreview, setShowPreview] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const progressRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const photoFileInputRef = useRef(null);
  const ingredientsListRef = useRef(null);
  const instructionsListRef = useRef(null);

  const handleClose = useCallback(() => {
    onCancel(
      screen === "recording" || cameFromRecording ? "recording" : undefined,
    );
  }, [onCancel, screen, cameFromRecording]);

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
              .split("\n")
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

  const killRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {
        /* already stopped */
      }
      recognitionRef.current = null;
    }
  };

  const startRecognitionSession = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    killRecognition();

    const recognition = new SR();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    recognition.continuous = !isMobile;
    recognition.interimResults = true;
    recognition.lang = "he-IL";
    recognition.maxAlternatives = 1;

    let sessionFinal = "";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + " ";
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      sessionFinal = finalText;
      const displayed = accumulatedTextRef.current + finalText + interimText;
      recordingTextRef.current = displayed;
      setRecordingText(displayed);
    };

    recognition.onend = () => {
      if (sessionFinal) {
        accumulatedTextRef.current += sessionFinal;
        sessionFinal = "";
      }
      if (isRecordingRef.current) {
        setTimeout(
          () => {
            if (isRecordingRef.current) {
              startRecognitionSession();
            }
          },
          isMobile ? 300 : 100,
        );
      }
    };

    recognition.onerror = (event) => {
      console.error("Recording error:", event.error);
      if (event.error === "not-allowed") {
        isRecordingRef.current = false;
        setIsRecording(false);
        setImportError(t("addWizard", "noSpeechSupport"));
        return;
      }
      if (event.error === "no-speech" || event.error === "aborted") return;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      recognitionRef.current = null;
      setTimeout(() => {
        if (isRecordingRef.current) {
          startRecognitionSession();
        }
      }, 500);
    }
  };

  const handleStartRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setImportError(t("addWizard", "noSpeechSupport"));
      return;
    }
    accumulatedTextRef.current = accumulatedTextRef.current || "";
    recordingTextRef.current = accumulatedTextRef.current;
    isRecordingRef.current = true;
    setIsRecording(true);
    setImportError("");
    startRecognitionSession();
  };

  const handleStopRecording = () => {
    isRecordingRef.current = false;
    killRecognition();
    setIsRecording(false);
    const text =
      recordingTextRef.current?.trim() || accumulatedTextRef.current?.trim();
    if (text) {
      setRecipeText(text);
      setRecordingText(text);
      recordingTextRef.current = text;
      accumulatedTextRef.current = text;
    }
  };

  const matchDifficulty = (spoken) => {
    if (!spoken) return null;
    const low = spoken.trim().toLowerCase();
    const map = {
      "קל מאוד": "VeryEasy",
      "very easy": "VeryEasy",
      veryeasy: "VeryEasy",
      קל: "Easy",
      easy: "Easy",
      בינוני: "Medium",
      medium: "Medium",
      קשה: "Hard",
      hard: "Hard",
    };
    for (const [key, val] of Object.entries(map)) {
      if (low.includes(key)) return val;
    }
    return null;
  };

  const matchCategories = (spoken) => {
    if (!spoken || groups.length === 0) return [];
    const low = spoken.trim().toLowerCase();
    const matched = [];
    for (const g of groups) {
      if (g.id === "all") continue;
      const gName = (g.name || "").toLowerCase();
      if (gName && low.includes(gName)) matched.push(g.id);
    }
    return matched;
  };

  const doImportFromRecording = () => {
    const text =
      recordingText.trim() ||
      recordingTextRef.current?.trim() ||
      accumulatedTextRef.current?.trim();
    if (!text) {
      setImportError(t("addWizard", "noRecordingText"));
      return;
    }
    setRecipeText(text);
    setRecordingText(text);
    setIsImporting(true);
    setImportError("");
    try {
      const parsed = parseRecipeFromText(text);
      const diff = matchDifficulty(parsed.difficulty);
      const cats = matchCategories(parsed.category);
      const rawIngredients =
        Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0
          ? parsed.ingredients
          : typeof parsed.ingredients === "string" && parsed.ingredients
            ? parsed.ingredients
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean)
            : null;
      const { name: nameAfterStrip, header: firstGroupHeader } =
        stripTrailingSectionHeaderFromName(parsed.name || "");
      const ingredientsToExpand =
        rawIngredients !== null && rawIngredients.length > 0
          ? firstGroupHeader
            ? [makeGroupHeader(firstGroupHeader), ...rawIngredients]
            : rawIngredients
          : null;
      setRecipe((prev) => ({
        ...prev,
        name: nameAfterStrip || parsed.name || prev.name,
        ingredients:
          ingredientsToExpand !== null && ingredientsToExpand.length > 0
            ? expandGroupHeadersInIngredients(ingredientsToExpand)
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
        difficulty: diff || prev.difficulty,
        categories:
          cats.length > 0
            ? [...new Set([...prev.categories, ...cats])]
            : prev.categories,
      }));
      setCameFromRecording(true);
      setScreen("manual");
      setManualStep(0);
    } catch (err) {
      setImportError(t("addWizard", "parseFailed"));
    } finally {
      setIsImporting(false);
    }
  };

  const doImportWithAI = async () => {
    const text =
      recordingText.trim() ||
      recordingTextRef.current?.trim() ||
      accumulatedTextRef.current?.trim();
    if (!text) {
      setImportError(t("addWizard", "noRecordingText"));
      return;
    }
    setRecipeText(text);
    setRecordingText(text);
    setIsImporting(true);
    setImportError("");
    try {
      const categoryNames = groups
        .filter((g) => g.id !== "all")
        .map((g) => g.name)
        .filter(Boolean);
      const parsed = await parseFreeSpeechRecipe(text, categoryNames);
      if (parsed.error) {
        setImportError(parsed.error);
        return;
      }
      const diff = matchDifficulty(parsed.difficulty);
      const cats = matchCategories(parsed.category);
      const ingredientsFromParse = Array.isArray(parsed.ingredients)
        ? parsed.ingredients
        : typeof parsed.ingredients === "string" && parsed.ingredients.trim()
          ? parsed.ingredients
              .replace(/\r\n/g, "\n")
              .split(/\n/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const instructionsFromParse = Array.isArray(parsed.instructions)
        ? parsed.instructions
        : typeof parsed.instructions === "string" && parsed.instructions.trim()
          ? parsed.instructions
              .split(/[.\n]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      setRecipe((prev) => ({
        ...prev,
        name: parsed.name?.trim() || prev.name,
        ingredients:
          ingredientsFromParse.length > 0
            ? ingredientsFromParse
            : prev.ingredients,
        instructions:
          instructionsFromParse.length > 0
            ? instructionsFromParse
            : prev.instructions,
        prepTime: parsed.prepTime ? `${parsed.prepTime}min` : prev.prepTime,
        cookTime: parsed.cookTime ? `${parsed.cookTime}min` : prev.cookTime,
        servings: parsed.servings || prev.servings,
        image_src: parsed.image_src || prev.image_src,
        difficulty: diff || prev.difficulty,
        categories:
          cats.length > 0
            ? [...new Set([...prev.categories, ...cats])]
            : prev.categories,
      }));
      setCameFromRecording(true);
      setScreen("manual");
      setManualStep(0);
    } catch (err) {
      setImportError(err.message || t("addWizard", "parseFailed"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromRecording = () => {
    doImportFromRecording();
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

  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // ========== Image upload ==========
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const userId = currentUser?.uid;
      const url = await uploadRecipeImage(userId, null, file);
      updateRecipe("image_src", url);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
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

  const handleAddIngredientGroup = () => {
    updateRecipe("ingredients", [
      ...recipe.ingredients,
      makeGroupHeader(""),
      "",
    ]);
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
  const [saving, setSaving] = useState(false);
  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    const filledAll = recipe.ingredients.filter(Boolean);
    const filledIngredients = ingredientsOnly(filledAll);
    let nutrition = recipe.nutrition || {};
    if (filledIngredients.length > 0) {
      try {
        clearNutritionCache();
        const result = await calculateNutrition(
          filledIngredients,
          recipe.servings,
        );
        if (result && !result.error) {
          nutrition = {
            ...nutrition,
            calories: result.calories ?? nutrition.calories,
            protein: result.protein ?? nutrition.protein,
            fat: result.fat ?? nutrition.fat,
            carbs: result.carbs ?? nutrition.carbs,
            sugars: result.sugars ?? nutrition.sugars,
            fiber: result.fiber ?? nutrition.fiber,
            sodium: result.sodium ?? nutrition.sodium,
            calcium: result.calcium ?? nutrition.calcium,
            iron: result.iron ?? nutrition.iron,
            cholesterol: result.cholesterol ?? nutrition.cholesterol,
            saturatedFat: result.saturatedFat ?? nutrition.saturatedFat,
          };
        } else {
          console.warn("Nutrition calculation returned error:", result?.error);
        }
      } catch (err) {
        console.error("Nutrition calculation failed:", err);
      }
    }
    const newRecipe = {
      name: recipe.name,
      ingredients: filledAll,
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
      shareToGlobal: recipe.shareToGlobal,
      nutrition,
    };
    console.log(
      "🍎 NUTRITION - Saving new recipe with nutrition:",
      newRecipe.nutrition,
    );
    try {
      await onAddPerson(newRecipe);
    } catch (err) {
      console.error("🍎 NUTRITION - Failed to save recipe:", err);
    }
    setSaving(false);
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
            .replace("{total}", 5)}
        </span>
      </div>
      <div className={classes.segmentedBar}>
        {STEP_LABELS.map((_, i) => {
          const canClick =
            i <= manualStep || visitedSteps.has(i) || canNavigateToStep(i);
          return (
            <div
              key={i}
              className={`${classes.segment} ${
                i <= manualStep ? classes.segmentActive : ""
              } ${i === manualStep ? classes.segmentCurrent : ""} ${
                canClick ? classes.segmentClickable : ""
              }`}
              onClick={() => canClick && handleStepClick(i)}
            />
          );
        })}
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
            type="number"
            inputMode="numeric"
            min="0"
            className={classes.formInput}
            placeholder="45"
            value={recipe.cookTime}
            onChange={(e) =>
              updateRecipe("cookTime", e.target.value.replace(/[^0-9]/g, ""))
            }
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.formGroupLabel}>
            {t("addWizard", "prepTimeMin")}
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            className={classes.formInput}
            placeholder="30"
            value={recipe.prepTime}
            onChange={(e) =>
              updateRecipe("prepTime", e.target.value.replace(/[^0-9]/g, ""))
            }
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
  // Parse ingredients box: APPEND only – do not replace existing ingredients (user request).
  const [parseIngredientsPaste, setParseIngredientsPaste] = useState("");
  const [parseIngredientsOpen, setParseIngredientsOpen] = useState(false);
  const [parseIngredientsHelpOpen, setParseIngredientsHelpOpen] =
    useState(false);
  const applyParsedIngredients = () => {
    const text = parseIngredientsPaste.trim();
    if (!text) return;
    const parsed = parseIngredients({ ingredients: text });
    if (parsed.length > 0) {
      const existing = recipe.ingredients.filter(Boolean);
      updateRecipe("ingredients", [...existing, ...parsed]);
      setParseIngredientsPaste("");
    }
  };

  const renderIngredients = () => {
    let ingredientCounter = 0;
    return (
      <div className={classes.stepContent}>
        <h3 className={classes.stepSectionTitle}>
          {t("recipes", "ingredients")}
        </h3>
        <p className={classes.stepSectionSubtitle}>
          {t("addWizard", "ingredientsSubtitle")}
        </p>

        <div className={classes.dynamicList} ref={ingredientsListRef}>
          {recipe.ingredients.map((ing, i) => {
            const isGroup = isGroupHeader(ing);
            if (!isGroup) ingredientCounter++;
            return (
              <div
                key={i}
                data-drag-item
                className={`${isGroup ? classes.groupItem : classes.dynamicItem} ${dragIndex === i && dragField === "ingredients" ? classes.dragging : ""}`}
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
                  <GripVertical size={16} />
                </span>
                {isGroup ? (
                  <div className={classes.groupInputBox}>
                    <input
                      className={classes.groupInput}
                      placeholder={t("addWizard", "groupPlaceholder")}
                      value={getGroupName(ing)}
                      onChange={(e) =>
                        handleIngredientChange(
                          i,
                          makeGroupHeader(e.target.value),
                        )
                      }
                    />
                    <button
                      type="button"
                      className={classes.removeItemBtn}
                      onClick={() => handleRemoveIngredient(i)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className={classes.inputBox}>
                    <textarea
                      className={classes.dynamicItemInput}
                      placeholder={`${t("addWizard", "ingredient")} ${ingredientCounter}`}
                      value={ing}
                      rows={1}
                      onChange={(e) =>
                        handleIngredientChange(i, e.target.value)
                      }
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
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className={classes.addItemRow}>
            <button
              type="button"
              className={classes.addItemBtn}
              onClick={handleAddIngredient}
            >
              + {t("addWizard", "addIngredient")}
            </button>
            <button
              type="button"
              className={classes.addGroupBtn}
              onClick={handleAddIngredientGroup}
            >
              + {t("addWizard", "addGroup")}
            </button>
          </div>

          {/* Parse ingredients: collapsible; APPEND only. Help icon shows explanation. */}
          <div className={classes.parseIngredientsBox}>
            <div
              className={classes.parseIngredientsHeader}
              role="button"
              tabIndex={0}
              onClick={() => setParseIngredientsOpen((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setParseIngredientsOpen((o) => !o);
                }
              }}
              aria-expanded={parseIngredientsOpen}
            >
              <span className={classes.parseIngredientsTitle}>
                {t("addWizard", "parseIngredientsTitle")}
              </span>
              <span className={classes.parseIngredientsHeaderIcons}>
                <button
                  type="button"
                  className={classes.parseIngredientsHelpBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setParseIngredientsHelpOpen((h) => !h);
                  }}
                  title={t("addWizard", "parseIngredientsWhenToUse")}
                  aria-label={t("addWizard", "parseIngredientsHelpLabel")}
                >
                  <HelpCircle size={18} />
                </button>
                {parseIngredientsOpen ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </span>
            </div>
            {parseIngredientsHelpOpen && (
              <div
                className={classes.parseIngredientsHelpPopover}
                role="region"
                aria-label={t("addWizard", "parseIngredientsHelpLabel")}
              >
                <button
                  type="button"
                  className={classes.parseIngredientsHelpClose}
                  onClick={(e) => {
                    e.stopPropagation();
                    setParseIngredientsHelpOpen(false);
                  }}
                  aria-label={t("common", "close")}
                >
                  <X size={18} />
                </button>
                <div className={classes.parseIngredientsHelpBody}>
                  {t("addWizard", "parseIngredientsHelpText")
                    .split("\n")
                    .filter(Boolean)
                    .map((line, i) => {
                      const colon = line.indexOf(":");
                      const label = colon >= 0 ? line.slice(0, colon + 1) : "";
                      const rest =
                        colon >= 0 ? line.slice(colon + 1).trim() : line;
                      return (
                        <div
                          key={i}
                          className={classes.parseIngredientsHelpBlock}
                        >
                          {label && (
                            <span className={classes.parseIngredientsHelpLabel}>
                              {label}
                            </span>
                          )}
                          {(rest || !label) && (
                            <span
                              className={classes.parseIngredientsHelpContent}
                            >
                              {rest || line}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            {parseIngredientsOpen && (
              <>
                <label className={classes.parseIngredientsExampleLabel}>
                  {t("addWizard", "parseIngredientsExampleLabel")}
                </label>
                <textarea
                  className={classes.parseIngredientsTextarea}
                  placeholder={t("addWizard", "parseIngredientsPlaceholder")}
                  value={parseIngredientsPaste}
                  onChange={(e) => setParseIngredientsPaste(e.target.value)}
                  rows={5}
                />
                <div className={classes.parseIngredientsActions}>
                  <button
                    type="button"
                    className={classes.parseIngredientsApplyBtn}
                    onClick={applyParsedIngredients}
                    disabled={!parseIngredientsPaste.trim()}
                  >
                    {t("addWizard", "parseIngredientsApply")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

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
              <GripVertical size={16} />
            </span>
            <div className={classes.instructionBox}>
              {recipe.instructions.length > 1 && (
                <button
                  type="button"
                  className={classes.instructionRemoveBtn}
                  onClick={() => handleRemoveInstruction(i)}
                >
                  <X size={16} />
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
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className={classes.imageUploadButtons}>
            {isMobileDevice && (
              <button
                type="button"
                className={classes.imageOptionBtn}
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className={classes.imageOptionIcon} />
                <span>{t("addWizard", "takePhoto")}</span>
              </button>
            )}
            <button
              type="button"
              className={classes.imageOptionBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={classes.imageOptionIcon} />
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

  // ========== Step 5: Summary ==========
  const renderPreview = () => {
    const filledIngredients = recipe.ingredients.filter((i) => i.trim());
    const filledInstructions = recipe.instructions.filter((i) => i.trim());
    return (
      <div className={classes.previewOverlay}>
        <div className={classes.previewCard}>
          {/* <button
            type="button"
            className={classes.previewCloseBtn}
            onClick={() => setShowPreview(false)}
          >
            <X size={25} />
          </button> */}
          <CloseButton
            type="button"
            className={classes.previewCloseBtn}
            onClick={() => setShowPreview(false)}
          >
            {/* <X size={25} /> */}
          </CloseButton>
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
                    <Clock size={14} />{" "}
                    {formatTime(recipe.prepTime, t("recipes", "minutes"))}
                  </span>
                )}
                {recipe.cookTime && (
                  <span>
                    <Flame size={14} />{" "}
                    {formatTime(recipe.cookTime, t("recipes", "minutes"))}
                  </span>
                )}
                {recipe.servings && (
                  <span>
                    <Utensils size={14} /> {recipe.servings}{" "}
                    {t("recipes", "servings")}
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
                  {filledIngredients.map((ing, i) =>
                    isGroupHeader(ing) ? (
                      <li key={i} className={classes.previewGroupHeader}>
                        {getGroupName(ing)}
                      </li>
                    ) : (
                      <li key={i}>{ing}</li>
                    ),
                  )}
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
          <Check size={48} />
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
          <Eye size={16} /> {t("addWizard", "previewRecipe")}
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
              <Star size={24} />
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
        <Heart size={16} />
        <span className={classes.favoriteLabel}>
          {t(
            "recipes",
            recipe.isFavorite ? "removeFromFavorites" : "addToFavorites",
          )}
        </span>
      </label>

      <label className={classes.favoriteToggle}>
        <input
          type="checkbox"
          className={classes.favoriteCheckbox}
          checked={recipe.shareToGlobal}
          onChange={() => updateRecipe("shareToGlobal", !recipe.shareToGlobal)}
        />
        <Globe size={16} />
        <span className={classes.favoriteLabel}>
          {t("recipes", "shareToGlobal")}
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
        return renderSummary();
      default:
        return null;
    }
  };

  const canProceed = () => {
    if (manualStep === 0) return recipe.name.trim().length > 0;
    return true;
  };

  const canNavigateToStep = (targetStep) => {
    for (let s = 0; s < targetStep; s++) {
      if (s === 0 && recipe.name.trim().length === 0) return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (manualStep === 4) {
      await handleSubmit();
    } else {
      const nextStep = manualStep + 1;
      setManualStep(nextStep);
      setVisitedSteps((prev) => new Set([...prev, nextStep]));
    }
  };

  const handlePrev = () => {
    setManualStep(manualStep - 1);
  };

  const handleStepClick = (stepIndex) => {
    setManualStep(stepIndex);
    setVisitedSteps((prev) => new Set([...prev, stepIndex]));
  };

  // ========== Screens ==========
  const renderMethodSelection = () => (
    <div className={classes.wizardContainer}>
      {/* <button
        type="button"
        className={classes.methodCloseBtn}
        onClick={handleClose}
      >
        <X size={22} />
      </button> */}
      <CloseButton className={classes.methodCloseBtn} onClick={handleClose} />

      <h1 className={classes.methodTitle}>{t("addWizard", "title")}</h1>
      <p className={classes.methodSubtitle}>{t("addWizard", "subtitle")}</p>

      <div className={classes.methodCards}>
        <div
          className={`${classes.methodCard} ${classes.methodCardPhoto}`}
          onClick={() => setScreen("photo")}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconPhoto}`}>
            <Camera size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromPhoto")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromPhotoDesc")}
            </p>
          </div>
          {/* <span className={classes.methodCardArrow}>›</span> */}
        </div>
        <div
          className={`${classes.methodCard} ${classes.methodCardUrl}`}
          onClick={() => setScreen("url")}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconUrl}`}>
            <Link size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromUrl")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromUrlDesc")}
            </p>
          </div>
          {/* <span className={classes.methodCardArrow}>›</span> */}
        </div>

        <div
          className={`${classes.methodCard} ${classes.methodCardText}`}
          onClick={() => setScreen("text")}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconText}`}>
            <ClipboardList size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromText")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromTextDesc")}
            </p>
          </div>
          {/* <span className={classes.methodCardArrow}>›</span> */}
        </div>

        <div
          className={`${classes.methodCard} ${classes.methodCardRecording}`}
          onClick={() => setScreen("recording")}
        >
          <div
            className={`${classes.methodIcon} ${classes.methodIconRecording}`}
          >
            <Mic size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromRecording")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromRecordingDesc")}
            </p>
          </div>
          {/* <span className={classes.methodCardArrow}>›</span> */}
        </div>

        <div
          className={`${classes.methodCard} ${classes.methodCardManual}`}
          onClick={() => {
            setScreen("manual");
            setManualStep(0);
          }}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconManual}`}>
            <FilePenLine size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "manual")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "manualDesc")}
            </p>
          </div>
          {/* <span className={classes.methodCardArrow}>›</span> */}
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
          <ChevronRight /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton
          // type="button"
          // className={classes.wizardCloseBtn}
          onClick={handleClose}
        >
          {/* <X size={16} /> */}
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
        <span className={classes.tipIcon}>
          <Lightbulb size={16} />
        </span>
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
        {/* {!isImporting && <ChevronRight />} */}
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
          <ChevronRight /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton
          // type="button"
          // className={classes.wizardCloseBtn}
          onClick={handleClose}
        >
          {/* <X size={16} /> */}
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
        <span className={classes.tipIcon}>
          <Lightbulb size={16} />
        </span>
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
        {/* {!isImporting && <ChevronRight />} */}
      </button>
    </div>
  );

  const renderRecordingScreen = () => (
    <div className={classes.wizardContainer}>
      <div className={classes.screenTopBar}>
        <button
          type="button"
          className={classes.backLink}
          onClick={() => {
            handleStopRecording();
            setRecordingText("");
            setScreen("method");
            setImportError("");
          }}
        >
          <ChevronRight /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton onClick={handleClose} />
      </div>

      <h2 className={classes.screenTitle}>
        {t("addWizard", "fromRecordingTitle")}
      </h2>
      <p className={classes.screenSubtitle}>
        {t("addWizard", "fromRecordingSubtitle")}
      </p>

      <div className={classes.recordingArea}>
        {!isRecording && (
          <button
            type="button"
            className={classes.recordBtn}
            onClick={handleStartRecording}
          >
            <Mic size={28} />
            <span>
              {recordingText.trim()
                ? t("addWizard", "continueRecording")
                : t("addWizard", "startRecording")}
            </span>
          </button>
        )}

        {isRecording && (
          <>
            <div className={classes.recordingPulse} />
            <button
              type="button"
              className={classes.stopRecordBtn}
              onClick={handleStopRecording}
            >
              <span className={classes.stopIcon} />
              <span>{t("addWizard", "stopRecording")}</span>
            </button>
          </>
        )}
      </div>

      {!isRecording && recordingText.trim() && (
        <div className={classes.recordingPreview}>
          <label className={classes.fieldLabel}>
            {t("addWizard", "recordedText")}:
          </label>
          <textarea
            className={classes.textArea}
            value={recordingText}
            onChange={(e) => setRecordingText(e.target.value)}
            rows={6}
          />
          <p className={classes.fieldHint}>
            {t("addWizard", "recordedTextHint")}
          </p>
        </div>
      )}

      <div className={`${classes.tipBox} ${classes.tipBoxPurple}`}>
        <span className={classes.tipIcon}>
          <Mic size={16} />
        </span>
        <span>
          <span className={classes.tipBold}>{t("addWizard", "tip")}:</span>{" "}
          {t("addWizard", "recordingTip")
            .split("\\n")
            .map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
        </span>
      </div>

      <div className={`${classes.tipBox} ${classes.tipBoxGreen}`}>
        <span>{t("addWizard", "recordingExample")}</span>
      </div>

      <div className={`${classes.tipBox} ${classes.tipBoxBlue}`}>
        <span>{t("addWizard", "freeSpeechNote")}</span>
      </div>

      {importError && <p className={classes.errorText}>{importError}</p>}

      {!isRecording && recordingText.trim() && (
        <div className={classes.recordingActions}>
          <button
            type="button"
            className={classes.continueBtn}
            onClick={handleImportFromRecording}
            disabled={isImporting}
          >
            {isImporting
              ? t("addWizard", "importing")
              : t("addWizard", "parseAndImport")}
            {/* {!isImporting && <ChevronRight />} */}
          </button>
          <button
            type="button"
            className={classes.aiParseBtn}
            onClick={doImportWithAI}
            disabled={isImporting}
          >
            {isImporting
              ? t("addWizard", "importing")
              : t("addWizard", "aiParse")}
          </button>
          <button
            type="button"
            className={classes.secondaryBtn}
            onClick={() => {
              setRecordingText("");
              setImportError("");
              accumulatedTextRef.current = "";
              recordingTextRef.current = "";
              setRecipeText("");
              handleStartRecording();
            }}
          >
            {t("addWizard", "reRecord")}
          </button>
        </div>
      )}
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
          <ChevronRight /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton
          // type="button"
          // className={classes.wizardCloseBtn}
          onClick={handleClose}
        >
          {/* <X size={16} /> */}
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
          <Camera className={classes.photoUploadIcon} />
          <span className={classes.photoUploadText}>
            {t("addWizard", "analyzingPhoto")}
          </span>
        </div>
      ) : (
        <div className={classes.imageUploadButtons}>
          {isMobileDevice && (
            <button
              type="button"
              className={classes.imageOptionBtn}
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera className={classes.imageOptionIcon} />
              <span>{t("addWizard", "takePhoto")}</span>
            </button>
          )}
          <button
            type="button"
            className={classes.imageOptionBtn}
            onClick={() => photoFileInputRef.current?.click()}
          >
            <Upload className={classes.imageOptionIcon} />
            <span>{t("addWizard", "fromFile")}</span>
          </button>
        </div>
      )}

      <div className={`${classes.tipBox} ${classes.tipBoxGreen}`}>
        <span className={classes.tipIcon}>
          <Camera size={16} />
        </span>
        <span>
          <span className={classes.tipBold}>{t("addWizard", "tip")}:</span>{" "}
          {t("addWizard", "photoTip")}
        </span>
      </div>

      {importError && <p className={classes.errorText}>{importError}</p>}
    </div>
  );

  const handleManualBack = () => {
    if (cameFromRecording) {
      setCameFromRecording(false);
      setScreen("recording");
    } else {
      setScreen("method");
    }
  };

  const renderManualScreen = () => (
    <div className={classes.wizardContainer}>
      <div className={classes.screenTopBar}>
        <button
          type="button"
          className={classes.backLink}
          onClick={handleManualBack}
        >
          <ChevronRight />{" "}
          {cameFromRecording
            ? t("addWizard", "backToRecording")
            : t("addWizard", "backToMethod")}
        </button>
        <CloseButton
          onClick={cameFromRecording ? handleManualBack : handleClose}
        ></CloseButton>
      </div>

      {recipe.sourceUrl && (
        <div className={classes.tipBox}>
          <span className={classes.tipIcon}>
            <Info size={16} />
          </span>
          <span>{t("addWizard", "importReviewNote")}</span>
        </div>
      )}

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
          disabled={!canProceed() || saving}
        >
          {saving ? (
            <>
              <Loader2 size={16} className={classes.spinning} />{" "}
              {t("common", "loading") || "..."}
            </>
          ) : manualStep === 4 ? (
            t("addWizard", "saveRecipe")
          ) : (
            t("addWizard", "continue")
          )}
          {/* <ChevronRight /> */}
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
      case "recording":
        return renderRecordingScreen();
      case "photo":
        return renderPhotoScreen();
      case "manual":
        return renderManualScreen();
      default:
        return renderMethodSelection();
    }
  };

  return (
    <Modal onClose={handleClose} maxWidth="550px">
      {renderScreen()}
    </Modal>
  );
}

export default AddRecipeWizard;
