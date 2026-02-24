import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { VscDebugRestart } from "react-icons/vsc";
import { FaStop } from "react-icons/fa";
import { TbUsers } from "react-icons/tb";
import { IoChevronBackOutline } from "react-icons/io5";
import { AiOutlineFontSize } from "react-icons/ai";
import {
  MdFormatSize,
  MdOutlineFormatListBulleted,
  MdOutlineFormatListNumbered,
} from "react-icons/md";
import { IoMusicalNotesOutline } from "react-icons/io5";
import { CookingVoiceChat } from "../cooking-voice-chat";
import { RadioPlayer } from "../radio-player";
import { isGroupHeader, getGroupName, parseIngredients } from "../../utils/ingredientUtils";
import { CloseButton } from "../controls/close-button";
import { AddButton } from "../controls/add-button";
import { ChatHelpButton } from "../controls/chat-help-button";
import { useLanguage } from "../../context";
import classes from "./recipe-details-cooking.module.css";

function RecipeDetailsCookingMode({
  recipe,
  onClose,
  onExitCookingMode,
  isListening,
  onStepHandlersReady,
  voiceEnabled,
  onToggleVoice,
}) {
  const { t } = useLanguage();
  // State management
  const [activeTab, setActiveTab] = useState("instructions");
  const [servings, setServings] = useState(recipe.servings || 4);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [fontSizeLevel, setFontSizeLevel] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [showRadio, setShowRadio] = useState(false);
  const radioRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0 });
  // Remember step position per tab so switching back restores position
  const savedStepRef = useRef({ ingredients: 0, instructions: 0 });
  const switchTab = (newTab) => {
    if (newTab === activeTab) return;
    savedStepRef.current[activeTab] = currentStep;
    setActiveTab(newTab);
    setCurrentStep(savedStepRef.current[newTab] || 0);
    setShowCompletion(false);
  };

  const handleTabSwipe = (e) => {
    const diffX = e.changedTouches[0].clientX - touchRef.current.startX;
    const diffY = Math.abs(
      e.changedTouches[0].clientY - touchRef.current.startY,
    );
    if (diffY > Math.abs(diffX) || Math.abs(diffX) < 50) return;
    const isRTL = document.documentElement.dir === "rtl";
    const direction = isRTL ? -diffX : diffX;
    const tabs = ["ingredients", "instructions"];
    const currentIndex = tabs.indexOf(activeTab);
    if (direction < 0 && currentIndex < tabs.length - 1) {
      switchTab(tabs[currentIndex + 1]);
    } else if (direction > 0 && currentIndex > 0) {
      switchTab(tabs[currentIndex - 1]);
    }
  };
  const fontSizes = ["1.6rem", "2.2rem", "3rem", "4rem"];
  const cycleFontSize = () =>
    setFontSizeLevel((prev) => (prev + 1) % fontSizes.length);

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  const [showVolumeNotification, setShowVolumeNotification] =
    useState(isMobile);

  const originalServings = recipe.servings || 4;
  const handleNextStepRef = useRef();
  const handlePrevStepRef = useRef();
  const timerStartTimeRef = useRef(null);
  const isFirstTickRef = useRef(false);

  const stopRadio = useCallback(() => {
    try { radioRef.current?.pause(); } catch {}
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => stopRadio();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopRadio();
    };
  }, [stopRadio]);

  useEffect(() => {
    if (!showVolumeNotification) return;
    const timer = setTimeout(() => {
      setShowVolumeNotification(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Parse ingredients and instructions
  const ingredientsRaw = useMemo(() => parseIngredients(recipe), [recipe]);

  // For cooking mode: build a list of actual ingredients with their group context
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

  // Keep ingredientsArray as the full raw array for voice chat context
  const ingredientsArray = ingredientsRaw;

  const instructionsArray = useMemo(() => {
    return Array.isArray(recipe.instructions)
      ? recipe.instructions
      : recipe.instructions
          ?.split(".")
          .map((item) => item.trim())
          .filter((item) => item && item.length > 10) || [];
  }, [recipe.instructions]);

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

  // Navigation handlers
  const handleNextStep = useCallback(() => {
    const totalSteps =
      activeTab === "ingredients"
        ? cookingIngredients.length
        : instructionsArray.length;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setShowCompletion(false);
    } else {
      setShowCompletion(true);
    }
  }, [
    activeTab,
    cookingIngredients.length,
    instructionsArray.length,
    currentStep,
  ]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Update refs
  useEffect(() => {
    handleNextStepRef.current = handleNextStep;
    handlePrevStepRef.current = handlePrevStep;

    // Notify parent that handlers are ready
    if (onStepHandlersReady) {
      onStepHandlersReady(
        handleNextStepRef,
        handlePrevStepRef,
        activeTab,
        setActiveTab,
        currentStep,
        cookingIngredients.length,
        setCurrentStep,
        setShowCompletion,
        showCompletion,
      );
    }
  }, [
    handleNextStep,
    handlePrevStep,
    onStepHandlersReady,
    activeTab,
    currentStep,
    cookingIngredients.length,
    setShowCompletion,
    showCompletion,
  ]);

  const handleScreenClick = () => {
    handleNextStepRef.current();
  };

  // Timer functions
  const startTimer = (minutes) => {
    setTotalSeconds(minutes * 60);
    setIsTimerRunning(true);

    // Voice announcement for timer start
    const utterance = new SpeechSynthesisUtterance(
      `Timer started for ${minutes} minutes`,
    );
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Timer countdown effect
  useEffect(() => {
    if (!isTimerRunning || totalSeconds <= 0) return;

    const interval = setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          // Voice announcement for timer end
          setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance("Timer finished");
            utterance.lang = "en-US";
            utterance.rate = 0.9;
            utterance.volume = 1.0;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, totalSeconds]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === "Escape") {
        stopRadio();
        onExitCookingMode();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleNextStep, handlePrevStep]);

  return (
    <div className={classes.recipeCardCooking}>
      {showVolumeNotification && (
        <div
          className={classes.volumeNotification}
          onClick={() => setShowVolumeNotification(false)}
        >
          � {t("cookingMode", "volumeWarning")}
        </div>
      )}

      <div className={classes.headerButtonsCooking}>
        <div className={classes.headerLeft}>
          <button
            onClick={() => {
              stopRadio();
              onClose();
            }}
            className={classes.backButton}
            title={t("common", "back")}
          >
            <IoChevronBackOutline />
          </button>
          {!(showCompletion && activeTab === "instructions") && (
            <ChatHelpButton
              title={t("cookingMode", "howToUse")}
              items={[
                `🔊 ${t("cookingMode", "helpVolume")}`,
                t("cookingMode", "navTabs"),
                t("cookingMode", "navSteps"),
                `⏱️ ${t("cookingMode", "timerTitle")} — ${t("cookingMode", "timerText")}`,
                `${t("cookingMode", "chatTitle")} — ${t("cookingMode", "chatText")}`,
                t("cookingMode", "chatFeature1"),
                t("cookingMode", "chatFeature2"),
                t("cookingMode", "chatFeature3"),
                t("cookingMode", "chatFeature4"),
                t("cookingMode", "chatFeature5"),
                t("cookingMode", "radioFeature"),
              ]}
              onToggle={setShowHelp}
            />
          )}
        </div>
        <h3 className={classes.headerTitle}>{t("recipes", "cookingMode")}</h3>
        <div className={classes.headerRight}>
          <button
            className={classes.fontSizeBtn}
            onClick={cycleFontSize}
            title="גודל פונט"
          >
            <AiOutlineFontSize />
          </button>
          <div className={classes.helpWrapper}>
            <button
              className={`${classes.radioBtn} ${showRadio ? classes.radioBtnActive : ""}`}
              onClick={() => setShowRadio((v) => !v)}
              title={t("radio", "title")}
            >
              <IoMusicalNotesOutline />
            </button>
            {showHelp && <div className={classes.helpArrow} />}
          </div>
          <div className={classes.helpWrapper}>
            <CookingVoiceChat
              recipe={recipe}
              ingredients={ingredientsArray}
              instructions={instructionsArray}
              currentStep={currentStep}
              servings={servings}
              activeTab={activeTab}
              onNextStep={() => handleNextStepRef.current()}
              onPrevStep={() => handlePrevStepRef.current()}
              onGotoStep={(step) => {
                setCurrentStep(step);
                setShowCompletion(false);
              }}
              onStartTimer={(minutes) => startTimer(minutes)}
              onStopTimer={() => {
                setIsTimerRunning(false);
                setTotalSeconds(0);
                setCustomTimerInput("");
              }}
              onSwitchTab={(tab) => {
                switchTab(tab);
              }}
              isTimerRunning={isTimerRunning}
              radioRef={radioRef}
            />
            {showHelp && <div className={classes.helpArrow} />}
          </div>
        </div>
      </div>

      <RadioPlayer
        ref={radioRef}
        open={showRadio}
        onClose={() => setShowRadio(false)}
      />

      <div className={classes.recipeContent}>
        {recipe.servings && (
          <div className={classes.servingSelector}>
            <div className={classes.servingControls}>
              <AddButton
                type="circle"
                sign="+"
                className={classes.servingButtonCooking}
                onClick={() => setServings(servings + 1)}
              />
              <span>{servings}</span>
              <AddButton
                type="circle"
                sign="-"
                className={classes.servingButtonCooking}
                onClick={() => setServings(Math.max(1, servings - 1))}
              />
            </div>
            <span className={classes.servingLabelCooking}>
              <TbUsers className={classes.servingIcon} />
              {t("recipes", "servings")}
            </span>
          </div>
        )}

        <div className={classes.tabs}>
          <button
            className={`${classes.tab} ${activeTab === "ingredients" ? classes.activeTab : ""}`}
            onClick={() => {
              switchTab("ingredients");
            }}
          >
            <MdOutlineFormatListBulleted className={classes.tabIcon} />
            {t("recipes", "ingredients")}
            {activeTab === "ingredients" &&
              voiceEnabled &&
              currentStep >= cookingIngredients.length - 1 && (
                <span className={classes.voiceHint}>
                  {" "}
                  (Say "Start" to begin cooking)
                </span>
              )}
          </button>
          <button
            className={`${classes.tab} ${activeTab === "instructions" ? classes.activeTab : ""}`}
            onClick={() => {
              switchTab("instructions");
            }}
          >
            <MdOutlineFormatListNumbered className={classes.tabIcon} />
            {t("recipes", "instructions")}
          </button>
        </div>

        <div
          className={classes.tabContent}
          onClick={handleScreenClick}
          onTouchStart={(e) => {
            touchRef.current.startX = e.touches[0].clientX;
            touchRef.current.startY = e.touches[0].clientY;
          }}
          onTouchEnd={handleTabSwipe}
        >
          {activeTab === "ingredients" && !showCompletion && (
            <ul className={classes.ingredientsList}>
              {cookingIngredients.length > 0 ? (
                cookingIngredients.map((item, index) => (
                  <li
                    key={index}
                    className={classes.ingredientItem}
                    style={{
                      display: index !== currentStep ? "none" : "flex",
                    }}
                  >
                    {item.group && (
                      <span className={classes.cookingGroupLabel}>
                        {item.group}
                      </span>
                    )}
                    <span
                      className={classes.ingredientText}
                      style={{ fontSize: fontSizes[fontSizeLevel] }}
                    >
                      {scaleIngredient(item.text)}
                    </span>
                  </li>
                ))
              ) : (
                <p>{t("recipes", "noIngredientsListed")}</p>
              )}
            </ul>
          )}

          {activeTab === "instructions" && !showCompletion && (
            <ol className={classes.instructionsList}>
              {instructionsArray.length > 0 ? (
                instructionsArray.map((instruction, index) => (
                  <li
                    key={index}
                    className={classes.instructionItem}
                    style={{
                      display: index !== currentStep ? "none" : "flex",
                    }}
                  >
                    <span
                      className={classes.instructionText}
                      style={{ fontSize: fontSizes[fontSizeLevel] }}
                    >
                      {instruction}
                    </span>
                  </li>
                ))
              ) : (
                <p>{t("recipes", "noInstructionsListed")}</p>
              )}
            </ol>
          )}
          {!showCompletion && (
            <div className={classes.progressSection}>
              <div className={classes.progressHeader}>
                <div className={classes.stepInfo}>
                  {activeTab === "ingredients"
                    ? t("recipes", "ingredient")
                    : t("recipes", "step")}{" "}
                  {currentStep + 1} {t("recipes", "of")}{" "}
                  {activeTab === "ingredients"
                    ? cookingIngredients.length
                    : instructionsArray.length}
                </div>
                <div className={classes.progressBadge}>
                  {Math.round(
                    ((currentStep + 1) /
                      (activeTab === "ingredients"
                        ? cookingIngredients.length
                        : instructionsArray.length)) *
                      100,
                  )}
                  %
                </div>
              </div>

              {/* Interactive Progress Slider */}
              <div className={classes.sliderContainer}>
                <input
                  type="range"
                  min="0"
                  max={
                    (activeTab === "ingredients"
                      ? cookingIngredients.length
                      : instructionsArray.length) - 1
                  }
                  value={currentStep}
                  onChange={(e) => {
                    e.stopPropagation();
                    setCurrentStep(parseInt(e.target.value));
                    setShowCompletion(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={classes.progressSlider}
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((currentStep + 1) / (activeTab === "ingredients" ? cookingIngredients.length : instructionsArray.length)) * 100}%, #e5e7eb ${((currentStep + 1) / (activeTab === "ingredients" ? cookingIngredients.length : instructionsArray.length)) * 100}%, #e5e7eb 100%)`,
                  }}
                />
              </div>

              {/* Navigation Buttons */}
              <div className={classes.navigationButtons}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevStep();
                  }}
                  disabled={currentStep === 0}
                  className={classes.navButton}
                  style={{
                    backgroundColor: currentStep === 0 ? "#f3f4f6" : "##e8eaed",
                    color: currentStep === 0 ? "#9ca3af" : "#6b7280",
                    cursor: currentStep === 0 ? "not-allowed" : "pointer",
                    opacity: currentStep === 0 ? 0.6 : 1,
                  }}
                >
                  → {t("recipes", "prev")}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentStep(0);
                    setShowCompletion(false);
                  }}
                  className={classes.restartButton}
                >
                  <VscDebugRestart /> {t("recipes", "resetTimer")}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextStep();
                  }}
                  className={classes.nextButton}
                >
                  {t("recipes", "next")} ←
                </button>
              </div>

              {/* Timer Section - Only show in Instructions tab */}
              {activeTab === "instructions" && (
                <div className={classes.timerSection}>
                  <div className={classes.timerContent}>
                    <div className={classes.timerTitle}>
                      <span>🔥</span>
                      {t("recipes", "timer")}
                    </div>

                    <div className={classes.timerControls}>
                      <AddButton
                        sign="-"
                        type="circle"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentValue = parseInt(customTimerInput) || 0;
                          if (currentValue > 0) {
                            setCustomTimerInput(String(currentValue - 1));
                          }
                        }}
                        className={classes.timerButton}
                        disabled={isTimerRunning}
                      />

                      <div className={classes.timerDisplay}>
                        {isTimerRunning ? (
                          <div className={classes.timerInput}>
                            {String(Math.floor(totalSeconds / 60)).padStart(
                              2,
                              "0",
                            )}
                            :{String(totalSeconds % 60).padStart(2, "0")}
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max="180"
                            value={customTimerInput || "00"}
                            onChange={(e) =>
                              setCustomTimerInput(e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className={classes.timerInput}
                          />
                        )}
                      </div>

                      <AddButton
                        sign="+"
                        type="circle"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentValue = parseInt(customTimerInput) || 0;
                          setCustomTimerInput(String(currentValue + 1));
                        }}
                        className={classes.timerButton}
                        disabled={isTimerRunning}
                      />
                    </div>

                    {!isTimerRunning ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const minutes = parseInt(customTimerInput);
                          if (minutes && minutes > 0) {
                            startTimer(minutes);
                            setCustomTimerInput("");
                          }
                        }}
                        disabled={
                          !customTimerInput || parseInt(customTimerInput) <= 0
                        }
                        className={classes.startButton}
                        style={{
                          cursor:
                            customTimerInput && parseInt(customTimerInput) > 0
                              ? "pointer"
                              : "not-allowed",
                          opacity:
                            customTimerInput && parseInt(customTimerInput) > 0
                              ? 1
                              : 0.5,
                        }}
                      >
                        ▶ {t("recipes", "startTimer")}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTimerRunning(false);
                          setTotalSeconds(0);
                          setCustomTimerInput("");
                        }}
                        className={classes.stopButton}
                      >
                        <FaStop />
                        {t("recipes", "stopTimer")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {showCompletion && (
            <div className={classes.completionSection}>
              <div className={classes.completionIcon}>🎉</div>
              <div className={classes.completionTitle}>
                {activeTab === "ingredients"
                  ? t("recipes", "ingredients") + " ✓"
                  : t("recipes", "finish") + "!"}
              </div>
              <div className={classes.completionMessage}>
                {activeTab === "ingredients"
                  ? "Great job! Ready to start cooking? Switch to Instructions."
                  : "Enjoy your delicious meal! 👨‍🍳"}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTab === "ingredients") {
                    switchTab("instructions");
                  } else {
                    stopRadio();
                    onExitCookingMode();
                  }
                }}
                className={classes.completionButton}
              >
                {activeTab === "ingredients"
                  ? "▶️ " + t("recipes", "startCooking")
                  : "✓ " + t("recipes", "finish")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeDetailsCookingMode;
