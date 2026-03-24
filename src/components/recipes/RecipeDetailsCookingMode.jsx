import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  isGroupHeader,
  getGroupName,
  parseIngredients,
  scaleIngredient,
} from "../../utils/ingredientUtils";
import { useLanguage, useRadio } from "../../context";
import { useTimers } from "../../context/TimerContext";
import classes from "./recipe-details-cooking.module.css";

import { CookingModeContext } from "./recipe-details-cooking/CookingModeContext";
import CookingModeHeader from "./recipe-details-cooking/CookingModeHeader";
import CookingModeTabs from "./recipe-details-cooking/CookingModeTabs";
import CookingModeContent from "./recipe-details-cooking/CookingModeContent";
import CookingModeBottomControls from "./recipe-details-cooking/CookingModeBottomControls";

function RecipeDetailsCookingMode({
  recipe,
  servings,
  setServings,
  onClose,
  onExitCookingMode,
  isListening,
  onStepHandlersReady,
  voiceEnabled,
  onToggleVoice,
}) {
  const { t } = useLanguage();
  const { addTimer, stopAll, removeTimer, timers, hasRunning: isTimerRunning } = useTimers();
  const [activeTab, setActiveTab] = useState("instructions");
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState("");
  const [fontSizeLevel, setFontSizeLevel] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const { radioRef, closeRadio } = useRadio();
  const touchRef = useRef({ startX: 0, startY: 0 });
  const savedStepRef = useRef({ ingredients: 0, instructions: 0 });
  const handleNextStepRef = useRef();
  const handlePrevStepRef = useRef();

  const switchTab = (newTab) => {
    if (newTab === activeTab) return;
    savedStepRef.current[activeTab] = showCompletion ? 0 : currentStep;
    setActiveTab(newTab);
    setCurrentStep(savedStepRef.current[newTab] || 0);
    setShowCompletion(false);
  };

  const handleTabSwipe = (e) => {
    const diffX = e.changedTouches[0].clientX - touchRef.current.startX;
    const diffY = Math.abs(e.changedTouches[0].clientY - touchRef.current.startY);
    if (diffY > Math.abs(diffX) || Math.abs(diffX) < 50) return;
    const isRTL = document.documentElement.dir === "rtl";
    const direction = isRTL ? -diffX : diffX;
    const tabs = ["ingredients", "instructions"];
    const currentIndex = tabs.indexOf(activeTab);
    if (direction < 0 && currentIndex < tabs.length - 1) switchTab(tabs[currentIndex + 1]);
    else if (direction > 0 && currentIndex > 0) switchTab(tabs[currentIndex - 1]);
  };

  const fontSizes = ["1.6rem", "2.2rem", "3rem", "4rem"];
  const cycleFontSize = () => setFontSizeLevel((prev) => (prev + 1) % fontSizes.length);

  const originalServings = recipe.servings || 4;

  const ingredientsRaw = useMemo(() => parseIngredients(recipe), [recipe]);

  const cookingIngredients = useMemo(() => {
    let currentGroup = "";
    return ingredientsRaw.reduce((acc, item) => {
      if (isGroupHeader(item)) {
        currentGroup = getGroupName(item);
      } else {
        acc.push({ text: item, group: currentGroup });
      }
      return acc;
    }, []);
  }, [ingredientsRaw]);

  const ingredientsArray = ingredientsRaw;

  const instructionsArray = useMemo(() => {
    return Array.isArray(recipe.instructions)
      ? recipe.instructions
      : recipe.instructions
          ?.split(".")
          .map((item) => item.trim())
          .filter((item) => item && item.length > 10) || [];
  }, [recipe.instructions]);

  const scale = (ingredient) => scaleIngredient(ingredient, servings, originalServings);

  const handleNextStep = useCallback(() => {
    const totalSteps =
      activeTab === "ingredients" ? cookingIngredients.length : instructionsArray.length;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setShowCompletion(false);
    } else {
      setShowCompletion(true);
    }
  }, [activeTab, cookingIngredients.length, instructionsArray.length, currentStep]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  useEffect(() => {
    handleNextStepRef.current = handleNextStep;
    handlePrevStepRef.current = handlePrevStep;
    if (onStepHandlersReady) {
      onStepHandlersReady(
        handleNextStepRef, handlePrevStepRef, activeTab, setActiveTab,
        currentStep, cookingIngredients.length, setCurrentStep, setShowCompletion, showCompletion,
      );
    }
  }, [handleNextStep, handlePrevStep, onStepHandlersReady, activeTab, currentStep, cookingIngredients.length, setShowCompletion, showCompletion]);

  const handleScreenClick = () => { handleNextStepRef.current(); };

  const recipeLabel = recipe.name || t("recipes", "timer");
  const recipeTimers = timers.filter((tm) => tm.label === recipeLabel);

  const startTimer = (minutes, opts) => { addTimer(minutes, recipeLabel, opts); };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === "Escape") {
        closeRadio();
        onExitCookingMode();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleNextStep, handlePrevStep]);

  const totalSteps =
    activeTab === "ingredients" ? cookingIngredients.length : instructionsArray.length;
  const progress = totalSteps > 0 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0;

  const contextValue = {
    // props
    recipe, servings, setServings, onClose, onExitCookingMode,
    isListening, voiceEnabled, onToggleVoice,
    // state
    activeTab, setActiveTab, currentStep, setCurrentStep,
    showCompletion, setShowCompletion,
    customTimerInput, setCustomTimerInput,
    fontSizeLevel, fontSizes, showHelp, setShowHelp,
    // refs
    touchRef, savedStepRef, handleNextStepRef, handlePrevStepRef,
    // computed
    cookingIngredients, ingredientsArray, instructionsArray,
    totalSteps, progress, originalServings,
    // handlers
    handleNextStep, handlePrevStep, handleScreenClick,
    switchTab, handleTabSwipe, cycleFontSize, scale, startTimer,
    // timers
    timers, isTimerRunning, stopAll, removeTimer,
    // radio
    radioRef, closeRadio,
    // css + i18n
    classes, t,
  };

  return (
    <CookingModeContext.Provider value={contextValue}>
      <div className={classes.recipeCardCooking}>
        <CookingModeHeader />
        <CookingModeTabs />
        <CookingModeContent />
        <CookingModeBottomControls />
      </div>
    </CookingModeContext.Provider>
  );
}

export default RecipeDetailsCookingMode;
