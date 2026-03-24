import React from "react";
import { X, Plus, Check } from "lucide-react";
import { useEditRecipe } from "../EditRecipeContext";

export default function CategoriesTab() {
  const {
    editedPerson,
    toggleCategory,
    newCategoryName,
    setNewCategoryName,
    showNewCategoryInput,
    setShowNewCategoryInput,
    handleAddNewCategory,
    groups,
    getTranslatedGroup,
    classes,
    catShared,
    t,
  } = useEditRecipe();

  return (
    <>
      <h3 className={classes.sectionTitle}>{t("addWizard", "categories")}</h3>

      <div className={classes.categorySection}>
        <p className={classes.categorySubtitle}>
          {t("addWizard", "selectedCategories")}
        </p>
        <div className={`${catShared.categoryChips} ${classes.categoryChips}`}>
          {groups
            .filter(
              (g) => g.id !== "all" && editedPerson.categories.includes(g.id),
            )
            .map((group) => (
              <button
                key={group.id}
                type="button"
                className={`${catShared.categoryChip} ${classes.categoryChip} ${catShared.categoryChipActive} ${classes.categoryChipActive} `}
                onClick={() => toggleCategory(group.id)}
              >
                ✕ {getTranslatedGroup(group)}
              </button>
            ))}
        </div>
      </div>

      <div className={classes.categorySection}>
        <p className={classes.categorySubtitle}>
          {t("addWizard", "availableCategories")}
        </p>
        <div className={`${catShared.categoryChips} ${classes.categoryChips}`}>
          {groups
            .filter(
              (g) => g.id !== "all" && !editedPerson.categories.includes(g.id),
            )
            .map((group) => (
              <button
                key={group.id}
                type="button"
                className={`${classes.categoryChip} ${catShared.categoryChip}`}
                onClick={() => toggleCategory(group.id)}
              >
                + {getTranslatedGroup(group)}
              </button>
            ))}
          {showNewCategoryInput ? (
            <div className={`${catShared.newCategoryInline} ${classes.newCategoryInline}`}>
              <input
                type="text"
                className={`${catShared.newCategoryInput} ${classes.newCategoryInput}`}
                placeholder={t("categories", "categoryName")}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewCategory();
                  }
                  if (e.key === "Escape") {
                    setShowNewCategoryInput(false);
                    setNewCategoryName("");
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                className={`${catShared.newCategoryConfirmBtn} ${classes.newCategoryConfirmBtn}`}
                onClick={handleAddNewCategory}
                disabled={!newCategoryName.trim()}
              >
                <Check size={18} />
              </button>
              <button
                type="button"
                className={`${catShared.newCategoryCancelBtn} ${classes.newCategoryCancelBtn}`}
                onClick={() => {
                  setShowNewCategoryInput(false);
                  setNewCategoryName("");
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`${catShared.addCategoryChip} ${classes.addCategoryChip}`}
              onClick={() => setShowNewCategoryInput(true)}
            >
              <Plus size={14} /> {t("categories", "addCategory")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
