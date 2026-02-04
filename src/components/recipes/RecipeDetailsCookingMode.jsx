import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { VscDebugRestart } from "react-icons/vsc";
import { PiMicrophoneThin, PiMicrophoneSlashThin } from "react-icons/pi";
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
  // State management
  const [activeTab, setActiveTab] = useState("ingredients");
  const [servings, setServings] = useState(recipe.servings || 4);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [showVolumeNotification, setShowVolumeNotification] = useState(true);

  const originalServings = recipe.servings || 4;
  const handleNextStepRef = useRef();
  const handlePrevStepRef = useRef();
  const timerStartTimeRef = useRef(null);
  const isFirstTickRef = useRef(false);

  // Hide volume notification after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVolumeNotification(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

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
        ? ingredientsArray.length
        : instructionsArray.length;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setShowCompletion(false);
    } else {
      setShowCompletion(true);
    }
  }, [
    activeTab,
    ingredientsArray.length,
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
        ingredientsArray.length,
        setCurrentStep,
        setShowCompletion,
      );
    }
  }, [
    handleNextStep,
    handlePrevStep,
    onStepHandlersReady,
    activeTab,
    currentStep,
    ingredientsArray.length,
    setShowCompletion,
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
        onExitCookingMode();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleNextStep, handlePrevStep]);

  return (
    <div className={classes.recipeCardCooking}>
      {/* Volume Notification */}
      {showVolumeNotification && (
        <div className={classes.volumeNotification}>
          💡 הורד את עוצמת ההתראות במובייל במצב בישול
        </div>
      )}

      <div className={classes.headerButtonsCooking}>
        {/* Voice Recognition Indicator */}
        <button
          onClick={onToggleVoice}
          className={classes.voiceToggleButton}
          style={{
            background: voiceEnabled
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          }}
        >
          {/* <span>🎤</span> */}
          <span>
            {/* {voiceEnabled ? <PiMicrophoneThin /> : <PiMicrophoneSlashThin />} */}
            <PiMicrophoneThin />
          </span>
          <span>{voiceEnabled ? "Stop Mic" : "Start Mic"}</span>
        </button>
        <div
          className={classes.voiceRecognitionIndicator}
          // style={{
          //   background: isListening
          //     ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
          //     : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
          //   boxShadow: isListening
          //     ? "0 2px 10px rgba(16, 185, 129, 0.4)"
          //     : "0 2px 10px rgba(100, 116, 139, 0.4)",
          // }}
        >
          {/* <span>🎤</span> */}{" "}
          <span>
            {voiceEnabled ? <PiMicrophoneThin /> : <PiMicrophoneSlashThin />}
          </span>
          <span>{isListening ? "מקשיב..." : "לא מקשיב"}</span>
        </div>
        <button onClick={onClose} className={classes.closeButton}>
          ✕
        </button>
      </div>

      <div className={classes.recipeContent}>
        {recipe.servings && (
          <div className={classes.servingSelector}>
            <div className={classes.servingControls}>
              <button
                className={classes.servingButtonCooking}
                onClick={() => setServings(servings + 1)}
              >
                <span>+</span>
              </button>
              <span>{servings}</span>
              <button
                className={classes.servingButtonCooking}
                onClick={() => setServings(Math.max(1, servings - 1))}
              >
                <span>-</span>
              </button>
            </div>
            <span className={classes.servingLabelCooking}>
              Serving {servings}
            </span>
          </div>
        )}

        <div className={classes.tabs}>
          <button
            className={`${classes.tab} ${activeTab === "ingredients" ? classes.activeTab : ""}`}
            onClick={() => {
              setActiveTab("ingredients");
              setCurrentStep(0);
            }}
          >
            Ingredients
            {activeTab === "ingredients" &&
              voiceEnabled &&
              currentStep >= ingredientsArray.length - 1 && (
                <span className={classes.voiceHint}>
                  {" "}
                  (Say "Start" to begin cooking)
                </span>
              )}
          </button>
          <button
            className={`${classes.tab} ${activeTab === "instructions" ? classes.activeTab : ""}`}
            onClick={() => {
              setActiveTab("instructions");
              setCurrentStep(0);
            }}
          >
            Instructions
          </button>
        </div>

        <div className={classes.tabContent} onClick={handleScreenClick}>
          {!showCompletion && (
            <div className={classes.progressSection}>
              <div className={classes.progressHeader}>
                <div className={classes.stepInfo}>
                  Step {currentStep + 1} of{" "}
                  {activeTab === "ingredients"
                    ? ingredientsArray.length
                    : instructionsArray.length}
                </div>
                <div className={classes.progressBadge}>
                  {Math.round(
                    ((currentStep + 1) /
                      (activeTab === "ingredients"
                        ? ingredientsArray.length
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
                      ? ingredientsArray.length
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
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((currentStep + 1) / (activeTab === "ingredients" ? ingredientsArray.length : instructionsArray.length)) * 100}%, #e5e7eb ${((currentStep + 1) / (activeTab === "ingredients" ? ingredientsArray.length : instructionsArray.length)) * 100}%, #e5e7eb 100%)`,
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
                    backgroundColor: currentStep === 0 ? "#f3f4f6" : "#ffffff",
                    color: currentStep === 0 ? "#9ca3af" : "#6b7280",
                    cursor: currentStep === 0 ? "not-allowed" : "pointer",
                    opacity: currentStep === 0 ? 0.6 : 1,
                  }}
                >
                  ← Previous
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentStep(0);
                    setShowCompletion(false);
                  }}
                  className={classes.restartButton}
                >
                  <VscDebugRestart /> Restart
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextStep();
                  }}
                  className={classes.nextButton}
                >
                  Next →
                </button>
              </div>

              {/* Instructions */}
              <div className={classes.instructions}>
                <span>
                  👆 <strong>Click</strong> = Next Step
                </span>
                <span>
                  ⌨️ <strong>←→</strong> Navigate
                </span>
                <span>
                  🎤 <strong>Next/Previous</strong> Voice
                </span>
                {/* <span>
                  <strong>ESC</strong> Exit
                </span> */}
              </div>

              {/* Timer Section - Only show in Instructions tab */}
              {activeTab === "instructions" && (
                <div className={classes.timerSection}>
                  <div className={classes.timerContent}>
                    <div className={classes.timerTitle}>
                      <span>⏱️</span>
                      Cooking Timer
                    </div>

                    <div className={classes.timerControls}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentValue = parseInt(customTimerInput) || 0;
                          if (currentValue > 0) {
                            setCustomTimerInput(String(currentValue - 1));
                          }
                        }}
                        className={classes.timerButton}
                        disabled={isTimerRunning}
                      >
                        −
                      </button>

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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentValue = parseInt(customTimerInput) || 0;
                          setCustomTimerInput(String(currentValue + 1));
                        }}
                        className={classes.timerButton}
                        disabled={isTimerRunning}
                      >
                        +
                      </button>

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
                          ▶️ Start
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
                          ⏹️ Stop
                        </button>
                      )}
                    </div>
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
                  ? "All Ingredients Ready!"
                  : "Recipe Complete!"}
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
                    setActiveTab("instructions");
                    setCurrentStep(0);
                    setShowCompletion(false);
                  } else {
                    onExitCookingMode();
                  }
                }}
                className={classes.completionButton}
              >
                {activeTab === "ingredients" ? "▶️ Start Cooking" : "✓ Done"}
              </button>
            </div>
          )}

          {activeTab === "ingredients" && !showCompletion && (
            <ul className={classes.ingredientsList}>
              {ingredientsArray.length > 0 ? (
                ingredientsArray.map((ingredient, index) => (
                  <li
                    key={index}
                    className={classes.ingredientItem}
                    style={{
                      display: index !== currentStep ? "none" : "flex",
                    }}
                  >
                    <span className={classes.ingredientText}>
                      {scaleIngredient(ingredient)}
                    </span>
                  </li>
                ))
              ) : (
                <p>No ingredients listed</p>
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
                    <span className={classes.instructionText}>
                      {instruction}
                    </span>
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

export default RecipeDetailsCookingMode;
