import React from "react";
import { Check, Eye, Star, Heart, Globe, Clock, Flame, Utensils } from "lucide-react";
import { CloseButton } from "../../../controls";
import { useWizard } from "../WizardContext";
import { useRecipeBook } from "../../../../context";
import { VerifyEmailHint } from "../../../banners/verify-email-hint";
import { isGroupHeader, getGroupName } from "../../../../utils/ingredientUtils";
import { formatTime } from "../../../recipes/utils";

export default function SummaryStep() {
  const {
    recipe,
    updateRecipe,
    showPreview,
    setShowPreview,
    classes,
    shared,
    buttonClasses,
    t,
  } = useWizard();

  const { currentUser } = useRecipeBook();
  // Community sharing is gated on verified email. Google users are verified
  // by Google (emailVerified === true), so the toggle stays enabled for them.
  const canShareToCommunity = currentUser?.emailVerified === true;

  const filledIngredients = recipe.ingredients.filter((i) => i.trim());
  const filledInstructions = recipe.instructions.filter((i) => i.trim());

  return (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("addWizard", "summaryTitle")}
      </h3>
      <p className={classes.stepSectionSubtitle}>
        {t("addWizard", "summarySubtitle")}
      </p>

      <div className={classes.summaryBox}>
        <div className={classes.summaryIcon}>
          <Check size={48} />
        </div>
        <h4 className={classes.summaryTitle}>
          {t("addWizard", "recipeReady")}
        </h4>
        <p className={classes.summaryText}>{t("addWizard", "savePrompt")}</p>
        <button
          type="button"
          className={classes.previewBtn}
          onClick={() => setShowPreview(true)}
        >
          <Eye size={16} /> {t("addWizard", "previewRecipe")}
        </button>
      </div>

      {/* Preview overlay */}
      {showPreview && (
        <div className={classes.previewOverlay}>
          <div className={classes.previewCard}>
            <CloseButton
              type="circle"
              className={classes.previewCloseBtn}
              onClick={() => setShowPreview(false)}
            />
            {recipe.image_src ? (
              <img
                src={recipe.image_src}
                alt={recipe.name}
                className={classes.previewImage}
              />
            ) : (
              <div className={classes.previewNoImage}>
                {t("recipes", "noImage")}
              </div>
            )}
            <div className={classes.previewBody}>
              <h3 className={classes.previewName}>{recipe.name || "—"}</h3>
              {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
                <div className={classes.previewMeta}>
                  {recipe.prepTime && (
                    <span>
                      <Clock size={14} />{" "}
                      {formatTime(recipe.prepTime, t("recipes", "minutes"))}
                    </span>
                  )}
                  {recipe.cookTime && (
                    <span>
                      <Flame size={14} />{" "}
                      {formatTime(recipe.cookTime, t("recipes", "minutes"))}
                    </span>
                  )}
                  {recipe.servings && (
                    <span>
                      <Utensils size={14} /> {recipe.servings}{" "}
                      {t("recipes", "servings")}
                    </span>
                  )}
                </div>
              )}
              {filledIngredients.length > 0 && (
                <>
                  <h4 className={classes.previewSectionTitle}>
                    {t("recipes", "ingredients")}
                  </h4>
                  <ul className={classes.previewList}>
                    {filledIngredients.map((ing, i) =>
                      isGroupHeader(ing) ? (
                        <li key={i} className={classes.previewGroupHeader}>
                          {getGroupName(ing)}
                        </li>
                      ) : (
                        <li key={i}>{ing}</li>
                      ),
                    )}
                  </ul>
                </>
              )}
              {filledInstructions.length > 0 && (
                <>
                  <h4 className={classes.previewSectionTitle}>
                    {t("recipes", "instructions")}
                  </h4>
                  <ol className={classes.previewList}>
                    {filledInstructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Friendly tip when an imported recipe has no image */}
      {recipe.importedFromUrl && !recipe.image_src ? (
        <small className={classes.shareRightsNote}>
          {t("recipes", "noImageImportedTip")}
        </small>
      ) : null}

      {/* Rating */}
      <div className={shared.formGroup}>
        <label className={shared.formLabel}>{t("addWizard", "rating")}</label>
        <div className={classes.starRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`${classes.starBtn} ${
                star <= recipe.rating ? classes.starBtnActive : ""
              }`}
              onClick={() =>
                updateRecipe("rating", star === recipe.rating ? 0 : star)
              }
            >
              <Star size={24} />
            </button>
          ))}
        </div>
      </div>

      {/* Favorite */}
      <label className={classes.favoriteToggle}>
        <input
          type="checkbox"
          className={classes.favoriteCheckbox + " " + buttonClasses.checkBox}
          checked={recipe.isFavorite}
          onChange={() => updateRecipe("isFavorite", !recipe.isFavorite)}
        />
        <Heart size={16} />
        <span className={classes.favoriteLabel}>
          {t("recipes", recipe.isFavorite ? "removeFromFavorites" : "addToFavorites")}
        </span>
      </label>

      {/* Share to global */}
      <label
        className={`${classes.favoriteToggle} ${
          !canShareToCommunity ? classes.shareDisabled : ""
        }`}
      >
        <input
          type="checkbox"
          className={classes.favoriteCheckbox + " " + buttonClasses.checkBox}
          checked={!!recipe.shareToGlobal && canShareToCommunity}
          disabled={!canShareToCommunity}
          onChange={() => {
            if (!canShareToCommunity) return;
            const next = !recipe.shareToGlobal;
            updateRecipe("shareToGlobal", next);
            if (!next) updateRecipe("showMyName", false);
          }}
        />
        <Globe size={16} />
        <span className={classes.favoriteLabel}>
          {t("recipes", "shareToGlobal")}
        </span>
      </label>
      {canShareToCommunity ? (
        <small className={classes.shareRightsNote}>
          {t("recipes", "shareRightsNote")}
        </small>
      ) : (
        <VerifyEmailHint message={t("auth", "verifyShareBlocked")} />
      )}
    </div>
  );
}
