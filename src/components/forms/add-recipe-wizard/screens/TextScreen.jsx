import React from "react";
import { ChevronRight, Lightbulb } from "lucide-react";
import { CloseButton } from "../../../controls";
import { useWizard } from "../WizardContext";

export default function TextScreen() {
  const {
    setScreen,
    setImportError,
    handleClose,
    recipeText,
    setRecipeText,
    isImporting,
    importError,
    handleImportFromText,
    classes,
    shared,
    t,
  } = useWizard();

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
        {t("addWizard", "fromTextTitle")}
      </h2>
      <p className={classes.screenSubtitle}>
        {t("addWizard", "fromTextSubtitle")}
      </p>

      <label className={classes.fieldLabel}>
        {t("addWizard", "recipeTextLabel")}
      </label>
      <textarea
        className={shared.formTextarea}
        placeholder={t("addWizard", "textPlaceholder")}
        value={recipeText}
        onChange={(e) => setRecipeText(e.target.value)}
      />

      <div className={`${classes.tipBox} ${classes.tipBoxPurple}`}>
        <span className={classes.tipIcon}>
          <Lightbulb size={16} />
        </span>
        <span>
          <span className={classes.tipBold}>{t("addWizard", "tip")}:</span>{" "}
          {t("addWizard", "textTip")}
        </span>
      </div>

      {importError && <p className={classes.errorText}>{importError}</p>}

      <button
        className={classes.continueBtn}
        onClick={handleImportFromText}
        disabled={isImporting || !recipeText.trim()}
      >
        {isImporting
          ? t("addWizard", "importing")
          : t("addWizard", "parseAndImport")}
      </button>
    </div>
  );
}
