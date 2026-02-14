import { useState, useMemo } from "react";
import {
  FiFolder,
  FiCheck,
  FiShoppingCart,
  FiPrinter,
  FiTrash2,
} from "react-icons/fi";
import { useRecipeBook, useLanguage } from "../../context";
import useTranslatedList from "../../hooks/useTranslatedList";
import classes from "./shopping-list.module.css";

function buildShoppingList(selectedIds, recipes) {
  const ingredientMap = {};
  const junkPatterns =
    /related\s*articles|advertisement|sponsored|click\s*here|read\s*more|sign\s*up|subscribe|newsletter|copyright|©|http|www\.|ראה בקישור|לחצ[וי] כאן|see link|see recipe/i;
  const nonIngredientWords =
    /^(יבשים|רטובים|לקישוט|להגשה|לציפוי|אופציונלי|optional|for garnish|for serving|for decoration|מים|water)$/i;
  const normalizeKey = (s) =>
    s
      .replace(/^[\d\s½¼¾⅓⅔.,/\-]+/, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  const extractQty = (s) => {
    const m = s.match(/^([\d½¼¾⅓⅔.,/]+)/);
    if (!m) return 1;
    const v = m[1].replace(",", ".");
    const fracs = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 0.33, "⅔": 0.67 };
    if (fracs[v]) return fracs[v];
    const num = parseFloat(v);
    return isNaN(num) ? 1 : num;
  };

  selectedIds.forEach((id) => {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe || !recipe.ingredients) return;
    const ingredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : typeof recipe.ingredients === "string"
        ? recipe.ingredients
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    ingredients.forEach((ing) => {
      const raw = ing.trim();
      if (!raw || raw.length < 2 || raw.length > 150) return;
      if (junkPatterns.test(raw)) return;
      const key = normalizeKey(raw) || raw.toLowerCase();
      if (!key || nonIngredientWords.test(key)) return;
      const qty = extractQty(raw);
      if (ingredientMap[key]) {
        ingredientMap[key].count += 1;
        ingredientMap[key].totalQty += qty;
      } else {
        ingredientMap[key] = {
          name: key,
          count: 1,
          totalQty: qty,
          display: raw,
        };
      }
    });
  });
  return Object.values(ingredientMap).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function ShoppingList() {
  const { t } = useLanguage();
  const { recipes, categories } = useRecipeBook();
  const { getTranslated } = useTranslatedList(categories, "name");

  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [showList, setShowList] = useState(false);

  const getRecipesForCat = (catId) => {
    if (catId === "all") return recipes;
    if (catId === "general")
      return recipes.filter((r) => !r.categories || r.categories.length === 0);
    return recipes.filter((r) => r.categories && r.categories.includes(catId));
  };

  const shoppingList = useMemo(
    () => buildShoppingList(selectedRecipes, recipes),
    [selectedRecipes, recipes],
  );

  const toggleRecipe = (id) => {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const toggleChecked = (key) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const checkedCount = shoppingList.filter(
    (item) => checkedItems[item.name.toLowerCase()],
  ).length;

  const handlePrint = () => window.print();

  const handleClear = () => {
    setSelectedRecipes([]);
    setCheckedItems({});
    setShowList(false);
  };

  if (showList && selectedRecipes.length > 0) {
    return (
      <div className={classes.page}>
        <div className={classes.header}>
          <div>
            <h1 className={classes.title}>
              {t("mealPlanner", "shoppingList")}
            </h1>
            <span className={classes.subtitle}>
              {selectedRecipes.length} {t("recipesView", "recipesCount")} ·{" "}
              {shoppingList.length} {t("mealPlanner", "items") || "items"}
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
              ← {t("mealPlanner", "chooseRecipe")}
            </button>
            <button className={classes.headerBtnOutline} onClick={handleClear}>
              <FiTrash2 /> {t("mealPlanner", "clearAll")}
            </button>
          </div>
        </div>

        {checkedCount > 0 && (
          <div className={classes.progress}>
            {checkedCount}/{shoppingList.length}
          </div>
        )}

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
                  className={classes.checkbox}
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
      <div className={classes.header}>
        <div>
          <h1 className={classes.title}>{t("mealPlanner", "shoppingList")}</h1>
          <span className={classes.subtitle}>
            {selectedRecipes.length > 0
              ? `${selectedRecipes.length} ${t("recipesView", "recipesCount")}`
              : t("mealPlanner", "chooseRecipe")}
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

      {!selectedCat ? (
        <div className={classes.catList}>
          <button
            className={classes.catListItem}
            onClick={() => setSelectedCat("all")}
          >
            <span
              className={classes.catListIcon}
              style={{ background: "#6366f122", color: "#6366f1" }}
            >
              <FiFolder />
            </span>
            <span className={classes.catListName}>
              {t("categories", "allRecipes")}
            </span>
            <span className={classes.catListCount}>{recipes.length}</span>
          </button>
          {categories
            .filter((c) => c.id !== "all")
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
                    style={{ background: `${cat.color}18`, color: cat.color }}
                  >
                    <FiFolder />
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
            <button
              className={classes.backBtn}
              onClick={() => setSelectedCat(null)}
            >
              ← {t("mealPlanner", "chooseRecipe")}
            </button>
            <span className={classes.subCount}>
              {getRecipesForCat(selectedCat).length}{" "}
              {t("recipesView", "recipesCount")}
            </span>
          </div>
          <div className={classes.recipeList}>
            {getRecipesForCat(selectedCat).map((recipe) => {
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
                    />
                  ) : (
                    <span className={classes.recipeItemEmoji}>🍽️</span>
                  )}
                  <span className={classes.recipeItemName}>{recipe.name}</span>
                  {isSelected && (
                    <FiCheck className={classes.recipeItemCheck} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default ShoppingList;
