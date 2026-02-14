import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IoAdd } from "react-icons/io5";
import { FiPrinter, FiShoppingCart, FiCheck, FiFolder } from "react-icons/fi";
import {
  MdOutlineFreeBreakfast,
  MdOutlineLunchDining,
  MdOutlineDinnerDining,
} from "react-icons/md";
import { useRecipeBook, useLanguage } from "../../context";
import { useMealPlanner } from "../../hooks/useMealPlanner";
import useTranslatedList from "../../hooks/useTranslatedList";
import classes from "./meal-planner.module.css";

const DAY_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
];

const MEAL_ICONS = {
  breakfast: MdOutlineFreeBreakfast,
  lunch: MdOutlineLunchDining,
  dinner: MdOutlineDinnerDining,
};

function getWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getWeekRange(dates) {
  const start = dates[0];
  const end = dates[6];
  const fmt = (d) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} - ${fmt(end)}, ${end.getFullYear()}`;
}

function formatDayDate(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function MealPlanner() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { recipes, categories, currentUser } = useRecipeBook();
  const {
    plan,
    DAYS,
    MEALS,
    addRecipeToDay,
    removeRecipeFromDay,
    clearAll,
    shoppingList,
    checkedItems,
    toggleChecked,
    clearChecked,
    getRecipesForDay,
    totalPlanned,
  } = useMealPlanner(recipes, currentUser?.uid);

  const [picker, setPicker] = useState(null);
  const [showShopping, setShowShopping] = useState(false);

  const weekDates = useMemo(() => getWeekDates(), []);
  const weekRange = useMemo(() => getWeekRange(weekDates), [weekDates]);

  const handlePickRecipe = (day, meal, recipeId) => {
    addRecipeToDay(day, meal, recipeId);
  };

  const checkedCount = shoppingList.filter(
    (item) => checkedItems[item.name.toLowerCase()],
  ).length;

  const handlePrint = () => window.print();

  return (
    <div className={classes.page}>
      {/* ===== Header ===== */}
      <div className={classes.header}>
        <div>
          <h1 className={classes.title}>{t("mealPlanner", "title")}</h1>
          <span className={classes.dateRange}>{weekRange}</span>
        </div>
        <div className={classes.headerActions}>
          <button
            className={classes.headerBtn}
            onClick={() => setShowShopping(true)}
          >
            <FiShoppingCart /> {t("mealPlanner", "shoppingList")}
            {shoppingList.length > 0 && (
              <span className={classes.badge}>{shoppingList.length}</span>
            )}
          </button>
          <button className={classes.headerBtn} onClick={handlePrint}>
            <FiPrinter /> {t("mealPlanner", "print")}
          </button>
          {totalPlanned > 0 && (
            <button className={classes.headerBtnOutline} onClick={clearAll}>
              {t("mealPlanner", "clearAll")}
            </button>
          )}
        </div>
      </div>

      {/* ===== Days Grid ===== */}
      <div className={classes.daysGrid}>
        {DAYS.map((day, dayIdx) => {
          const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
          const initial = t("mealPlanner", day).charAt(0);
          const dateStr = formatDayDate(weekDates[dayIdx]);

          return (
            <div key={day} className={classes.dayCard}>
              <div className={classes.dayHeader}>
                <span
                  className={classes.dayCircle}
                  style={{ background: color }}
                >
                  {initial}
                </span>
                <div className={classes.dayInfo}>
                  <span className={classes.dayName}>
                    {t("mealPlanner", day)}
                  </span>
                  <span className={classes.dayDate}>{dateStr}</span>
                </div>
              </div>

              <div className={classes.dayBody}>
                {MEALS.map((meal) => {
                  const mealRecipes = getRecipesForDay(day, meal);
                  const MealIcon = MEAL_ICONS[meal];
                  return (
                    <div key={meal} className={classes.mealBlock}>
                      <div className={classes.mealLabel}>
                        {MealIcon && <MealIcon className={classes.mealIcon} />}
                        <span>{t("mealPlanner", meal)}</span>
                      </div>
                      {mealRecipes.map((recipe) => (
                        <div key={recipe.id} className={classes.mealRecipeItem}>
                          <span
                            className={classes.recipeName}
                            onClick={() => navigate(`/recipe/${recipe.id}`)}
                          >
                            {recipe.name}
                          </span>
                          <button
                            className={classes.removeBtn}
                            onClick={() =>
                              removeRecipeFromDay(day, meal, recipe.id)
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <button
                className={classes.addMealBtn}
                onClick={() => setPicker({ day, meal: MEALS[0] })}
              >
                + {t("mealPlanner", "addMeal")}
              </button>
            </div>
          );
        })}
      </div>

      {/* ===== Recipe Picker Modal ===== */}
      {picker && (
        <MealPickerWrapper
          picker={picker}
          setPicker={setPicker}
          MEALS={MEALS}
          recipes={recipes}
          categories={categories}
          plan={plan}
          onSelect={handlePickRecipe}
          t={t}
        />
      )}

      {/* ===== Shopping List Modal ===== */}
      {showShopping && (
        <div
          className={classes.pickerOverlay}
          onClick={() => setShowShopping(false)}
        >
          <div
            className={classes.shoppingModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={classes.shoppingModalHeader}>
              <h3 className={classes.shoppingModalTitle}>
                🛒 {t("mealPlanner", "shoppingList")}
              </h3>
              <button
                className={classes.pickerClose}
                onClick={() => setShowShopping(false)}
              >
                ✕
              </button>
            </div>

            {shoppingList.length === 0 ? (
              <div className={classes.shoppingEmpty}>
                {t("mealPlanner", "emptyShoppingHint")}
              </div>
            ) : (
              <>
                <div className={classes.shoppingProgress}>
                  {checkedCount}/{shoppingList.length}{" "}
                  {t("mealPlanner", "purchased")}
                </div>
                <div className={classes.shoppingItems}>
                  {shoppingList.map((item) => {
                    const key = item.name.toLowerCase();
                    const isChecked = !!checkedItems[key];
                    return (
                      <label key={key} className={classes.shoppingItem}>
                        <input
                          type="checkbox"
                          className={classes.shoppingCheckbox}
                          checked={isChecked}
                          onChange={() => toggleChecked(key)}
                        />
                        <span
                          className={`${classes.shoppingName} ${isChecked ? classes.shoppingNameChecked : ""}`}
                        >
                          {item.count > 1
                            ? `${item.totalQty % 1 === 0 ? item.totalQty : item.totalQty.toFixed(1)} ${item.name}`
                            : item.display}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {checkedCount > 0 && (
                  <button className={classes.uncheckBtn} onClick={clearChecked}>
                    {t("mealPlanner", "uncheckAll")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MealPickerWrapper({
  picker,
  setPicker,
  MEALS,
  recipes,
  categories,
  plan,
  onSelect,
  t,
}) {
  const { getTranslated } = useTranslatedList(categories, "name");
  const [selectedMeal, setSelectedMeal] = useState(picker.meal);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState("");

  const getRecipesForCat = (catId) => {
    if (catId === "all") return recipes;
    if (catId === "general")
      return recipes.filter((r) => !r.categories || r.categories.length === 0);
    return recipes.filter((r) => r.categories && r.categories.includes(catId));
  };

  const filtered = selectedCat
    ? getRecipesForCat(selectedCat).filter((r) =>
        r.name?.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  const handleSelect = (recipeId) => {
    onSelect(picker.day, selectedMeal, recipeId);
  };

  const handleBack = () => {
    setSelectedCat(null);
    setSearch("");
  };

  return (
    <div className={classes.pickerOverlay} onClick={() => setPicker(null)}>
      <div className={classes.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={classes.pickerHeader}>
          <h3 className={classes.pickerTitle}>
            {selectedCat
              ? (() => {
                  const cat = categories.find((c) => c.id === selectedCat);
                  return cat
                    ? getTranslated(cat)
                    : t("categories", "allRecipes");
                })()
              : `${t("mealPlanner", picker.day)} — ${t("mealPlanner", "chooseRecipe")}`}
          </h3>
          <button
            className={classes.pickerClose}
            onClick={() => setPicker(null)}
          >
            ✕
          </button>
        </div>

        {!selectedCat ? (
          <div className={classes.pickerList}>
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
            <div className={classes.pickerSubHeader}>
              <button className={classes.backBtn} onClick={handleBack}>
                ← {t("mealPlanner", "chooseRecipe")}
              </button>
              <span className={classes.pickerSubCount}>
                {filtered.length} {t("recipesView", "recipesCount")}
              </span>
              <button
                className={classes.doneBtn}
                onClick={() => {
                  setSelectedCat(null);
                  setSearch("");
                }}
              >
                {t("common", "done") || "✓"}
              </button>
            </div>
            <div className={classes.pickerSearch}>
              <input
                className={classes.pickerSearchInput}
                placeholder={t("mealPlanner", "searchRecipes")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className={classes.pickerList}>
              {filtered.length === 0 ? (
                <div className={classes.pickerEmpty}>
                  {t("mealPlanner", "noRecipesFound")}
                </div>
              ) : (
                filtered.map((recipe) => {
                  const isAdded = (
                    plan[picker.day]?.[selectedMeal] || []
                  ).includes(recipe.id);
                  return (
                    <button
                      key={recipe.id}
                      className={`${classes.pickerItem} ${isAdded ? classes.pickerItemAdded : ""}`}
                      onClick={() => handleSelect(recipe.id)}
                    >
                      {recipe.image_src ? (
                        <img
                          className={classes.pickerItemImage}
                          src={recipe.image_src}
                          alt=""
                        />
                      ) : (
                        <span className={classes.pickerItemEmoji}>🍽️</span>
                      )}
                      <span className={classes.pickerItemName}>
                        {recipe.name}
                      </span>
                      {isAdded && (
                        <FiCheck className={classes.pickerItemCheck} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MealPlanner;
