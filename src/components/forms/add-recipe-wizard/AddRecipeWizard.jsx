import React, { useState, useRef, useEffect, useCallback } from "react";
import { Modal } from "../../modal";
import { useLanguage, useRecipeBook } from "../../../context";
import {
  uploadRecipeImage,
  normalizeImageDataUrl,
} from "../../../firebase/imageService";
import {
  parseRecipeFromUrl,
  parseRecipeFromText,
} from "../../../app/recipeParser";
import {
  extractRecipeFromImage,
  calculateNutrition,
  parseFreeSpeechRecipe,
  generateRecipeImageDataUrl,
} from "../../../services/openai";
import { useTouchDragDrop } from "../../../hooks/useTouchDragDrop";
import useTranslatedList from "../../../hooks/useTranslatedList";
import { FEATURES } from "../../../config/entitlements";
import useEntitlements from "../../../hooks/useEntitlements";
import { PremiumFeaturePopup } from "../../premium-popup";
import buttonClasses from "../../../styles/shared/buttons.module.css";
import catShared from "../../../styles/shared/category-chips.module.css";
import shared from "../../../styles/shared/form-shared.module.css";
import _screensClasses from "./add-recipe-wizard/wizard-screens.module.css";
import _formClasses from "./add-recipe-wizard/wizard-form.module.css";
import _summaryClasses from "./add-recipe-wizard/wizard-summary.module.css";
const classes = Object.assign(
  {},
  _screensClasses,
  _formClasses,
  _summaryClasses,
);
import { translateRecipeContent } from "../../../utils/translateContent";
import { buildPublishedSnapshot } from "../../../utils/publishedSnapshot";
import { detectVideoSource } from "../../../utils/videoSourceDetector";
import {
  makeGroupHeader,
  ingredientsOnly,
  parseIngredients,
  expandGroupHeadersInIngredients,
  stripTrailingSectionHeaderFromName,
} from "../../../utils/ingredientUtils";
import { CircleCheck, AlertTriangle } from "lucide-react";
import { Toast } from "../../controls";
import { WizardContext } from "./WizardContext";
import MethodSelectionScreen from "./screens/MethodSelectionScreen";
import UrlScreen from "./screens/UrlScreen";
import TextScreen from "./screens/TextScreen";
import VideoScreen from "./screens/VideoScreen";
import RecordingScreen from "./screens/RecordingScreen";
import PhotoScreen from "./screens/PhotoScreen";
import ManualScreen from "./screens/ManualScreen";

