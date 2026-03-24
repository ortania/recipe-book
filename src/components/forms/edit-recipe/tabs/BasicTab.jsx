import React from "react";
import { Heart, Globe, Star } from "lucide-react";
import { useEditRecipe } from "../EditRecipeContext";

export default function BasicTab() {
  const {
    editedPerson,
    setEditedPerson,
    person,
    handleChange,
    handleServingsChange,
    toggleFavorite,
    classes,
    shared,
    buttonClasses,
    t,
  } = useEditRecipe();

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
          className={`${classes.favoriteBtn} ${editedPerson.isFavorite ? classes.favoriteBtnActive : ""}`}
          onClick={toggleFavorite}
        >
          {editedPerson.isFavorite ? (
            <Heart size={22} fill="red" stroke="red" />
          ) : (
            <Heart size={22} />
          )}
          <span>
            {t(
              "recipes",
              editedPerson.isFavorite
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
          value={editedPerson.name}
          onChange={(e) =>
            setEditedPerson((prev) => ({ ...prev, name: e.target.value }))
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
                className={`${classes.starBtn} ${star <= (editedPerson.rating || 0) ? classes.starBtnActive : ""}`}
                onClick={() =>
                  setEditedPerson((prev) => ({
                    ...prev,
                    rating: star === prev.rating ? 0 : star,
                  }))
                }
              >
                <Star
                  size={20}
                  fill={star <= (editedPerson.rating || 0) ? "#ffc107" : "none"}
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
            value={editedPerson.servings}
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
            value={editedPerson.difficulty}
            onChange={(e) =>
              setEditedPerson((prev) => ({
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
            value={editedPerson.cookTime}
            onChange={(e) =>
              setEditedPerson((prev) => ({
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
            value={editedPerson.prepTime}
            onChange={(e) =>
              setEditedPerson((prev) => ({
                ...prev,
                prepTime: e.target.value.replace(/[^0-9]/g, ""),
              }))
            }
          />
        </div>
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("recipes", "notes")}
        </label>
        <textarea
          className={shared.formTextarea}
          value={editedPerson.notes}
          onChange={(e) =>
            setEditedPerson((prev) => ({ ...prev, notes: e.target.value }))
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
          value={editedPerson.sourceUrl}
          onChange={(e) =>
            setEditedPerson((prev) => ({
              ...prev,
              sourceUrl: e.target.value,
            }))
          }
        />
      </div>

      {!person.copiedFrom && (
        <div className={shared.formGroup}>
          <label className={classes.checkboxLabel}>
            <input
              type="checkbox"
              name="shareToGlobal"
              className={buttonClasses.checkBox}
              checked={editedPerson.shareToGlobal}
              onChange={(e) => {
                handleChange(e);
                if (!e.target.checked) {
                  setEditedPerson((prev) => ({ ...prev, showMyName: false }));
                }
              }}
            />
            <Globe size={16} />
            <span>{t("recipes", "shareToGlobal")}</span>
          </label>
        </div>
      )}
    </>
  );
}
