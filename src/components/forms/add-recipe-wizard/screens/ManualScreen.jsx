import React from "react";
import { ChevronRight, Info, Loader2 } from "lucide-react";
import { CloseButton } from "../../../controls";
import { useWizard } from "../WizardContext";
import BasicInfoStep from "../steps/BasicInfoStep";
import IngredientsStep from "../steps/IngredientsStep";
import InstructionsStep from "../steps/InstructionsStep";
import ImageCategoriesStep from "../steps/ImageCategoriesStep";
import SummaryStep from "../steps/SummaryStep";

const STEP_LABELS = [
  "basicInfo",
  "ingredients",
  "instructions",
  "imageCategories",
  "summary",
];

export default function ManualScreen() {
  const {
    recipe,
    handleManualBack,
    cameFromRecording,
    handleClose,
    manualStep,
    visitedSteps,
    canNavigateToStep,
    handleStepClick,
    stepError,
    canProceed,
    saving,
    saveToastOpen,
    uploadingImage,
    generatingAiImage,
    handlePrev,
    handleNext,
    classes,
    t,
  } = useWizard();

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

  const renderManualStep = () => {
    switch (manualStep) {
      case 0:
        return <BasicInfoStep />;
      case 1:
        return <IngredientsStep />;
      case 2:
        return <InstructionsStep />;
      case 3:
        return <ImageCategoriesStep />;
      case 4:
        return <SummaryStep />;
      default:
        return null;
    }
  };

  return (
    <div className={classes.wizardContainer}>
      <div className={classes.manualTopBar}>
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
        />
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
        {stepError && <p className={classes.stepErrorText}>{stepError}</p>}
        <div className={classes.navButtonsRow}>
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
            disabled={
              !canProceed() ||
              saving ||
              saveToastOpen ||
              uploadingImage ||
              generatingAiImage
            }
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
          </button>
        </div>
      </div>
    </div>
  );
}
