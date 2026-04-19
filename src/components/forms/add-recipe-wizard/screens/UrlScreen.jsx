import React from "react";
import { ChevronRight, Lightbulb } from "lucide-react";
import { CloseButton } from "../../../controls";
import { useWizard } from "../WizardContext";

export default function UrlScreen() {
  const {
    setScreen,
    setImportError,
    handleClose,
    recipeUrl,
    setRecipeUrl,
    recipeAuthor,
    setRecipeAuthor,
    isImporting,
    importError,
    importProgress,
    handleImportFromUrl,
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

      <h2 className={classes.screenTitle}>{t("addWizard", "fromUrlTitle")}</h2>
      <p className={classes.screenSubtitle}>
        {t("addWizard", "fromUrlSubtitle")}
      </p>

      <label className={classes.fieldLabel}>
        {t("addWizard", "recipeLink")}
      </label>
      <input
        type="url"
        className={shared.formInput}
        placeholder="https://example.com/recipe/chocolate-cake"
        value={recipeUrl}
        onChange={(e) => setRecipeUrl(e.target.value)}
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        dir="ltr"
      />

      <label className={classes.fieldLabel}>
        {t("addWizard", "recipeAuthor")} ({t("common", "optional")})
      </label>
      <input
        type="text"
        className={shared.formInput}
        placeholder={t("addWizard", "authorPlaceholder")}
        value={recipeAuthor}
        onChange={(e) => setRecipeAuthor(e.target.value)}
      />

      <div className={classes.tipBox}>
        <span className={classes.tipIcon}>
          <Lightbulb size={16} />
        </span>
        <span>
          <span className={classes.tipBold}>{t("addWizard", "tip")}:</span>{" "}
          {t("addWizard", "urlTip")}
        </span>
      </div>

      {isImporting && (
        <>
          <div className={classes.progressBarContainer}>
            <div
              className={classes.progressBar}
              style={{ width: `${Math.min(importProgress, 100)}%` }}
            />
          </div>
          <p className={classes.aiProcessingHint}>
            {t("addWizard", "aiProcessingHint")}
          </p>
        </>
      )}

      {importError && <p className={classes.errorText}>{importError}</p>}

      <button
        className={classes.continueBtn}
        onClick={handleImportFromUrl}
        disabled={isImporting || !recipeUrl.trim()}
      >
        {isImporting ? t("addWizard", "importing") : t("addWizard", "continue")}
      </button>
    </div>
  );
}
