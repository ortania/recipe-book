import { RotateCcw, Play, Clock, X } from "lucide-react";
import { AddButton } from "../../controls/add-button";
import { useCookingMode } from "./CookingModeContext";

export default function CookingModeBottomControls() {
  const {
    showCompletion, totalSteps, activeTab,
    currentStep, setCurrentStep, setShowCompletion,
    handlePrevStep, handleNextStep,
    customTimerInput, setCustomTimerInput,
    startTimer, timers, removeTimer,
    classes, t,
  } = useCookingMode();

  if (showCompletion || totalSteps === 0) return null;

  return (
    <div className={classes.bottomControls}>
      <div className={classes.navigationButtons}>
        <button
          onClick={(e) => { e.stopPropagation(); handlePrevStep(); }}
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
          onClick={(e) => { e.stopPropagation(); setCurrentStep(0); setShowCompletion(false); }}
          className={classes.restartButton}
        >
          <RotateCcw size={16} /> {t("recipes", "resetTimer")}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleNextStep(); }}
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
                <span className={classes.timerLabel}>{t("recipes", "timeInMinutes")}</span>
                <AddButton
                  sign="+"
                  type="circle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustomTimerInput(String((parseInt(customTimerInput) || 0) + 1));
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
                    const val = parseInt(customTimerInput) || 0;
                    if (val > 0) setCustomTimerInput(String(val - 1));
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
                disabled={!customTimerInput || parseInt(customTimerInput) <= 0}
                className={classes.startButton}
                style={{
                  cursor: customTimerInput && parseInt(customTimerInput) > 0 ? "pointer" : "not-allowed",
                  opacity: customTimerInput && parseInt(customTimerInput) > 0 ? 1 : 0.5,
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
                    <span className={classes.activeTimerLabel}>{tm.label}</span>
                    <span className={classes.activeTimerTime}>
                      {tm.remaining <= 0 && !tm.running
                        ? t("recipes", "timerDone")
                        : `${String(Math.floor(tm.remaining / 60)).padStart(2, "0")}:${String(tm.remaining % 60).padStart(2, "0")}`}
                    </span>
                    <button
                      className={classes.timerRemoveBtn}
                      onClick={(e) => { e.stopPropagation(); removeTimer(tm.id); }}
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
  );
}
