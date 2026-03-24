import { Play, Check, PartyPopper, ChefHat } from "lucide-react";
import { useCookingMode } from "./CookingModeContext";

export default function CookingModeContent() {
  const {
    activeTab, showCompletion, totalSteps, progress,
    currentStep, setCurrentStep, setShowCompletion,
    cookingIngredients, instructionsArray,
    scale, fontSizes, fontSizeLevel,
    savedStepRef, switchTab, closeRadio, onExitCookingMode,
    handleScreenClick, touchRef, handleTabSwipe,
    classes, t,
  } = useCookingMode();

  return (
    <div
      className={classes.middleContent}
      onClick={handleScreenClick}
      onTouchStart={(e) => {
        touchRef.current.startX = e.touches[0].clientX;
        touchRef.current.startY = e.touches[0].clientY;
      }}
      onTouchEnd={handleTabSwipe}
    >
      {/* Progress bar */}
      {!showCompletion && totalSteps > 0 && (
        <div className={classes.progressInfo}>
          <div className={classes.progressHeader}>
            <div className={classes.stepInfo}>
              {activeTab === "ingredients" ? t("recipes", "ingredient") : t("recipes", "step")}{" "}
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

      {/* Ingredients */}
      {activeTab === "ingredients" && !showCompletion && (
        <ul className={classes.ingredientsList}>
          {cookingIngredients.length > 0 ? (
            cookingIngredients.map((item, index) => (
              <li
                key={index}
                className={classes.ingredientItem}
                style={{ display: index !== currentStep ? "none" : "flex" }}
              >
                {item.group && (
                  <span className={classes.cookingGroupLabel}>{item.group}</span>
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

      {/* Instructions */}
      {activeTab === "instructions" && !showCompletion && (
        <ol className={classes.instructionsList}>
          {instructionsArray.length > 0 ? (
            instructionsArray.map((instruction, index) => (
              <li
                key={index}
                className={classes.instructionItem}
                style={{ display: index !== currentStep ? "none" : "flex" }}
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

      {/* Completion */}
      {showCompletion && (
        <div className={classes.completionSection}>
          <div className={classes.completionIcon}>
            {activeTab === "ingredients" ? <PartyPopper size={48} /> : <ChefHat size={48} />}
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
              <><Play size={18} /> {t("recipes", "startCooking")}</>
            ) : (
              <><Check size={18} /> {t("recipes", "finish")}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
