import { useState } from "react";
import { UtensilsCrossed, Settings2 } from "lucide-react";
import { useRecipeBook, useLanguage } from "../../context";
import useTranslatedList from "../../hooks/useTranslatedList";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { SearchBox } from "../controls/search";
import classes from "./categories-sheet-content.module.css";

function CategoriesSheetContent({ onManage, className }) {
  const {
    categories,
    recipes,
    selectedCategories,
    toggleCategory,
    clearCategorySelection,
  } = useRecipeBook();
  const { t } = useLanguage();
  const { getTranslated } = useTranslatedList(categories, "name");
  const [categorySearch, setCategorySearch] = useState("");

  const isAllSelected = selectedCategories.includes("all");
  const selectedCount = isAllSelected ? 0 : selectedCategories.length;

  const getGroupContacts = (groupId) => {
    if (groupId === "all") return recipes;
    if (groupId === "general") {
      return recipes.filter(
        (recipe) => !recipe.categories || recipe.categories.length === 0,
      );
    }
    return recipes.filter(
      (recipe) => recipe.categories && recipe.categories.includes(groupId),
    );
  };

  return (
    <div className={`${classes.content} ${className || ""}`}>
      <div className={classes.search}>
        <SearchBox
          searchTerm={categorySearch}
          onSearchChange={(val) => {
            setCategorySearch(val);
            if (!val) clearCategorySelection();
          }}
          placeholder={t("categories", "searchCategory")}
          size="small"
        />
      </div>

      <p className={classes.hint}>{t("categories", "multiSelectHint")}</p>

      {!isAllSelected && selectedCount > 0 && (
        <div className={classes.activeBar}>
          <span className={classes.activeCount}>
            {selectedCount} {t("categories", "selected")}
          </span>
          <button className={classes.clearBtn} onClick={clearCategorySelection}>
            {t("categories", "clear")}
          </button>
        </div>
      )}

      <div className={classes.list}>
        {categories
          .filter((group) => {
            if (!categorySearch.trim()) return true;
            const term = categorySearch.trim().toLowerCase();
            const name =
              group.id === "all"
                ? t("categories", "allRecipes").toLowerCase()
                : (getTranslated(group) || "").toLowerCase();
            return name.includes(term);
          })
          .map((group) => {
            const isSelected = selectedCategories.includes(group.id);
            const IconComp =
              group.id === "all"
                ? UtensilsCrossed
                : getCategoryIcon(group.icon);
            return (
              <button
                key={group.id}
                className={`${classes.item} ${isSelected ? classes.itemActive : ""}`}
                onClick={() => toggleCategory(group.id)}
                style={
                  isSelected
                    ? {
                        borderColor: group.color,
                        backgroundColor: `${group.color}15`,
                      }
                    : undefined
                }
              >
                <span className={classes.label}>
                  <span
                    className={classes.icon}
                    style={{
                      backgroundColor: `${group.color}18`,
                      color: group.color,
                    }}
                  >
                    <IconComp size={18} />
                  </span>
                  <span className={classes.name}>
                    {group.id === "all"
                      ? t("categories", "allRecipes")
                      : getTranslated(group)}
                  </span>
                </span>
                <span className={classes.count}>
                  {getGroupContacts(group.id).length}
                </span>
              </button>
            );
          })}
      </div>

      <button className={classes.manageBtn} onClick={onManage}>
        <Settings2 size={16} />
        {t("categories", "manage")}
      </button>
    </div>
  );
}

export { CategoriesSheetContent };
export default CategoriesSheetContent;
