import React from "react";
import { ChevronRight, Lightbulb, ShieldAlert } from "lucide-react";
import { CloseButton } from "../../../controls";
import { useWizard } from "../WizardContext";

export default function VideoScreen() {
  const {
    setScreen,
    setImportError,
    handleClose,
    recipeVideoUrl,
    setRecipeVideoUrl,
    recipeVideoText,
    setRecipeVideoText,
    isImporting,
    importError,
    handleImportFromVideo,
    classes,
    shared,
    t,
  } = useWizard();

  const canContinue = recipeVideoText.trim().length > 0;

  return (
    <div className={classes.wizardContainer}>
      <div className={classes.screenTopBar}>
        <button
          type="button"
          className={classes.backLink}
          onClick={() => {
            setScreen("method");
            setImportError("");
          }}
        >
          <ChevronRight /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton onClick={handleClose} size={25} />
      </div>

      <h2 className={classes.screenTitle}>
        {t("addWizard", "fromVideoTitle")}
      </h2>
      <p className={classes.screenSubtitle}>
        {t("addWizard", "fromVideoSubtitle")}
      </p>

      <div className={`${classes.tipBox} ${classes.tipBoxPurple}`}>
        <span className={classes.tipIcon}>
          <Lightbulb size={16} />
        </span>
        <span>
          <span className={classes.tipBold}>{t("addWizard", "tip")}:</span>{" "}
          {t("addWizard", "videoTip")}
        </span>
      </div>

      <label className={classes.fieldLabel}>
        {t("addWizard", "pasteVideoText")}
      </label>
      <textarea
        className={shared.formTextarea}
        placeholder={t("addWizard", "pasteVideoTextPlaceholder")}
        value={recipeVideoText}
        onChange={(e) => setRecipeVideoText(e.target.value)}
      />

      <label className={classes.fieldLabel}>
        {t("addWizard", "videoUrlLabel")}
      </label>
      <input
        type="url"
        className={shared.formInput}
        placeholder={t("addWizard", "videoUrlPlaceholder")}
        value={recipeVideoUrl}
        onChange={(e) => setRecipeVideoUrl(e.target.value)}
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        dir="ltr"
      />

      <div className={classes.tipBox}>
        <span className={classes.tipIcon}>
          <ShieldAlert size={16} />
        </span>
        <span>{t("addWizard", "videoImageRightsHint")}</span>
      </div>

      {importError && <p className={classes.errorText}>{importError}</p>}

      <button
        className={classes.continueBtn}
        onClick={handleImportFromVideo}
        disabled={isImporting || !canContinue}
      >
        {isImporting
          ? t("addWizard", "importing")
          : t("addWizard", "parseAndImport")}
      </button>
    </div>
  );
}