const INITIAL_RECIPE = {
  name: "",
  ingredients: ["", "", ""],
  instructions: ["", "", ""],
  prepTime: "",
  cookTime: "",
  servings: "",
  difficulty: "Unknown",
  sourceUrl: "",
  importedFromUrl: false,
  importedFromVideo: false,
  author: "",
  videoUrl: "",
  image_src: "",
  images: [],
  categories: [],
  isFavorite: false,
  notes: "",
  rating: 0,
  shareToGlobal: false,
  showMyName: false,
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

function AddRecipeWizard({
  onAddRecipe,
  onCancel,
  onSaved,
  groups = [],
  defaultGroup = null,
  initialScreen = "method",
  initialRecipe = null,
}) {
  const { language, t } = useLanguage();
  const { currentUser, addCategory } = useRecipeBook();
  const { canUse, incrementUsage } = useEntitlements();
  const { getTranslated: getTranslatedGroup } = useTranslatedList(
    groups,
    "name",
  );
  const [screen, setScreen] = useState(initialScreen); // method | url | text | video | photo | manual | recording
  const [cameFromRecording, setCameFromRecording] = useState(false);
  const [manualStep, setManualStep] = useState(0);
  const [recipe, setRecipe] = useState(() => {
    const base = {
      ...INITIAL_RECIPE,
      categories: defaultGroup ? [defaultGroup] : [],
    };
    let draft = initialRecipe;
    if (!draft) {
      try {
        const stored = sessionStorage.getItem("chatRecipeDraft");
        if (stored) {
          draft = JSON.parse(stored);
          sessionStorage.removeItem("chatRecipeDraft");
        }
      } catch {}
    }
    if (draft) {
      return {
        ...base,
        ...draft,
        categories: draft.categories || base.categories,
        ingredients: draft.ingredients?.length
          ? draft.ingredients
          : base.ingredients,
        instructions: draft.instructions?.length
          ? draft.instructions
          : base.instructions,
      };
    }
    return base;
  });
  const [recipeUrl, setRecipeUrl] = useState("");
  const [recipeAuthor, setRecipeAuthor] = useState("");
  const [recipeText, setRecipeText] = useState("");
  const [recipeVideoUrl, setRecipeVideoUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [premiumPopup, setPremiumPopup] = useState({ open: false, type: "hard" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingAiImage, setGeneratingAiImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState("");
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const accumulatedTextRef = useRef("");
  const recordingTextRef = useRef("");
  const [dragIndex, setDragIndex] = useState(null);
  const [dragField, setDragField] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [stepError, setStepError] = useState("");
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [showPreview, setShowPreview] = useState(false);
  const [imageToast, setImageToast] = useState({
    open: false,
    message: null,
    variant: "success",
    duration: 4000,
  });
  const [imageDragOver, setImageDragOver] = useState(false);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const progressRef = useRef(null);
  const fileInputRef = useRef(null);
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

  const {
    handleTouchStart,
    handleLongPressStart,
    isActive: isTouchDragActive,
    justFinishedRef: touchDragJustFinishedRef,
  } = useTouchDragDrop(handleTouchReorder);

  const updateRecipe = (field, value) => {
    setRecipe((prev) => ({ ...prev, [field]: value }));
    if (stepError) setStepError("");
  };

  const needsTranslationRef = useRef(false);

  useEffect(() => {
    if (screen !== "manual" || !needsTranslationRef.current) return;
    needsTranslationRef.current = false;
    if (!language || language === "mixed") return;
    translateRecipeContent(recipe, language)
      .then((translated) => setRecipe(translated))
      .catch(() => {});
  }, [screen]);

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
      const aiFallbackCheck = canUse(FEATURES.AI_URL_FALLBACK);
      const parsed = await parseRecipeFromUrl(recipeUrl, {
        canUseAiFallback: aiFallbackCheck.allowed,
      });
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
              .split("\n")
              .map((i) => i.trim())
              .filter(Boolean)
          : prev.instructions,
        prepTime: parsed.prepTime || prev.prepTime,
        cookTime: parsed.cookTime || prev.cookTime,
        servings: parsed.servings || prev.servings,
        // Do NOT copy image_src from imported URL (avoid hotlinking external
        // images). User can upload their own image later.
        image_src: prev.image_src,
        images: prev.images,
        sourceUrl: recipeUrl,
        importedFromUrl: true,
        author: recipeAuthor.trim() || prev.author,
        notes: parsed.notes || prev.notes,
      }));
      setImportProgress(100);
      clearInterval(progressRef.current);
      needsTranslationRef.current = true;
      setScreen("manual");
      setManualStep(0);
    } catch (err) {
      console.error("[ImportURL]", err);
      if (err.message === "AI_FALLBACK_BLOCKED") {
        setImportError(t("addWizard", "importNeedsAi"));
      } else if (err.message && err.message.startsWith("BLOCKED:")) {
        setImportError(t("addWizard", "importBlocked"));
      } else {
        const detail = err.message || String(err);
        setImportError(`${t("addWizard", "importFailed")} (${detail})`);
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

  // Map our app language codes to BCP-47 locales SpeechRecognition expects.
  // Without this the recognizer was hardcoded to he-IL and silently dropped
  // anything spoken in another language (e.g. German video narration
  // produced empty transcripts).
  const APP_LANG_TO_LOCALE = {
    he: "he-IL",
    en: "en-US",
    ru: "ru-RU",
    de: "de-DE",
    mixed: "he-IL",
  };

  // Recording language is independent of UI language: the user might be
  // running the app in Hebrew but recording a German cooking video.
  const [recordingLocale, setRecordingLocale] = useState(
    APP_LANG_TO_LOCALE[language] || "he-IL",
  );

  const startRecognitionSession = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    killRecognition();

    const recognition = new SR();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    recognition.continuous = !isMobile;
    recognition.interimResults = true;
    recognition.lang = recordingLocale;
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
      // Some browsers report this when the chosen lang is unsupported; we
      // stop the loop so we don't restart endlessly and show a clear hint.
      if (
        event.error === "language-not-supported" ||
        event.error === "bad-grammar"
      ) {
        isRecordingRef.current = false;
        setIsRecording(false);
        setImportError(t("addWizard", "recordingLangUnsupported"));
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

  // Wipes everything tied to a previous recording session so fresh entries
  // into the recording screen don't show stale text and so changing the
  // recording language can't get tangled with leftover transcript state.
  const resetRecordingState = () => {
    isRecordingRef.current = false;
    killRecognition();
    setIsRecording(false);
    accumulatedTextRef.current = "";
    recordingTextRef.current = "";
    setRecordingText("");
    setRecipeText("");
    setImportError("");
  };

  const enterRecordingScreen = () => {
    resetRecordingState();
    setScreen("recording");
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
        notes: parsed.notes || prev.notes,
      }));
      needsTranslationRef.current = true;
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
    const voiceCheck = canUse(FEATURES.IMPORT_VOICE);
    if (!voiceCheck.allowed) {
      setPremiumPopup({ open: true, type: "limit" });
      return;
    }
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
        const isNoRecipe =
          typeof parsed.error === "string" &&
          parsed.error.toLowerCase().includes("no recipe found");
        setImportError(
          isNoRecipe ? t("addWizard", "noRecipeInRecording") : parsed.error,
        );
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
        notes: parsed.notes || prev.notes,
      }));
      await incrementUsage(FEATURES.IMPORT_VOICE);
      needsTranslationRef.current = true;
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
    const textCheck = canUse(FEATURES.IMPORT_TEXT);
    if (!textCheck.allowed) {
      setPremiumPopup({ open: true, type: "limit" });
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
        notes: parsed.notes || prev.notes,
      }));
      incrementUsage(FEATURES.IMPORT_TEXT);
      needsTranslationRef.current = true;
      setScreen("manual");
      setManualStep(0);
    } catch (err) {
      setImportError(t("addWizard", "parseFailed"));
    } finally {
      setIsImporting(false);
    }
  };

  // "From Video" is a router rather than its own importer. We can't read
  // the video itself (no scraping / no login bypass / no thumbnail per the
  // original constraints), so the user picks one of the existing flows and
  // we only stash the video URL (when valid) plus the importedFromVideo
  // flag before navigating. The chosen flow's handler keeps prev state via
  // setRecipe(prev => ...), so videoUrl + importedFromVideo survive even
  // if it overwrites sourceUrl (e.g. URL/blog flow).
  const handleStartFromVideo = (target) => {
    setImportError("");
    const trimmedUrl = recipeVideoUrl.trim();
    const validUrl = detectVideoSource(trimmedUrl) ? trimmedUrl : "";
    setRecipe((prev) => ({
      ...prev,
      sourceUrl: validUrl || prev.sourceUrl || "",
      videoUrl: validUrl || prev.videoUrl || "",
      importedFromVideo: true,
    }));
    if (target === "manual") {
      setManualStep(0);
    }
    if (target === "recording") {
      resetRecordingState();
    }
    setScreen(target);
  };

  const handleImportFromPhoto = async (e) => {
    const inputEl = e.target;
    const files = Array.from(inputEl.files || []);
    if (files.length === 0) return;

    const photoCheck = canUse(FEATURES.IMPORT_PHOTO);
    if (!photoCheck.allowed) {
      setPremiumPopup({ open: true, type: "limit" });
      try { inputEl.value = ""; } catch {}
      if (photoFileInputRef.current) photoFileInputRef.current.value = "";
      return;
    }

    const resetPhotoInputs = () => {
      try {
        inputEl.value = "";
      } catch {}
      if (photoFileInputRef.current) photoFileInputRef.current.value = "";
    };

    setIsImporting(true);
    setImportError("");

    const safetyTimer = setTimeout(() => {
      setIsImporting(false);
      setImportError("Timeout - try again");
      resetPhotoInputs();
    }, 90000);

    try {
      const resizeImage = (file, maxDim = 2048) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => {
            const normalized = normalizeImageDataUrl(reader.result);
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
              try {
                const { width, height } = img;
                if (width <= maxDim && height <= maxDim) {
                  resolve(normalized);
                  return;
                }
                const scale = maxDim / Math.max(width, height);
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(width * scale);
                canvas.height = Math.round(height * scale);
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.92));
              } catch (err) {
                reject(err);
              }
            };
            img.src = normalized;
          };
          reader.readAsDataURL(file);
        });
      const base64Images = await Promise.all(files.map((f) => resizeImage(f)));
      const ocrCheck = canUse(FEATURES.OCR);
      const parsed = await extractRecipeFromImage(base64Images, {
        canUseOcr: ocrCheck.allowed,
      });
      if (parsed.error) {
        setImportError(t("addWizard", "photoFailed"));
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
        difficulty: parsed.difficulty || prev.difficulty,
        notes: parsed.notes || prev.notes,
      }));
      await incrementUsage(FEATURES.IMPORT_PHOTO);
      needsTranslationRef.current = true;
      setScreen("manual");
      setManualStep(0);
    } catch (err) {
      setImportError(t("addWizard", "photoFailed"));
    } finally {
      clearTimeout(safetyTimer);
      setIsImporting(false);
      resetPhotoInputs();
    }
  };

  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || navigator.maxTouchPoints > 1;

  // ========== Image upload ==========
  const handleImageUpload = async (e) => {
    const inputEl = e.target;
    const files = Array.from(inputEl.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    setImportError("");

    const resetInput = () => {
      try {
        inputEl.value = "";
      } catch {}
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const safetyTimer = setTimeout(() => {
      setUploadingImage(false);
      setImportError("Timeout - try again");
      resetInput();
    }, 60000);

    try {
      const userId = currentUser?.uid;
      if (!userId) throw new Error("Not logged in");
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadRecipeImage(
          userId,
          `new_${Date.now()}_${i}`,
          files[i],
        );
        urls.push(url);
      }
      setRecipe((prev) => {
        const allImages = [...(prev.images || []), ...urls];
        return {
          ...prev,
          images: allImages,
          image_src: allImages[0] || "",
        };
      });
    } catch (err) {
      console.error("Image upload failed:", err);
      setImportError(err.message || "Upload failed");
    } finally {
      clearTimeout(safetyTimer);
      setUploadingImage(false);
      resetInput();
    }
  };

  const handleRemoveImage = (index) => {
    setRecipe((prev) => {
      const updated = (prev.images || []).filter((_, i) => i !== index);
      return {
        ...prev,
        images: updated,
        image_src: updated[0] || "",
      };
    });
  };

  const handleReorderImages = (fromIndex, toIndex) => {
    setRecipe((prev) => {
      const imgs = [...(prev.images || [])];
      const [moved] = imgs.splice(fromIndex, 1);
      imgs.splice(toIndex, 0, moved);
      return { ...prev, images: imgs, image_src: imgs[0] || "" };
    });
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setImageDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || /\.jfif$/i.test(f.name),
    );
    if (files.length === 0) return;
    handleImageUpload({ target: { files }, preventDefault: () => {} });
  };

  const handlePasteImage = useCallback(
    async (file) => {
      if (!file || uploadingImage || generatingAiImage) return;
      setUploadingImage(true);
      try {
        const userId = currentUser?.uid;
        if (!userId) throw new Error("Not logged in");
        const url = await uploadRecipeImage(
          userId,
          `new_${Date.now()}_paste`,
          file,
        );
        setRecipe((prev) => {
          const allImages = [...(prev.images || []), url];
          return { ...prev, images: allImages, image_src: allImages[0] || "" };
        });
      } catch (err) {
        console.error("Paste image failed:", err);
      } finally {
        setUploadingImage(false);
      }
    },
    [currentUser, uploadingImage, generatingAiImage],
  );

  useEffect(() => {
    if (screen !== "manual" || manualStep !== 3) return;
    const onPaste = (e) => {
      const imageItem = Array.from(e.clipboardData?.items || []).find((item) =>
        item.type.startsWith("image/"),
      );
      if (!imageItem) return;
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) handlePasteImage(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [screen, manualStep, handlePasteImage]);

  const handleGenerateAiImage = async () => {
    const dalleCheck = canUse(FEATURES.DALLE_IMAGE);
    if (!dalleCheck.allowed) {
      setPremiumPopup({ open: true, type: "hard" });
      return;
    }
    if (!recipe.name?.trim()) {
      setImageToast({
        open: true,
        message: (
          <>
            <AlertTriangle size={18} />{" "}
            {t("addWizard", "generateAiImageNeedName")}
          </>
        ),
        variant: "error",
        duration: 4000,
      });
      return;
    }
    if (uploadingImage || generatingAiImage) return;

    setGeneratingAiImage(true);

    const safetyTimer = setTimeout(() => {
      setGeneratingAiImage(false);
      setImageToast({
        open: true,
        message: (
          <>
            <AlertTriangle size={18} /> Timeout
          </>
        ),
        variant: "error",
        duration: 5000,
      });
    }, 120000);

    try {
      const userId = currentUser?.uid;
      if (!userId) throw new Error("Not logged in");
      const ingForPrompt = ingredientsOnly(recipe.ingredients || [])
        .map((i) => i.trim())
        .filter(Boolean)
        .slice(0, 15);
      const dataUrl = await generateRecipeImageDataUrl({
        recipeName: recipe.name.trim(),
        ingredients: ingForPrompt,
      });
      const url = await uploadRecipeImage(
        userId,
        `new_${Date.now()}_ai`,
        dataUrl,
      );
      setRecipe((prev) => {
        const allImages = [...(prev.images || []), url];
        return {
          ...prev,
          images: allImages,
          image_src: allImages[0] || "",
        };
      });
      setImageToast({
        open: true,
        message: (
          <>
            <CircleCheck size={18} /> {t("addWizard", "generateAiImageDone")}
          </>
        ),
        variant: "success",
        duration: 4000,
      });
    } catch (err) {
      console.error("AI image generation failed:", err);
      setImageToast({
        open: true,
        message: (
          <>
            <AlertTriangle size={18} />{" "}
            {err.message || t("addWizard", "generateAiImageError")}
          </>
        ),
        variant: "error",
        duration: 5000,
      });
    } finally {
      clearTimeout(safetyTimer);
      setGeneratingAiImage(false);
    }
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    setPhotoDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || /\.jfif$/i.test(f.name),
    );
    if (files.length === 0) return;
    handleImportFromPhoto({ target: { files }, preventDefault: () => {} });
  };

  const handlePastePhotoImage = (file) => {
    handleImportFromPhoto({
      target: { files: [file] },
      preventDefault: () => {},
    });
  };

  const preventDragDefault = (e) => e.preventDefault();

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

  const handleDragStart = (e, index, field) => {
    if (isTouchDragActive()) {
      e.preventDefault();
      return;
    }
    setDragIndex(index);
    setDragField(field);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex, field) => {
    if (dragIndex === null || dragField !== field) return;
    if (touchDragJustFinishedRef.current) return;
    const items = [...recipe[field]];
    const [moved] = items.splice(dragIndex, 1);
    items.splice(targetIndex, 0, moved);
    updateRecipe(field, items);
    setDragIndex(null);
    setDragField(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragField(null);
    setDragOverIndex(null);
  };

  const toggleCategory = (catId) => {
    setRecipe((prev) => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter((c) => c !== catId)
        : [...prev.categories, catId],
    }));
  };

  // ========== Add Category Inline ==========
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const handleAddNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const COLORS = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#9B59B6",
      "#3498DB",
      "#F1C40F",
      "#2ECC71",
      "#E67E22",
      "#1ABC9C",
    ];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    try {
      const newCat = await addCategory({
        id: Date.now().toString(),
        name,
        description: `${name}`,
        color,
      });
      if (newCat) {
        setRecipe((prev) => ({
          ...prev,
          categories: [...prev.categories, newCat.id],
        }));
      }
    } catch (err) {
      console.error("Failed to add category:", err);
    }
    setNewCategoryName("");
    setShowNewCategoryInput(false);
  };

  // ========== Parse Ingredients ==========
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

  // ========== Submit ==========
  const [saving, setSaving] = useState(false);
  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    const filledAll = recipe.ingredients.filter(Boolean);
    const filledIngredients = ingredientsOnly(filledAll);
    let nutrition = recipe.nutrition || {};
    const hasNutrition =
      nutrition.calories && String(nutrition.calories) !== "0";
    const nutritionAllowed = canUse(FEATURES.NUTRITION_CALC).allowed;
    if (filledIngredients.length > 0 && !hasNutrition && nutritionAllowed) {
      try {
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
    const images = recipe.images?.length > 0 ? recipe.images : [];
    const newRecipe = {
      name: recipe.name,
      ingredients: filledAll,
      instructions: recipe.instructions.filter(Boolean),
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings ? parseInt(recipe.servings) : null,
      difficulty: recipe.difficulty,
      sourceUrl: recipe.sourceUrl,
      importedFromVideo: !!recipe.importedFromVideo,
      author: recipe.author || "",
      videoUrl: recipe.videoUrl,
      image_src: images[0] || recipe.image_src,
      images,
      categories: recipe.categories,
      isFavorite: recipe.isFavorite,
      notes: recipe.notes,
      rating: recipe.rating || 0,
      shareToGlobal: recipe.shareToGlobal,
      showMyName: recipe.shareToGlobal ? recipe.showMyName : false,
      nutrition,
    };

    // If the user chose to share during creation, freeze the published
    // content into a snapshot on the very first save. This way the
    // community version is immutable from day one — future edits on the
    // sharer's private copy won't leak into the community.
    if (newRecipe.shareToGlobal) {
      const wantsName = !!recipe.showMyName;
      const snapshot = buildPublishedSnapshot(newRecipe, {
        sharerUserId: wantsName ? currentUser?.uid : "",
        sharerName: wantsName ? currentUser?.displayName || "" : "",
      });
      newRecipe.publishedSnapshot = snapshot;
      newRecipe.sharerUserId = snapshot.sharerUserId || "";
      newRecipe.sharerName = snapshot.sharerName || "";
      newRecipe.avgRating = 0;
      newRecipe.ratingCount = 0;
    }

    if (recipe.parentRecipeId) {
      newRecipe.parentRecipeId = recipe.parentRecipeId;
      newRecipe.parentRecipeName = recipe.parentRecipeName || "";
      newRecipe.variationType = recipe.variationType || "custom";
    }
    console.log(
      "🍎 NUTRITION - Saving new recipe with nutrition:",
      newRecipe.nutrition,
    );
    try {
      await onAddRecipe(newRecipe);
      onSaved?.();
    } catch (err) {
      console.error("🍎 NUTRITION - Failed to save recipe:", err);
      setSaving(false);
    }
  };

  // ========== Step navigation ==========
  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return recipe.name.trim().length > 0;
      case 1:
        return recipe.ingredients.some((ing) => ing && ing.trim().length > 0);
      case 2:
        return recipe.instructions.some(
          (inst) => inst && inst.trim().length > 0,
        );
      default:
        return true;
    }
  };

  const getStepError = (step) => {
    switch (step) {
      case 0:
        return t("addWizard", "requiredName");
      case 1:
        return t("addWizard", "requiredIngredients");
      case 2:
        return t("addWizard", "requiredInstructions");
      default:
        return "";
    }
  };

  const canProceed = () => isStepValid(manualStep);

  const canNavigateToStep = (targetStep) => {
    for (let s = 0; s < targetStep; s++) {
      if (!isStepValid(s)) return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!isStepValid(manualStep)) {
      setStepError(getStepError(manualStep));
      return;
    }
    setStepError("");
    if (manualStep === 4) {
      await handleSubmit();
    } else {
      const nextStep = manualStep + 1;
      setManualStep(nextStep);
      setVisitedSteps((prev) => new Set([...prev, nextStep]));
      window.scrollTo({ top: 0 });
    }
  };

  const handlePrev = () => {
    setStepError("");
    setManualStep(manualStep - 1);
    window.scrollTo({ top: 0 });
  };

  const handleStepClick = (stepIndex) => {
    if (stepIndex > manualStep && !canNavigateToStep(stepIndex)) {
      const firstInvalidStep = Array.from(
        { length: stepIndex },
        (_, i) => i,
      ).find((s) => !isStepValid(s));
      if (firstInvalidStep !== undefined) {
        setStepError(getStepError(firstInvalidStep));
      }
      return;
    }
    setStepError("");
    setManualStep(stepIndex);
    setVisitedSteps((prev) => new Set([...prev, stepIndex]));
    window.scrollTo({ top: 0 });
  };

  const cameFromChatDraft = initialScreen === "manual" && initialRecipe != null;

  const handleManualBack = () => {
    if (cameFromRecording) {
      setCameFromRecording(false);
      setScreen("recording");
    } else if (cameFromChatDraft) {
      handleClose();
    } else {
      setRecipe({
        ...INITIAL_RECIPE,
        categories: defaultGroup ? [defaultGroup] : [],
      });
      setManualStep(0);
      setVisitedSteps(new Set([0]));
      setRecipeUrl("");
      setRecipeAuthor("");
      setRecipeVideoUrl("");
      setScreen("method");
    }
  };

  // ========== Context value ==========
  const contextValue = {
    recipe,
    updateRecipe,
    screen,
    setScreen,
    manualStep,
    setManualStep,
    recipeUrl,
    setRecipeUrl,
    recipeAuthor,
    setRecipeAuthor,
    recipeText,
    setRecipeText,
    recipeVideoUrl,
    setRecipeVideoUrl,
    isImporting,
    importError,
    setImportError,
    uploadingImage,
    generatingAiImage,
    isRecording,
    recordingText,
    setRecordingText,
    recordingLocale,
    setRecordingLocale,
    dragIndex,
    dragField,
    dragOverIndex,
    stepError,
    visitedSteps,
    showPreview,
    setShowPreview,
    imageDragOver,
    setImageDragOver,
    photoDragOver,
    setPhotoDragOver,
    importProgress,
    cameFromRecording,
    cameFromChatDraft,
    saving,
    newCategoryName,
    setNewCategoryName,
    showNewCategoryInput,
    setShowNewCategoryInput,
    parseIngredientsPaste,
    setParseIngredientsPaste,
    parseIngredientsOpen,
    setParseIngredientsOpen,
    parseIngredientsHelpOpen,
    setParseIngredientsHelpOpen,
    isMobileDevice,
    groups,
    getTranslatedGroup,
    accumulatedTextRef,
    recordingTextRef,
    fileInputRef,

    photoFileInputRef,
    ingredientsListRef,
    instructionsListRef,
    handleClose,
    handleImportFromUrl,
    handleImportFromText,
    handleStartFromVideo,
    handleImportFromRecording,
    doImportWithAI,
    handleStartRecording,
    handleStopRecording,
    enterRecordingScreen,
    handleImportFromPhoto,
    handlePhotoDrop,
    handlePastePhotoImage,
    handleImageUpload,
    handleRemoveImage,
    handleReorderImages,
    handleImageDrop,
    handlePasteImage,
    handleGenerateAiImage,
    preventDragDefault,
    handleIngredientChange,
    handleAddIngredient,
    handleAddIngredientGroup,
    handleRemoveIngredient,
    handleInstructionChange,
    handleAddInstruction,
    handleRemoveInstruction,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleLongPressStart,
    toggleCategory,
    handleAddNewCategory,
    applyParsedIngredients,
    handleNext,
    handlePrev,
    handleStepClick,
    handleManualBack,
    canNavigateToStep,
    canProceed,
    classes,
    shared,
    catShared,
    buttonClasses,
    t,
  };

  const renderScreen = () => {
    switch (screen) {
      case "method":
        return <MethodSelectionScreen />;
      case "url":
        return <UrlScreen />;
      case "text":
        return <TextScreen />;
      case "video":
        return <VideoScreen />;
      case "recording":
        return <RecordingScreen />;
      case "photo":
        return <PhotoScreen />;
      case "manual":
        return <ManualScreen />;
      default:
        return <MethodSelectionScreen />;
    }
  };

  return (
    <>
      <Modal
        onClose={handleClose}
        maxWidth="550px"
        className={
          screen === "manual"
            ? `${shared.noPadModal} ${classes.noPadModal}`
            : undefined
        }
      >
        <WizardContext.Provider value={contextValue}>
          {renderScreen()}
        </WizardContext.Provider>
      </Modal>
      <Toast
        open={imageToast.open}
        onClose={() => setImageToast((prev) => ({ ...prev, open: false }))}
        variant={imageToast.variant}
        duration={imageToast.duration}
      >
        {imageToast.message}
      </Toast>
      <PremiumFeaturePopup
        open={premiumPopup.open}
        onClose={() => setPremiumPopup({ open: false, type: "hard" })}
        type={premiumPopup.type}
      />
    </>
  );
}

export default AddRecipeWizard;
