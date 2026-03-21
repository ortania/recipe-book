import { useState, useMemo } from "react";
import { UtensilsCrossed, Settings2, LayoutGrid, Rows4 } from "lucide-react";
import { useRecipeBook, useLanguage } from "../../context";
import useTranslatedList from "../../hooks/useTranslatedList";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { Trash2 } from "lucide-react";
import { SearchBox } from "../controls/search";
import { CloseButton } from "../controls/close-button";
import { CategoryCard } from "../category-card";
import classes from "./categories-sheet-content.module.css";

function CategoriesSheetContent({
  onManage,
  onClose,
  className,
  categoriesOverride,
  recipesOverride,
  selectedCategoriesOverride,
  toggleCategoryOverride,
  clearCategorySelectionOverride,
  hideManage = false,
}) {
  const ctx = useRecipeBook();
  const categories = categoriesOverride || ctx.categories;
  const recipes = recipesOverride || ctx.recipes;
  const selectedCategories =
    selectedCategoriesOverride || ctx.selectedCategories;
  const toggleCategory = toggleCategoryOverride || ctx.toggleCategory;
  const clearCategorySelection =
    clearCategorySelectionOverride || ctx.clearCategorySelection;
  const { t } = useLanguage();
  const { getTranslated } = useTranslatedList(categories, "name");
  const [categorySearch, setCategorySearch] = useState("");
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("categoriesViewMode") || "list";
    } catch {
      return "list";
    }
  });

  const toggleViewMode = () => {
    setViewMode((prev) => {
      const next = prev === "list" ? "grid" : "list";
      try {
        localStorage.setItem("categoriesViewMode", next);
      } catch {}
      return next;
    });
  };

  const isAllSelected = selectedCategories.includes("all");
  const selectedCount = isAllSelected ? 0 : selectedCategories.length;

  const categoryImageMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      if (cat.id === "all") return;
      const catRecipes =
        cat.id === "general"
          ? recipes.filter((r) => !r.categories || r.categories.length === 0)
          : recipes.filter(
              (r) => r.categories && r.categories.includes(cat.id),
            );
      const withImage = catRecipes
        .filter((r) => r.image_src || r.image)
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      if (withImage.length > 0) {
        map[cat.id] = withImage[0].image_src || withImage[0].image;
      }
    });
    const allWithImage = recipes
      .filter((r) => r.image_src || r.image)
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    if (allWithImage.length > 0) {
      map["all"] = allWithImage[0].image_src || allWithImage[0].image;
    }
    return map;
  }, [categories, recipes]);

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
      {onClose && (
        <div className={classes.modalHeader}>
          <CloseButton onClick={onClose} />
          <span className={classes.modalTitle}>{t("nav", "categories")}</span>
          <button
            type="button"
            className={classes.viewToggleBtn}
            onClick={toggleViewMode}
            title={
              viewMode === "list"
                ? t("recipesView", "gridView")
                : t("recipesView", "listView")
            }
          >
            {viewMode === "list" ? (
              <LayoutGrid size={20} />
            ) : (
              <Rows4 size={20} />
            )}
          </button>
        </div>
      )}

      <div className={classes.search}>
        <SearchBox
          searchTerm={categorySearch}
          onSearchChange={(val) => {
            setCategorySearch(val);
            if (!val) clearCategorySelection();
          }}
          placeholder={t("categories", "searchCategory")}
          size="large"
        />
      </div>

      <div className={classes.hintRow}>
        {!isAllSelected && selectedCount > 0 ? (
          <>
            <span className={classes.activeCount}>
              {selectedCount} {t("categories", "selected")}
            </span>
            <button
              className={classes.clearBtn}
              onClick={clearCategorySelection}
            >
              {t("categories", "clearAll")}
            </button>
          </>
        ) : (
          <p className={classes.hint}>{t("categories", "multiSelectHint")}</p>
        )}
      </div>

      {viewMode === "list" ? (
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
                >
                  <span className={classes.label}>
                    <span className={classes.icon}>
                      <IconComp size={14} />
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
      ) : (
        <div className={classes.cardsGrid}>
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
              const displayName =
                group.id === "all"
                  ? t("categories", "allRecipes")
                  : getTranslated(group);
              return (
                <CategoryCard
                  key={group.id}
                  category={group}
                  name={displayName}
                  selected={isSelected}
                  onClick={() => toggleCategory(group.id)}
                  count={getGroupContacts(group.id).length}
                  recipeImage={categoryImageMap[group.id]}
                />
              );
            })}
        </div>
      )}

      {!hideManage && (
        <button className={classes.manageBtn} onClick={onManage}>
          <Settings2 size={16} />
          {t("categories", "manage")}
        </button>
      )}
    </div>
  );
}

export { CategoriesSheetContent };
export default CategoriesSheetContent;
