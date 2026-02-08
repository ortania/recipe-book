import React, { useState } from "react";
import Modal from "../modal/Modal";
import RecipeDetailsFull from "./RecipeDetailsFull";
import RecipeDetailsCookingMode from "./RecipeDetailsCookingMode";
import { Button } from "../controls/button";
import classes from "./recipe-details.module.css";
import { formatDifficulty } from "./utils";
import { FaRegEdit } from "react-icons/fa";
import { useRecipeBook } from "../../context/RecipesBookContext";
import { useLanguage } from "../../context";
import useTranslatedRecipe from "../../hooks/useTranslatedRecipe";

const SPEECH_LANG_MAP = {
  he: "he-IL",
  en: "en-US",
  ru: "ru-RU",
  de: "de-DE",
  mixed: "he-IL",
};

const VOICE_COMMANDS = {
  start: {
    he: ["התחל", "בישול", "התחלה", "בשל"],
    en: ["start", "begin", "cooking", "cook"],
    ru: ["начать", "старт", "готовить", "начало"],
    de: ["start", "anfangen", "kochen", "beginn"],
    mixed: ["התחל", "בישול", "start", "begin"],
  },
  next: {
    he: ["הבא", "קדימה", "המשך", "עוד", "דלג"],
    en: ["next", "forward", "go", "continue", "skip"],
    ru: ["дальше", "следующий", "вперед", "продолжить"],
    de: ["weiter", "nächste", "vor", "fortfahren"],
    mixed: ["הבא", "קדימה", "next", "forward"],
  },
  prev: {
    he: ["הקודם", "אחורה", "חזור", "חזרה"],
    en: ["prev", "previous", "back", "return", "reverse"],
    ru: ["назад", "предыдущий", "обратно", "вернуть"],
    de: ["zurück", "vorherige", "rückwärts"],
    mixed: ["הקודם", "אחורה", "back", "previous"],
  },
};

