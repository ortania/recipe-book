import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  Lightbulb,
  RotateCcw,
  Square,
  Users,
  Type,
  List,
  ListOrdered,
  Music,
  Mic,
  Timer,
  Clock,
  Volume2,
  Smartphone,
  Play,
  X,
  UtensilsCrossed,
  PartyPopper,
  ChefHat,
  Check,
} from "lucide-react";
import { CookingVoiceChat } from "../cooking-voice-chat";
import {
  isGroupHeader,
  getGroupName,
  parseIngredients,
  scaleIngredient,
} from "../../utils/ingredientUtils";
import { CloseButton } from "../controls/close-button";
import { BackButton } from "../controls/back-button";
import { AddButton } from "../controls/add-button";
import { ChatHelpButton } from "../controls/chat-help-button";
import { useLanguage, useRadio } from "../../context";
import { useTimers } from "../../context/TimerContext";
import classes from "./recipe-details-cooking.module.css";

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
  const {
    addTimer,
    stopAll,
    removeTimer,
    timers,
    hasRunning: isTimerRunning,
  } = useTimers();
  const [activeTab, setActiveTab] = useState("instructions");
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState("");
  const [fontSizeLevel, setFontSizeLevel] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const { radioRef, closeRadio } = useRadio();
  const touchRef = useRef({ startX: 0, startY: 0 });
  // Remember step position per tab so switching back restores position
  const savedStepRef = useRef({ ingredients: 0, instructions: 0 });
  const switchTab = (newTab) => {
    if (newTab === activeTab) return;
    savedStepRef.current[activeTab] = showCompletion ? 0 : currentStep;
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

  const originalServings = recipe.servings || 4;
  const handleNextStepRef = useRef();
  const handlePrevStepRef = useRef();

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
  const scale = (ingredient) =>
    scaleIngredient(ingredient, servings, originalServings);

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

  const recipeLabel = recipe.name || t("recipes", "timer");
  const recipeTimers = timers.filter((tm) => tm.label === recipeLabel);

  const startTimer = (minutes, opts) => {
    addTimer(minutes, recipeLabel, opts);
  };

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
        closeRadio();
        onExitCookingMode();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleNextStep, handlePrevStep]);

  const totalSteps =
    activeTab === "ingredients"
      ? cookingIngredients.length
      : instructionsArray.length;
  const progress =
    totalSteps > 0 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0;

  return (
    <div className={classes.recipeCardCooking}>
      <div className={classes.headerButtonsCooking}>
        <div className={classes.headerLeft}>
          <BackButton
            onClick={() => {
              onClose();
            }}
          />
          {!(showCompletion && activeTab === "instructions") && (
            <ChatHelpButton
              title={t("cookingMode", "howToUse")}
              items={[
                {
                  content: (
                    <>
                      <Lightbulb
                        size="1.5em"
                        style={{
                          verticalAlign: "middle",
                          marginInlineEnd: "0.25rem",
                        }}
                      />
                      {t("cookingMode", "helpVolume")}
                    </>
                  ),
                },
                {
                  content: (
                    <>
                      <Smartphone
                        size="1.2em"
                        style={{
                          verticalAlign: "middle",
                          marginInlineEnd: "0.25rem",
                        }}
                      />
                      {t("cookingMode", "screenOn")}
                    </>
                  ),
                },
                t("cookingMode", "navTabs"),
                t("cookingMode", "navSteps"),
                {
                  content: (
                    <>
                      <Timer
                        size="3.5em"
                        style={{
                          verticalAlign: "middle",
                          marginInlineEnd: "0.25rem",
                        }}
                      />
                      {t("cookingMode", "timerTitle")} —{" "}
                      {t("cookingMode", "timerText")}
                    </>
                  ),
                },
                {
                  content: (
                    <>
                      <Music
                        size="1.5em"
                        style={{
                          verticalAlign: "middle",
                          marginInlineEnd: "0.25rem",
                        }}
                      />
                      {t("cookingMode", "radioTitle")} —{" "}
                      {t("cookingMode", "radioText")}
                    </>
                  ),
                },
                {
                  content: (
                    <>
                      <Mic
                        size="1.5em"
                        style={{
                          verticalAlign: "middle",
                          marginInlineEnd: "0.25rem",
                        }}
                      />
                      {t("cookingMode", "chatTitle")} —{" "}
                      {t("cookingMode", "chatText")}
                    </>
                  ),
                },
                {
                  section: t("cookingMode", "voiceSectionSteps"),
                  icon: <ListOrdered size={18} />,
                },
                { examples: t("cookingMode", "voiceStepsExamples") },
                {
                  section: t("cookingMode", "voiceSectionIngredients"),
                  icon: <UtensilsCrossed size={18} />,
                },
                { examples: t("cookingMode", "voiceIngredientsExamples") },
                {
                  section: t("cookingMode", "voiceSectionTimer"),
                  icon: <Timer size={18} />,
                },
                { examples: t("cookingMode", "voiceTimerExamples") },
                {
                  section: t("cookingMode", "voiceSectionRadio"),
                  icon: <Music size={18} />,
                },
                { examples: t("cookingMode", "voiceRadioExamples") },
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
            <Type size={20} />
          </button>
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
              onStartTimer={(minutes, opts) => startTimer(minutes, opts)}
              onStopTimer={() => {
                stopAll();
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

      {/* Sticky sub-header: tabs */}
      <div className={classes.subHeader}>
        <div className={classes.tabs}>
          <button
            className={`${classes.tab} ${activeTab === "ingredients" ? classes.activeTab : ""}`}
            onClick={() => switchTab("ingredients")}
          >
            <List className={classes.tabIcon} size={18} />
            {t("recipes", "ingredients")}
            {servings && (
              <span className={classes.headerServings}>
                (<Users size={14} />
                <span className={classes.headerServingsCount}>{servings}</span>)
              </span>
            )}
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
            onClick={() => switchTab("instructions")}
          >
            <ListOrdered className={classes.tabIcon} size={18} />
            {t("recipes", "instructions")}
          </button>
        </div>
      </div>

      {/* Middle content area - centered */}
      <div
        className={classes.middleContent}
        onClick={handleScreenClick}
        onTouchStart={(e) => {
          touchRef.current.startX = e.touches[0].clientX;
          touchRef.current.startY = e.touches[0].clientY;
        }}
        onTouchEnd={handleTabSwipe}
      >
        {/* Progress bar above content */}
        {!showCompletion && totalSteps > 0 && (
          <div className={classes.progressInfo}>
            <div className={classes.progressHeader}>
              <div className={classes.stepInfo}>
                {activeTab === "ingredients"
                  ? t("recipes", "ingredient")
                  : t("recipes", "step")}{" "}
                {currentStep + 1} {t("recipes", "of")} {totalSteps}
              </div>
              <div className={classes.progressBadge}>{progress}%</div>
            </div>
            <div className={classes.sliderContainer}>
              <input
                type="range"
                min="0"
                max={totalSteps - 1}
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
                  background: `linear-gradient(to right, var(--clr-accent-primary) 0%, var(--clr-accent-primary) ${progress}%, var(--clr-border-light) ${progress}%, var(--clr-border-light) 100%)`,
                }}
              />
            </div>
          </div>
        )}

        {/* Content display */}
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
                    {scale(item.text)}
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

        {showCompletion && (
          <div className={classes.completionSection}>
            <div className={classes.completionIcon}>
              {activeTab === "ingredients" ? (
                <PartyPopper size={48} />
              ) : (
                <ChefHat size={48} />
              )}
            </div>
            <div className={classes.completionTitle}>
              {activeTab === "ingredients"
                ? t("recipes", "ingredients") + " ✓"
                : t("recipes", "finish") + "!"}
            </div>
            <div className={classes.completionMessage}>
              {activeTab === "ingredients"
                ? t("recipes", "ingredientsDoneMsg")
                : t("recipes", "cookingDoneMsg")}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (activeTab === "ingredients") {
                  savedStepRef.current.instructions = 0;
                  switchTab("instructions");
                } else {
                  closeRadio();
                  onExitCookingMode();
                }
              }}
              className={classes.completionButton}
            >
              {activeTab === "ingredients" ? (
                <>
                  <Play size={18} /> {t("recipes", "startCooking")}
                </>
              ) : (
                <>
                  <Check size={18} /> {t("recipes", "finish")}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {!showCompletion && totalSteps > 0 && (
        <div className={classes.bottomControls}>
          <div className={classes.navigationButtons}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevStep();
              }}
              disabled={currentStep === 0}
              className={classes.navButton}
              style={{
                backgroundColor: currentStep === 0 ? "#f3f4f6" : "#e8eaed",
                color: currentStep === 0 ? "#9ca3af" : "#635555",
                cursor: currentStep === 0 ? "not-allowed" : "pointer",
                opacity: currentStep === 0 ? 0.6 : 1,
                border: "1px solid #635555",
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
              <RotateCcw size={16} /> {t("recipes", "resetTimer")}
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

          {activeTab === "instructions" && (
            <div className={classes.timerSection}>
              <div className={classes.timerContent}>
                <div className={classes.timerInputGroup}>
                  <div className={classes.timerControlsFrame}>
                    <span className={classes.timerLabel}>
                      {t("recipes", "timeInMinutes")}
                    </span>

                    <AddButton
                      sign="+"
                      type="circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentValue = parseInt(customTimerInput) || 0;
                        setCustomTimerInput(String(currentValue + 1));
                      }}
                    />

                    <div className={classes.timerDisplay}>
                      <input
                        min="0"
                        max="180"
                        placeholder="0"
                        value={customTimerInput}
                        onChange={(e) => setCustomTimerInput(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={classes.timerInput}
                      />
                    </div>

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
                    />
                  </div>

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
                    <Play size={18} /> {t("recipes", "addTimer")}
                  </button>
                </div>
                {timers.length > 0 && (
                  <div className={classes.activeTimersList}>
                    {timers.map((tm) => (
                      <div
                        key={tm.id}
                        className={`${classes.activeTimerRow} ${tm.remaining <= 0 && !tm.running ? classes.timerDone : ""}`}
                      >
                        <Clock size={14} className={classes.timerClockIcon} />
                        <span className={classes.activeTimerLabel}>
                          {tm.label}
                        </span>
                        <span className={classes.activeTimerTime}>
                          {tm.remaining <= 0 && !tm.running
                            ? t("recipes", "timerDone")
                            : `${String(Math.floor(tm.remaining / 60)).padStart(2, "0")}:${String(tm.remaining % 60).padStart(2, "0")}`}
                        </span>
                        <button
                          className={classes.timerRemoveBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTimer(tm.id);
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecipeDetailsCookingMode;
