import React from "react";
import { Heart, Globe, Star } from "lucide-react";
import { useEditRecipe } from "../EditRecipeContext";
import { useRecipeBook } from "../../../../context";
import { VerifyEmailHint } from "../../../banners/verify-email-hint";

export default function BasicTab() {
  const {
    editedRecipe,
    setEditedRecipe,
    recipe,
    handleChange,
    handleServingsChange,
    toggleFavorite,
    classes,
    shared,
    buttonClasses,
    t,
  } = useEditRecipe();

  const { currentUser } = useRecipeBook();
  // Gate community sharing on verified email. If the recipe is already
  // shared and the user somehow becomes unverified, we still allow them
  // to uncheck the box — we only block turning sharing ON.
  const canShareToCommunity = currentUser?.emailVerified === true;

  // Lock the sourceUrl field when the recipe was imported from a URL.
  // Also treat legacy recipes (flag undefined but sourceUrl present) as
  // imported, so their attribution cannot be silently removed.
  const isSourceUrlLocked =
    editedRecipe.importedFromUrl === true ||
    (editedRecipe.importedFromUrl === undefined &&
      !!(editedRecipe.sourceUrl && editedRecipe.sourceUrl.trim()));

  return (
    <>
      <h3 className={classes.sectionTitle}>{t("addWizard", "basicInfo")}</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <button
          type="button"
          className={`${classes.favoriteBtn} ${editedRecipe.isFavorite ? classes.favoriteBtnActive : ""}`}
          onClick={toggleFavorite}
        >
          {editedRecipe.isFavorite ? (
            <Heart size={22} fill="red" stroke="red" />
          ) : (
            <Heart size={22} />
          )}
          <span>
            {t(
              "recipes",
              editedRecipe.isFavorite
                ? "removeFromFavorites"
                : "addToFavorites",
            )}
          </span>
        </button>
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("recipes", "recipeName")}
          <span>*</span>
        </label>
        <input
          type="text"
          className={shared.formInput}
          value={editedRecipe.name}
          onChange={(e) =>
            setEditedRecipe((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>

      <div className={classes.formRowThree}>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("recipes", "rating")}
          </label>
          <div className={classes.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${classes.starBtn} ${star <= (editedRecipe.rating || 0) ? classes.starBtnActive : ""}`}
                onClick={() =>
                  setEditedRecipe((prev) => ({
                    ...prev,
                    rating: star === prev.rating ? 0 : star,
                  }))
                }
              >
                <Star
                  size={20}
                  fill={star <= (editedRecipe.rating || 0) ? "#ffc107" : "none"}
                />
              </button>
            ))}
          </div>
        </div>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("recipes", "servings")}
          </label>
          <input
            type="number"
            className={shared.formInput}
            value={editedRecipe.servings}
            onChange={handleServingsChange}
            min="1"
          />
        </div>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("recipes", "difficulty")}
          </label>
          <select
            className={shared.formSelect}
            value={editedRecipe.difficulty}
            onChange={(e) =>
              setEditedRecipe((prev) => ({
                ...prev,
                difficulty: e.target.value,
              }))
            }
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
            {t("recipes", "cookTime")} ({t("addWizard", "min")})
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            className={shared.formInput}
            value={editedRecipe.cookTime}
            onChange={(e) =>
              setEditedRecipe((prev) => ({
                ...prev,
                cookTime: e.target.value.replace(/[^0-9]/g, ""),
              }))
            }
          />
        </div>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("recipes", "prepTime")} ({t("addWizard", "min")})
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            className={shared.formInput}
            value={editedRecipe.prepTime}
            onChange={(e) =>
              setEditedRecipe((prev) => ({
                ...prev,
                prepTime: e.target.value.replace(/[^0-9]/g, ""),
              }))
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
          value={editedRecipe.author || ""}
          onChange={(e) =>
            setEditedRecipe((prev) => ({ ...prev, author: e.target.value }))
          }
        />
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("recipes", "notes")}
        </label>
        <textarea
          className={shared.formTextarea}
          value={editedRecipe.notes}
          onChange={(e) =>
            setEditedRecipe((prev) => ({ ...prev, notes: e.target.value }))
          }
        />
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("recipes", "sourceUrl")}
        </label>
        <input
          type="url"
          className={shared.formInput}
          placeholder="https://..."
          value={editedRecipe.sourceUrl || ""}
          readOnly={isSourceUrlLocked}
          onChange={(e) =>
            setEditedRecipe((prev) => ({
              ...prev,
              sourceUrl: e.target.value,
            }))
          }
        />
        {isSourceUrlLocked ? (
          <small className={classes.shareRightsNote}>
            {t("recipes", "sourceUrlLockedNote")}
          </small>
        ) : null}
      </div>

      {!recipe.copiedFrom && (
        <div className={shared.formGroup}>
          <label
            className={`${classes.checkboxLabel} ${
              !canShareToCommunity && !editedRecipe.shareToGlobal
                ? classes.shareDisabled
                : ""
            }`}
          >
            <input
              type="checkbox"
              name="shareToGlobal"
              className={buttonClasses.checkBox}
              checked={editedRecipe.shareToGlobal}
              disabled={!canShareToCommunity && !editedRecipe.shareToGlobal}
              onChange={(e) => {
                // Allow turning OFF sharing at any time. Only block turning
                // it ON if the email isn't verified.
                if (e.target.checked && !canShareToCommunity) return;
                handleChange(e);
                if (!e.target.checked) {
                  setEditedRecipe((prev) => ({ ...prev, showMyName: false }));
                }
              }}
            />
            <Globe size={16} />
            <span>{t("recipes", "shareToGlobal")}</span>
          </label>
          {!canShareToCommunity && !editedRecipe.shareToGlobal ? (
            <VerifyEmailHint message={t("auth", "verifyShareBlocked")} />
          ) : (
            <small className={classes.shareRightsNote}>
              {t("recipes", "shareRightsNote")}
            </small>
          )}
        </div>
      )}
    </>
  );
}
