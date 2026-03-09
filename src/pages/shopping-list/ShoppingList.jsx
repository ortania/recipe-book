import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiShoppingCart, FiPrinter, FiTrash2 } from "react-icons/fi";
import { Globe } from "lucide-react";
import { useRecipeBook, useLanguage } from "../../context";
import {
  fetchGlobalRecipes,
  fetchGlobalRecipesCount,
} from "../../firebase/globalRecipeService";
import useTranslatedList from "../../hooks/useTranslatedList";
import { buildShoppingList } from "../../utils/ingredientUtils";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { BackButton } from "../../components/controls/back-button";
import buttonClasses from "../../components/controls/gen-button.module.css";
import classes from "./shopping-list.module.css";

function ShoppingList() {
  const { t } = useLanguage();
  const { recipes, categories, currentUser } = useRecipeBook();
  const { getTranslated } = useTranslatedList(categories, "name");
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [showList, setShowList] = useState(false);
  const [mobileTabsEl, setMobileTabsEl] = useState(null);
  const [globalRecipes, setGlobalRecipes] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [globalCount, setGlobalCount] = useState(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const update = () => {
      setMobileTabsEl(
        mql.matches ? document.getElementById("mobile-tabs-portal") : null,
      );
    };
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    fetchGlobalRecipesCount()
      .then((count) => setGlobalCount(count))
      .catch(() => setGlobalCount(0));
  }, []);

  const mobileTitle = (
    <span className={classes.mobileTitle}>
      {t("mealPlanner", "shoppingList")}
    </span>
  );

  const getRecipesForCat = (catId) => {
    if (catId === "all") return recipes;
    if (catId === "general")
      return recipes.filter((r) => !r.categories || r.categories.length === 0);
    return recipes.filter((r) => r.categories && r.categories.includes(catId));
  };

  const allAvailableRecipes = useMemo(() => {
    const map = new Map(recipes.map((r) => [r.id, r]));
    globalRecipes.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [recipes, globalRecipes]);

  const shoppingList = useMemo(
    () => buildShoppingList(selectedRecipes, allAvailableRecipes),
    [selectedRecipes, allAvailableRecipes],
  );

  const handleSelectCommunity = async () => {
    setSelectedCat("community");
    if (globalRecipes.length === 0) {
      setLoadingGlobal(true);
      try {
        const result = await fetchGlobalRecipes(currentUser?.uid);
        setGlobalRecipes(result.recipes || []);
      } catch (err) {
        console.error("Failed to fetch global recipes:", err);
      } finally {
        setLoadingGlobal(false);
      }
    }
  };

  const toggleRecipe = (id) => {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const toggleChecked = (key) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => window.print();

  const handleClear = () => {
    setSelectedRecipes([]);
    setCheckedItems({});
    setShowList(false);
  };

  if (showList && selectedRecipes.length > 0) {
    return (
      <div className={classes.page}>
        {mobileTabsEl && createPortal(mobileTitle, mobileTabsEl)}
        <div className={classes.header}>
          <div>
            <h1 className={classes.title}>
              {t("mealPlanner", "shoppingList")}
            </h1>
            <span className={classes.subtitle}>
              {selectedRecipes.length} {t("recipesView", "recipesCount")},{" "}
              {shoppingList.length} {t("mealPlanner", "items")}
            </span>
          </div>
          <div className={classes.headerActions}>
            <button className={classes.headerBtn} onClick={handlePrint}>
              <FiPrinter /> {t("mealPlanner", "print")}
            </button>
            <button
              className={classes.headerBtnOutline}
              onClick={() => setShowList(false)}
            >
              {t("mealPlanner", "chooseRecipe")}
            </button>
            <button className={classes.headerBtnOutline} onClick={handleClear}>
              <FiTrash2 /> {t("mealPlanner", "clearAll")}
            </button>
          </div>
        </div>

        <div className={classes.listContainer}>
          {shoppingList.map((item) => {
            const key = item.name.toLowerCase();
            const isChecked = checkedItems[key];
            return (
              <label
                key={key}
                className={`${classes.listItem} ${isChecked ? classes.listItemChecked : ""}`}
              >
                <input
                  type="checkbox"
                  checked={!!isChecked}
                  onChange={() => toggleChecked(key)}
                  className={classes.checkbox + " " + buttonClasses.checkBox}
                />
                <span className={classes.listItemText}>
                  {item.count > 1
                    ? `${item.totalQty % 1 === 0 ? item.totalQty : item.totalQty.toFixed(1)} ${item.name}`
                    : item.display}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={classes.page}>
      {mobileTabsEl && createPortal(mobileTitle, mobileTabsEl)}
      <div className={classes.header}>
        <div>
          {!mobileTabsEl && (
            <h1 className={classes.title}>
              {t("mealPlanner", "shoppingList")}
            </h1>
          )}
          <span className={classes.subtitle}>
            {selectedRecipes.length > 0
              ? `${selectedRecipes.length} ${t("recipesView", "recipesCount")} ${t("mealPlanner", "selected")}`
              : ""}
          </span>
        </div>
        {selectedRecipes.length > 0 && (
          <div className={classes.headerActions}>
            <button
              className={classes.headerBtn}
              onClick={() => setShowList(true)}
            >
              <FiShoppingCart />
              {t("mealPlanner", "shoppingList")} ({shoppingList.length})
            </button>
          </div>
        )}
      </div>

      {selectedRecipes.length === 0 && !selectedCat && (
        <p className={classes.instructions}>
          {t("mealPlanner", "chooseRecipe")}
        </p>
      )}

      {!selectedCat ? (
        <div className={classes.catList}>
          <button
            className={classes.catListItem}
            onClick={handleSelectCommunity}
          >
            <span
              className={classes.catListIcon}
              style={{ background: "#10b98122", color: "#10b981" }}
            >
              <Globe size={20} />
            </span>
            <span className={classes.catListName}>
              {t("nav", "globalRecipesFull")}
            </span>
            <span className={classes.catListCount}>
              {globalCount != null ? globalCount : ""}
            </span>
          </button>
          {recipes.length > 0 && (
            <button
              className={classes.catListItem}
              onClick={() => setSelectedCat("all")}
            >
              <span
                className={classes.catListIcon}
                style={{ background: "#6366f122", color: "#6366f1" }}
              >
                {(() => {
                  const IC = getCategoryIcon("restaurant");
                  return <IC />;
                })()}
              </span>
              <span className={classes.catListName}>
                {t("mealPlanner", "myRecipes")}
              </span>
              <span className={classes.catListCount}>{recipes.length}</span>
            </button>
          )}
          {recipes.length > 0 &&
            categories
              .filter((c) => c.id !== "all")
              .filter((c) => getRecipesForCat(c.id).length > 0)
              .map((cat) => {
                const count = getRecipesForCat(cat.id).length;
                return (
                  <button
                    key={cat.id}
                    className={classes.catListItem}
                    onClick={() => setSelectedCat(cat.id)}
                  >
                    <span
                      className={classes.catListIcon}
                      style={{ background: `${cat.color}22`, color: cat.color }}
                    >
                      {(() => {
                        const IC = getCategoryIcon(cat.icon);
                        return <IC />;
                      })()}
                    </span>
                    <span className={classes.catListName}>
                      {getTranslated(cat)}
                    </span>
                    <span className={classes.catListCount}>{count}</span>
                  </button>
                );
              })}
        </div>
      ) : (
        <>
          <div className={classes.subHeader}>
            <BackButton onClick={() => setSelectedCat(null)} size={22} />
            <span className={classes.subTitle}>
              {selectedCat === "community"
                ? t("nav", "globalRecipesFull")
                : selectedCat === "all"
                  ? t("mealPlanner", "myRecipes")
                  : (() => {
                      const cat = categories.find((c) => c.id === selectedCat);
                      return cat ? getTranslated(cat) : "";
                    })()}
            </span>
            <span className={classes.subCount}>
              {selectedCat === "community"
                ? loadingGlobal
                  ? ""
                  : `${globalRecipes.length} ${t("recipesView", "recipesCount")}`
                : `${getRecipesForCat(selectedCat).length} ${t("recipesView", "recipesCount")}`}
            </span>
          </div>
          {selectedCat === "community" && loadingGlobal ? (
            <div className={classes.emptyState}>
              <p className={classes.emptyText}>...</p>
            </div>
          ) : (
            <div className={classes.recipeList}>
              {(selectedCat === "community"
                ? globalRecipes
                : getRecipesForCat(selectedCat)
              ).map((recipe) => {
                const isSelected = selectedRecipes.includes(recipe.id);
                return (
                  <button
                    key={recipe.id}
                    className={`${classes.recipeItem} ${isSelected ? classes.recipeItemSelected : ""}`}
                    onClick={() => toggleRecipe(recipe.id)}
                  >
                    {recipe.image_src ? (
                      <img
                        className={classes.recipeItemImage}
                        src={recipe.image_src}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className={classes.recipeItemEmoji}>🍽️</span>
                    )}
                    <span className={classes.recipeItemName}>
                      {recipe.name}
                    </span>
                    {isSelected && (
                      <FiCheck className={classes.recipeItemCheck} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ShoppingList;
