import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiPrinter, FiShoppingCart } from "react-icons/fi";
import {
  Coffee,
  Salad,
  CookingPot,
  Plus,
  Check,
  Clock,
  ShoppingCart,
  ChevronLeft,
} from "lucide-react";
import { getCategoryIcon } from "../../utils/categoryIcons";
import {
  fetchGlobalRecipesCount,
  searchCommunityRecipes,
} from "../../firebase/globalRecipeService";
import { useRecipeBook, useLanguage } from "../../context";
import { useMealPlanner } from "../../hooks/useMealPlanner";
import useTranslatedList from "../../hooks/useTranslatedList";
import { SearchBox } from "../../components/controls/search";
import { CloseButton } from "../../components/controls/close-button";
import BackButton from "../../components/controls/back-button/BackButton";
import { ShoppingListView } from "../../components/shopping-list-view";
import { hasTime, formatTime } from "../../components/recipes/utils";
import classes from "./meal-planner.module.css";
import shared from "../../styles/shared/form-shared.module.css";
import btnClasses from "../../styles/shared/buttons.module.css";

const PICKER_STORAGE_KEY = "mealPlannerPickerState";
const HEBREW_DAY_LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

const MEAL_ICONS = { breakfast: Coffee, lunch: Salad, dinner: CookingPot };
const MEAL_FULL_KEYS = {
  breakfast: "mealBreakfast",
  lunch: "mealLunch",
  dinner: "mealDinner",
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
    d.toLocaleDateString("he-IL", { month: "short", day: "numeric" });
  return `${fmt(start)} - ${fmt(end)}, ${end.getFullYear()}`;
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
    clearDay,
    clearAll,
    shoppingList,
    checkedItems,
    toggleChecked,
    clearChecked,
    getRecipesForDay,
    totalPlanned,
  } = useMealPlanner(recipes, currentUser?.uid);

  const todayIdx = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(DAYS[todayIdx]);
  const [picker, setPicker] = useState(null);
  const [pickerKey, setPickerKey] = useState(0);
  const [showShopping, setShowShopping] = useState(false);
  const [mobileTabsEl, setMobileTabsEl] = useState(null);
  const [globalCount, setGlobalCount] = useState(null);

  useEffect(() => {
    fetchGlobalRecipesCount()
      .then((count) => setGlobalCount(count))
      .catch(() => setGlobalCount(0));
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PICKER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        sessionStorage.removeItem(PICKER_STORAGE_KEY);
        if (parsed.day) setSelectedDay(parsed.day);
        openPicker({
          day: parsed.day,
          meal: parsed.meal,
          _savedCat: parsed.selectedCat,
          _savedSearch: parsed.search,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

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

  const mobileTitle = (
    <span className={classes.mobileTitle}>
      {t("mealPlanner", "weeklyPlan")}
    </span>
  );

  const weekDates = useMemo(() => getWeekDates(), []);
  const weekRange = useMemo(() => getWeekRange(weekDates), [weekDates]);

  const dayMealCount = useMemo(
    () =>
      MEALS.reduce(
        (sum, meal) => sum + (plan[selectedDay]?.[meal]?.length || 0),
        0,
      ),
    [plan, selectedDay, MEALS],
  );

  const handlePickRecipe = (day, meal, recipeId) => {
    const mealList = plan[day]?.[meal] || [];
    if (mealList.includes(recipeId)) {
      removeRecipeFromDay(day, meal, recipeId);
    } else {
      addRecipeToDay(day, meal, recipeId);
    }
  };

  const openPicker = (pickerState) => {
    setPicker(pickerState);
    setPickerKey((k) => k + 1);
  };

  const dayPrefix = t("mealPlanner", "dayPrefix");
  const fullDayName = dayPrefix
    ? `${dayPrefix} ${t("mealPlanner", selectedDay)}`
    : t("mealPlanner", selectedDay);

  return (
    <div className={classes.page}>
      {mobileTabsEl && createPortal(mobileTitle, mobileTabsEl)}

      {/* ===== Sticky Top: Header + Day Strip ===== */}
      <div className={classes.stickyTop}>
        <div className={classes.header}>
          <div>
            {!mobileTabsEl && (
              <h1 className={classes.title}>{t("mealPlanner", "title")}</h1>
            )}
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
            <button
              className={btnClasses.iconBtn}
              onClick={() => window.print()}
              title={t("mealPlanner", "print")}
            >
              <FiPrinter size={20} />
            </button>
            {totalPlanned > 0 && (
              <button className={btnClasses.clearBtn} onClick={clearAll}>
                {t("mealPlanner", "clearAll")}
              </button>
            )}
          </div>
        </div>

        <div className={classes.dayStrip}>
          {DAYS.map((day, idx) => {
            const isSelected = selectedDay === day;
            const hasMeals = MEALS.some(
              (m) => (plan[day]?.[m]?.length || 0) > 0,
            );
            return (
              <button
                key={day}
                className={`${classes.dayChip} ${isSelected ? classes.dayChipActive : ""}`}
                onClick={() => setSelectedDay(day)}
              >
                <span className={classes.dayChipLetter}>
                  {HEBREW_DAY_LETTERS[idx]}׳
                </span>
                {hasMeals && <span className={classes.dayChipDot} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Selected Day Info ===== */}
      <div className={classes.selectedDayBar}>
        <div className={classes.selectedDayInfo}>
          <h2 className={classes.selectedDayName}>{fullDayName}</h2>
          <span className={classes.selectedDayCount}>
            {dayMealCount} {t("mealPlanner", "plannedMeals")}
          </span>
        </div>
        {dayMealCount > 0 && (
          <button
            className={btnClasses.clearBtn}
            onClick={() => clearDay(selectedDay)}
          >
            {t("mealPlanner", "clearDay")}
          </button>
        )}
      </div>

      {/* ===== Meal Cards ===== */}
      <div className={classes.mealsContainer}>
        {MEALS.map((meal) => {
          const mealRecipes = getRecipesForDay(selectedDay, meal);
          const MealIcon = MEAL_ICONS[meal];
          return (
            <div key={meal} className={classes.mealCard}>
              <div className={classes.mealCardHeader}>
                <MealIcon size={22} className={classes.mealIcon} />
                <span className={classes.mealCardTitle}>
                  {t("mealPlanner", MEAL_FULL_KEYS[meal])}
                </span>
              </div>

              {mealRecipes.map((recipe) => (
                <div key={recipe.id} className={classes.mealRecipeItem}>
                  <span
                    className={classes.recipeName}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                  >
                    {recipe.name}
                  </span>
                  <CloseButton
                    className={classes.removeBtn}
                    onClick={() =>
                      removeRecipeFromDay(selectedDay, meal, recipe.id)
                    }
                    size={16}
                  />
                </div>
              ))}

              <button
                className={`${shared.addDashedBtn} ${classes.addMealArea}`}
                onClick={() => openPicker({ day: selectedDay, meal })}
              >
                + {t("mealPlanner", "addMealAction")}
              </button>
            </div>
          );
        })}
      </div>

      {/* ===== Shopping Banner ===== */}
      {shoppingList.length > 0 && (
        <button
          className={classes.shoppingBanner}
          onClick={() => setShowShopping(true)}
        >
          <span className={classes.bannerIcon}>
            <ShoppingCart size={20} />
          </span>
          <span className={classes.bannerText}>
            <span className={classes.bannerTitle}>
              {t("mealPlanner", "shoppingListUpdated")}
            </span>
            <span className={classes.bannerSub}>
              {t("mealPlanner", "newItemsAdded").replace(
                "{count}",
                shoppingList.length,
              )}
            </span>
          </span>
          <ChevronLeft size={20} className={classes.bannerChevron} />
        </button>
      )}

      {/* ===== Recipe Picker Modal ===== */}
      {picker && (
        <MealPickerWrapper
          key={pickerKey}
          picker={picker}
          setPicker={setPicker}
          MEALS={MEALS}
          recipes={recipes}
          categories={categories}
          plan={plan}
          onSelect={handlePickRecipe}
          t={t}
          globalCount={globalCount}
          currentUserId={currentUser?.uid}
        />
      )}

      <div className={classes.bottomSpacer} />

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
              <CloseButton onClick={() => setShowShopping(false)} />
            </div>

            <ShoppingListView
              shoppingList={shoppingList}
              checkedItems={checkedItems}
              onToggleChecked={toggleChecked}
              onClearChecked={clearChecked}
            />
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
  globalCount,
  currentUserId,
}) {
  const navigate = useNavigate();
  const { getTranslated } = useTranslatedList(categories, "name");
  const [selectedMeal, setSelectedMeal] = useState(picker.meal);
  const [selectedCat, setSelectedCat] = useState(picker._savedCat || null);
  const [search, setSearch] = useState(picker._savedSearch || "");
  const [globalRecipes, setGlobalRecipes] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const originalIds = useMemo(
    () => new Set(plan[picker.day]?.[selectedMeal] || []),
    [plan, picker.day, selectedMeal],
  );
  const [selectedIds, setSelectedIds] = useState(() => new Set(originalIds));

  useEffect(() => {
    if (selectedCat !== "global" || globalRecipes.length > 0) return;
    setLoadingGlobal(true);
    searchCommunityRecipes({ excludeUserId: currentUserId, pageSize: 9999 })
      .then((result) => setGlobalRecipes(result.recipes || []))
      .catch(() => {})
      .finally(() => setLoadingGlobal(false));
  }, [selectedCat, currentUserId, globalRecipes.length]);

  const getRecipesForCat = (catId) => {
    if (catId === "all") return recipes;
    if (catId === "global") return globalRecipes;
    if (catId === "general")
      return recipes.filter((r) => !r.categories || r.categories.length === 0);
    return recipes.filter((r) => r.categories && r.categories.includes(catId));
  };

  const filtered = selectedCat
    ? getRecipesForCat(selectedCat).filter((r) =>
        r.name?.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  const handleToggle = (recipeId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });
  };

  const handleDone = () => {
    for (const id of selectedIds) {
      if (!originalIds.has(id)) onSelect(picker.day, selectedMeal, id);
    }
    for (const id of originalIds) {
      if (!selectedIds.has(id)) onSelect(picker.day, selectedMeal, id);
    }
    setPicker(null);
  };

  const handleBack = () => {
    setSelectedCat(null);
    setSearch("");
  };

  const handleViewRecipe = (recipeId) => {
    try {
      sessionStorage.setItem(
        PICKER_STORAGE_KEY,
        JSON.stringify({
          day: picker.day,
          meal: selectedMeal,
          selectedCat,
          search,
        }),
      );
    } catch {
      /* ignore */
    }
    navigate(`/recipe/${recipeId}`);
  };

  const newCount = [...selectedIds].filter((id) => !originalIds.has(id)).length;

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
          <CloseButton onClick={() => setPicker(null)} />
        </div>

        {!selectedCat ? (
          <div className={classes.pickerList}>
            <button
              className={classes.catListItem}
              onClick={() => setSelectedCat("global")}
            >
              <span className={classes.catListIcon}>
                {(() => {
                  const IC = getCategoryIcon("users");
                  return <IC size={16} />;
                })()}
              </span>
              <span className={classes.catListName}>מתכוני קהילה</span>
              <span className={classes.catListCount}>
                {globalCount != null ? globalCount : ""}
              </span>
            </button>
            <button
              className={classes.catListItem}
              onClick={() => setSelectedCat("all")}
            >
              <span className={classes.catListIcon}>
                {(() => {
                  const IC = getCategoryIcon("restaurant");
                  return <IC size={16} />;
                })()}
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
                    <span className={classes.catListIcon}>
                      {(() => {
                        const IC = getCategoryIcon(cat.icon);
                        return <IC size={16} />;
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
            <div className={classes.pickerSubHeader}>
              <BackButton onClick={handleBack} />
              <span className={classes.pickerSubCount}>
                {filtered.length} {t("recipesView", "recipesCount")}
              </span>
            </div>
            <div className={classes.pickerSearch}>
              <SearchBox
                searchTerm={search}
                onSearchChange={setSearch}
                placeholder={t("mealPlanner", "searchRecipes")}
                autoFocus
                className={classes.pickerSearchBox}
              />
            </div>
            <div className={classes.pickerList}>
              {loadingGlobal ? (
                <div className={classes.pickerEmpty}>
                  {t("common", "loading") || "טוען..."}
                </div>
              ) : filtered.length === 0 ? (
                <div className={classes.pickerEmpty}>
                  {t("mealPlanner", "noRecipesFound")}
                </div>
              ) : (
                filtered.map((recipe) => {
                  const isSelected = selectedIds.has(recipe.id);
                  const prepStr = hasTime(recipe.prepTime)
                    ? `${formatTime(recipe.prepTime, t("recipes", "minutes"))} ${t("recipes", "prepTime")}`
                    : null;
                  return (
                    <div
                      key={recipe.id}
                      className={`${classes.pickerItem} ${isSelected ? classes.pickerItemAdded : ""}`}
                      onClick={() => handleToggle(recipe.id)}
                    >
                      {recipe.image_src ? (
                        <img
                          className={classes.pickerItemImage}
                          src={recipe.image_src}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <span className={classes.pickerItemEmoji}>🍽️</span>
                      )}
                      <div className={classes.pickerItemInfo}>
                        <span className={classes.pickerItemName}>
                          {recipe.name}
                        </span>
                        {prepStr && (
                          <span className={classes.pickerItemPrep}>
                            {prepStr}
                          </span>
                        )}
                      </div>
                      <span
                        className={`${classes.pickerCheck} ${isSelected ? classes.pickerCheckActive : ""}`}
                      >
                        {isSelected && <Check size={16} />}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {selectedCat && (
          <div className={classes.pickerFooter}>
            <button
              className={classes.pickerDoneBtn}
              onClick={handleDone}
              disabled={newCount === 0 && selectedIds.size === originalIds.size}
            >
              {t("mealPlanner", "addSelectedRecipes")}
              {newCount > 0 && ` (${newCount})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MealPlanner;
