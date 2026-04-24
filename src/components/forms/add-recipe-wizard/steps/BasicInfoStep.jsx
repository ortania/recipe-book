import React from "react";
import { useWizard } from "../WizardContext";

export default function BasicInfoStep() {
  const { recipe, updateRecipe, classes, shared, t } = useWizard();

  // Lock the sourceUrl field when the recipe was imported from a URL so
  // attribution cannot be accidentally removed. Also covers legacy recipes
  // where the flag is absent but a sourceUrl is already present.
  const isSourceUrlLocked =
    recipe.importedFromUrl === true ||
    (recipe.importedFromUrl === undefined &&
      !!(recipe.sourceUrl && recipe.sourceUrl.trim()));

  return (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("addWizard", "basicInfo")}
      </h3>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("recipes", "recipeName")}
          <span>*</span>
        </label>
        <input
          type="text"
          className={shared.formInput}
          placeholder={t("addWizard", "namePlaceholder")}
          value={recipe.name}
          onChange={(e) => updateRecipe("name", e.target.value)}
        />
      </div>

      <div className={shared.formRow}>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>{t("recipes", "servings")}</label>
          <input
            type="number"
            className={shared.formInput}
            value={recipe.servings}
            onChange={(e) => updateRecipe("servings", e.target.value)}
            min="1"
          />
        </div>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("recipes", "difficulty")}
          </label>
          <select
            className={shared.formSelect}
            value={recipe.difficulty}
            onChange={(e) => updateRecipe("difficulty", e.target.value)}
          >
            <option value="Unknown">{t("difficulty", "Unknown")}</option>
            <option value="VeryEasy">{t("difficulty", "VeryEasy")}</option>
            <option value="Easy">{t("difficulty", "Easy")}</option>
            <option value="Medium">{t("difficulty", "Medium")}</option>
            <option value="Hard">{t("difficulty", "Hard")}</option>
          </select>
        </div>
      </div>

      <div className={shared.formRow}>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("addWizard", "cookTimeMin")}
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            className={shared.formInput}
            value={recipe.cookTime}
            onChange={(e) =>
              updateRecipe("cookTime", e.target.value.replace(/[^0-9]/g, ""))
            }
          />
        </div>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("addWizard", "prepTimeMin")}
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            className={shared.formInput}
            value={recipe.prepTime}
            onChange={(e) =>
              updateRecipe("prepTime", e.target.value.replace(/[^0-9]/g, ""))
            }
          />
        </div>
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("addWizard", "recipeAuthor")} ({t("common", "optional")})
        </label>
        <input
          type="text"
          className={shared.formInput}
          placeholder={t("addWizard", "authorPlaceholder")}
          value={recipe.author || ""}
          onChange={(e) => updateRecipe("author", e.target.value)}
        />
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>{t("recipes", "notes")}</label>
        <textarea
          className={shared.formTextarea}
          placeholder={t("addWizard", "notesPlaceholder")}
          value={recipe.notes}
          onChange={(e) => updateRecipe("notes", e.target.value)}
        />
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("addWizard", "sourceUrl")}
        </label>
        <input
          type="url"
          className={shared.formInput}
          placeholder="https://..."
          value={recipe.sourceUrl || ""}
          readOnly={isSourceUrlLocked}
          onChange={(e) => updateRecipe("sourceUrl", e.target.value)}
        />
        {isSourceUrlLocked ? (
          <small className={classes.shareRightsNote}>
            {t("recipes", "sourceUrlLockedNote")}
          </small>
        ) : null}
      </div>
    </div>
  );
}
