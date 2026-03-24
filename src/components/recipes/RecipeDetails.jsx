import React, { useState } from "react";
import Modal from "../modal/Modal";
import RecipeDetailsFull from "./RecipeDetailsFull";
import RecipeDetailsCookingMode from "./RecipeDetailsCookingMode";
import { Button } from "../controls/button";
import classes from "./recipe-details.module.css";
import { formatDifficulty } from "./utils";
import { useRecipeBook } from "../../context/RecipesBookContext";
import { useLanguage } from "../../context";
import { scaleIngredient } from "../../utils/ingredientUtils";
import useTranslatedRecipe from "../../hooks/useTranslatedRecipe";
import useTranslatedList from "../../hooks/useTranslatedList";

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
  const { getTranslated: getTranslatedGroup } = useTranslatedList(
    groups,
    "name",
  );
  if (!recipe) return null;

  const getCategoryName = (categoryId) => {
    const category = groups.find((g) => g.id === categoryId);
    return category ? getTranslatedGroup(category) : null;
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
  const { copyRecipeToUser, currentUser, categories, editRecipe } =
    useRecipeBook();

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
  const scale = (ingredient) =>
    scaleIngredient(ingredient, servings, originalServings);

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

  // Old voice recognition disabled - CookingVoiceChat handles all voice interaction now

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
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="750px"
      className={classes.recipeModal}
    >
      {!cookingMode ? (
        <RecipeDetailsFull
          recipe={translatedRecipe}
          originalRecipe={recipe}
          isTranslating={isTranslating}
          onClose={onClose}
          onEdit={onEdit}
          onDelete={onDelete}
          onSaveRecipe={editRecipe}
          getCategoryName={getCategoryName}
          onEnterCookingMode={handleCookingModeToggle}
          onCopyRecipe={(recipe, targetUserId) =>
            copyRecipeToUser(recipe, targetUserId, language)
          }
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