function RecipeDetails({ recipe, onClose, onEdit, onDelete, groups = [] }) {
  const { language } = useLanguage();
  const { translated: translatedRecipe, isTranslating } =
    useTranslatedRecipe(recipe);
  if (!recipe) return null;

  // Function to get category name from ID - use context categories for up-to-date names
  const getCategoryName = (categoryId) => {
    const category = categories.find((g) => g.id === categoryId);
    return category ? category.name : categoryId;
  };

  const ingredientsArray = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : recipe.ingredients
        ?.split(",")
        .map((item) => item.trim())
        .filter((item) => item) || [];

  const instructionsArray = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : recipe.instructions
        ?.split(".")
        .map((item) => item.trim())
        .filter((item) => item && item.length > 10) || [];

  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [checkedInstructions, setCheckedInstructions] = useState({});
  const [activeTab, setActiveTab] = useState("ingredients");
  const [servings, setServings] = useState(recipe.servings || 4);
  const originalServings = recipe.servings || 4;
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const { copyRecipeToUser, currentUser, categories } = useRecipeBook();

  // Refs to store latest handler functions
  const handleNextStepRef = React.useRef();
  const handlePrevStepRef = React.useRef();
  const shouldRestartRef = React.useRef(true);
  const lastCommandTimeRef = React.useRef(0);
  const wakeLockRef = React.useRef(null);
  const cookingModeActiveTabRef = React.useRef("ingredients");
  const cookingModeSetActiveTabRef = React.useRef(null);
  const cookingModeCurrentStepRef = React.useRef(0);
  const cookingModeIngredientsLengthRef = React.useRef(0);
  const cookingModeSetCurrentStepRef = React.useRef(null);
  const cookingModeSetShowCompletionRef = React.useRef(null);
  const cookingModeShowCompletionRef = React.useRef(false);

  // Toggle voice recognition
  const toggleVoiceRecognition = () => {
    setVoiceEnabled((prev) => !prev);
  };

  // Function to scale ingredient quantities
  const scaleIngredient = (ingredient) => {
    if (servings === originalServings) return ingredient;

    const ratio = servings / originalServings;

    // Regex to find numbers (including decimals and fractions)
    const numberRegex = /(\d+\.?\d*|\d*\.\d+|\d+\/\d+)/g;

    return ingredient.replace(numberRegex, (match) => {
      // Handle fractions like 1/2, 3/4
      if (match.includes("/")) {
        const [num, denom] = match.split("/").map(Number);
        const scaled = (num / denom) * ratio;
        // Convert back to fraction if it makes sense
        if (scaled === 0.5) return "1/2";
        if (scaled === 0.25) return "1/4";
        if (scaled === 0.75) return "3/4";
        if (scaled === 0.33 || scaled === 0.34) return "1/3";
        if (scaled === 0.67 || scaled === 0.66) return "2/3";
        // Otherwise return decimal rounded to 1 decimal place
        return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
      }

      // Handle regular numbers
      const num = parseFloat(match);
      const scaled = num * ratio;
      // Round to 1 decimal place and remove trailing zeros
      return scaled % 1 === 0
        ? scaled.toString()
        : scaled.toFixed(1).replace(/\.0$/, "");
    });
  };

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

  const handleCookingModeToggle = () => {
    setCookingMode((prev) => {
      const next = !prev;

      setCurrentStep(0);
      setShowCompletion(false);

      if (!next) {
        resetTimer();
        setCustomTimerInput("");
      }

      return next;
    });
  };

  const handleNextStep = React.useCallback(() => {
    const totalSteps =
      activeTab === "ingredients"
        ? ingredientsArray.length
        : instructionsArray.length;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setShowCompletion(false);
    } else {
      // Show completion message
      setShowCompletion(true);
    }
  }, [
    activeTab,
    ingredientsArray.length,
    instructionsArray.length,
    currentStep,
  ]);

  const handlePrevStep = React.useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Update refs whenever handlers change
  React.useEffect(() => {
    handleNextStepRef.current = handleNextStep;
    handlePrevStepRef.current = handlePrevStep;
  }, [handleNextStep, handlePrevStep]);

  const handleScreenClick = () => {
    if (cookingMode) {
      handleNextStepRef.current();
    }
  };

  // Timer countdown effect
  React.useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      if (timerSeconds > 0) {
        setTimerSeconds(timerSeconds - 1);
      } else if (timerMinutes > 0) {
        setTimerMinutes(timerMinutes - 1);
        setTimerSeconds(59);
      } else {
        // Timer completed
        setIsTimerRunning(false);
        setTimerCompleted(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timerMinutes, timerSeconds]);

  // Voice recognition for cooking mode
  React.useEffect(() => {
    if (!cookingMode) {
      console.log("🎤 Voice recognition: Cooking mode is OFF");
      setIsListening(false);
      return;
    }

    let isActive = true; // Track if this effect is still active

    // Check if browser supports Web Speech API
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("❌ Speech recognition NOT supported in this browser");
      alert("זיהוי קולי לא נתמך בדפדפן זה. נסה Chrome או Edge.");
      return;
    }

    console.log("✅ Speech recognition API found");

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false; // Stop after each result - restart manually
    recognitionInstance.interimResults = false; // Only get final results
    recognitionInstance.lang = SPEECH_LANG_MAP[language] || "he-IL";
    recognitionInstance.maxAlternatives = 1; // Reduce processing to minimize beeps

    recognitionInstance.onstart = () => {
      console.log("🎤 Voice recognition STARTED - Say 'next' or 'previous'");
      setIsListening(true);
    };

    recognitionInstance.onend = () => {
      console.log("🎤 Voice recognition ENDED - Restarting...");

      // Let browser fully stop before restarting
      if (isActive && cookingMode && voiceEnabled) {
        // Ensure recognition is fully stopped
        try {
          recognitionInstance.stop();
        } catch (e) {
          // Already stopped, ignore
        }

        setTimeout(() => {
          try {
            if (isActive && voiceEnabled) {
              recognitionInstance.start();
            }
          } catch (e) {
            console.error("❌ Recognition restart error:", e);
            setIsListening(false);
          }
        }, 100); // Short delay after ensuring stop
      } else {
        setIsListening(false);
      }
    };

    recognitionInstance.onresult = (event) => {
      const last = event.results.length - 1;
      const result = event.results[last][0];
      const text = result.transcript.toLowerCase().trim();
      const confidence = result.confidence;

      console.log(
        "🎤 Voice command detected:",
        text,
        "| Confidence:",
        confidence,
      );

      // Ignore very low confidence results
      if (confidence < 0.5) {
        console.log("⚠️ Low confidence, ignoring");
        return;
      }

      // Prevent duplicate commands within 2 seconds
      const now = Date.now();
      const timeSinceLastCommand = now - lastCommandTimeRef.current;

      if (timeSinceLastCommand < 2000) {
        console.log(
          "⏱️ Command ignored - too soon after last command (" +
            timeSinceLastCommand +
            "ms)",
        );
        return;
      }

      // Check for voice commands in the current language
      const startPatterns =
        VOICE_COMMANDS.start[language] || VOICE_COMMANDS.start.he;
      const hasStartCommand = startPatterns.some((pattern) =>
        text.includes(pattern),
      );

      const nextPatterns =
        VOICE_COMMANDS.next[language] || VOICE_COMMANDS.next.he;
      const hasNextCommand = nextPatterns.some((pattern) =>
        text.includes(pattern),
      );

      const prevPatterns =
        VOICE_COMMANDS.prev[language] || VOICE_COMMANDS.prev.he;
      const hasPrevCommand = prevPatterns.some((pattern) =>
        text.includes(pattern),
      );

      if (
        hasStartCommand &&
        cookingModeActiveTabRef.current === "ingredients" &&
        cookingModeShowCompletionRef.current
      ) {
        console.log(
          "✅ Executing START command - completion shown, switching to instructions",
        );
        lastCommandTimeRef.current = now;
        if (
          cookingModeSetActiveTabRef.current &&
          cookingModeSetCurrentStepRef.current &&
          cookingModeSetShowCompletionRef.current
        ) {
          cookingModeSetActiveTabRef.current("instructions");
          cookingModeSetCurrentStepRef.current(0);
          cookingModeSetShowCompletionRef.current(false);
        }
      } else if (hasNextCommand) {
        console.log("✅ Executing NEXT command");
        lastCommandTimeRef.current = now;
        if (handleNextStepRef.current) {
          handleNextStepRef.current();
        } else {
          console.error("❌ handleNextStepRef.current is null");
        }
      } else if (hasPrevCommand) {
        console.log("✅ Executing PREV command");
        lastCommandTimeRef.current = now;
        if (handlePrevStepRef.current) {
          handlePrevStepRef.current();
        } else {
          console.error("❌ handlePrevStepRef.current is null");
        }
      } else {
        console.log("⚠️ No matching command found in:", text);
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error("❌ Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        alert("יש לאפשר גישה למיקרופון כדי להשתמש בזיהוי קולי");
      }
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    // Auto-start voice recognition only if enabled
    if (voiceEnabled) {
      console.log("🎤 Starting voice recognition...");
      try {
        recognitionInstance.start();
      } catch (e) {
        console.error("❌ Recognition start error:", e);
      }
    }

    return () => {
      console.log("🎤 Cleaning up voice recognition");
      isActive = false; // Prevent any pending restarts
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
          recognitionInstance.onend = null; // Remove the onend handler to prevent restart
          recognitionInstance.onresult = null;
          recognitionInstance.onerror = null;
          recognitionInstance.onstart = null;
        } catch (e) {
          console.log("Recognition already stopped");
        }
      }
      setIsListening(false);
    };
  }, [cookingMode, voiceEnabled, activeTab, language]);

  // Wake Lock to keep screen on during cooking mode
  React.useEffect(() => {
    if (!cookingMode) {
      // Release wake lock when exiting cooking mode
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          console.log("🔓 Screen wake lock released");
          wakeLockRef.current = null;
        });
      }
      return;
    }

    // Request wake lock when entering cooking mode
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          console.log("🔒 Screen wake lock activated - screen will stay on");
        } else {
          console.log("⚠️ Wake Lock API not supported");
        }
      } catch (err) {
        console.error("❌ Wake lock error:", err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          console.log("🔓 Screen wake lock released");
          wakeLockRef.current = null;
        });
      }
    };
  }, [cookingMode]);

  // Keyboard navigation for cooking mode
  React.useEffect(() => {
    if (!cookingMode) return;

    const handleKeyPress = (e) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === "Escape") {
        handleCookingModeToggle();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [cookingMode, handleNextStep, handlePrevStep]);

  const resetTimer = () => {
    setTimerMinutes(0);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setTimerCompleted(false);
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      {!cookingMode ? (
        <RecipeDetailsFull
          recipe={translatedRecipe}
          originalRecipe={recipe}
          isTranslating={isTranslating}
          onClose={onClose}
          onEdit={onEdit}
          onDelete={onDelete}
          getCategoryName={getCategoryName}
          onEnterCookingMode={handleCookingModeToggle}
          onCopyRecipe={copyRecipeToUser}
          currentUserId={currentUser?.uid}
        />
      ) : (
        <RecipeDetailsCookingMode
          recipe={translatedRecipe}
          onClose={onClose}
          onExitCookingMode={handleCookingModeToggle}
          isListening={isListening}
          voiceEnabled={voiceEnabled}
          onToggleVoice={toggleVoiceRecognition}
          onStepHandlersReady={(
            nextRef,
            prevRef,
            activeTabValue,
            setActiveTabFunc,
            currentStepValue,
            ingredientsLength,
            setCurrentStepFunc,
            setShowCompletionFunc,
            showCompletionValue,
          ) => {
            handleNextStepRef.current = nextRef.current;
            handlePrevStepRef.current = prevRef.current;
            cookingModeActiveTabRef.current = activeTabValue;
            cookingModeSetActiveTabRef.current = setActiveTabFunc;
            cookingModeCurrentStepRef.current = currentStepValue;
            cookingModeIngredientsLengthRef.current = ingredientsLength;
            cookingModeSetCurrentStepRef.current = setCurrentStepFunc;
            cookingModeSetShowCompletionRef.current = setShowCompletionFunc;
            cookingModeShowCompletionRef.current = showCompletionValue;
          }}
        />
      )}
    </Modal>
  );
}

export default RecipeDetails;
