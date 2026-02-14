import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchMealPlan,
  saveMealPlan,
  fetchShoppingChecked,
  saveShoppingChecked,
} from "../firebase/mealPlanService";

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const MEALS = ["breakfast", "lunch", "dinner"];

function getEmptyPlan() {
  const plan = {};
  DAYS.forEach((day) => {
    plan[day] = {};
    MEALS.forEach((meal) => {
      plan[day][meal] = [];
    });
  });
  return plan;
}

export function useMealPlanner(recipes = [], userId = null) {
  const [plan, setPlan] = useState(getEmptyPlan);
  const [checkedItems, setCheckedItems] = useState({});
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);
  const checkedTimerRef = useRef(null);

  // Load from Firebase on mount / userId change
  useEffect(() => {
    if (!userId) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await fetchMealPlan(userId);
      if (!cancelled) {
        setPlan(data?.plan || getEmptyPlan());
      }
      const checked = await fetchShoppingChecked(userId);
      if (!cancelled) {
        setCheckedItems(checked);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Debounced save plan to Firebase
  useEffect(() => {
    if (!userId || !loaded) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveMealPlan(userId, plan).catch(console.error);
    }, 800);
    return () => clearTimeout(saveTimerRef.current);
  }, [plan, userId, loaded]);

  // Debounced save checked items to Firebase
  useEffect(() => {
    if (!userId || !loaded) return;
    clearTimeout(checkedTimerRef.current);
    checkedTimerRef.current = setTimeout(() => {
      saveShoppingChecked(userId, checkedItems).catch(console.error);
    }, 800);
    return () => clearTimeout(checkedTimerRef.current);
  }, [checkedItems, userId, loaded]);

  const addRecipeToDay = useCallback((day, meal, recipeId) => {
    setPlan((prev) => {
      const dayPlan = prev[day] || {};
      const mealList = dayPlan[meal] || [];
      if (mealList.includes(recipeId)) return prev;
      return {
        ...prev,
        [day]: {
          ...dayPlan,
          [meal]: [...mealList, recipeId],
        },
      };
    });
  }, []);

  const removeRecipeFromDay = useCallback((day, meal, recipeId) => {
    setPlan((prev) => {
      const dayPlan = prev[day] || {};
      const mealList = dayPlan[meal] || [];
      return {
        ...prev,
        [day]: {
          ...dayPlan,
          [meal]: mealList.filter((id) => id !== recipeId),
        },
      };
    });
  }, []);

  const clearDay = useCallback((day) => {
    setPlan((prev) => ({
      ...prev,
      [day]: { breakfast: [], lunch: [], dinner: [] },
    }));
  }, []);

  const clearAll = useCallback(() => {
    setPlan(getEmptyPlan());
    setCheckedItems({});
  }, []);

  const toggleChecked = useCallback((key) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const clearChecked = useCallback(() => {
    setCheckedItems({});
  }, []);

  // Build shopping list from plan
  const shoppingList = (() => {
    const ingredientMap = {};
    DAYS.forEach((day) => {
      MEALS.forEach((meal) => {
        const ids = plan[day]?.[meal] || [];
        ids.forEach((id) => {
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
            const fracs = {
              "½": 0.5,
              "¼": 0.25,
              "¾": 0.75,
              "⅓": 0.33,
              "⅔": 0.67,
            };
            if (fracs[v]) return fracs[v];
            const num = parseFloat(v);
            return isNaN(num) ? 1 : num;
          };
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
      });
    });
    return Object.values(ingredientMap).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  })();

  // Get recipe objects for a day
  const getRecipesForDay = useCallback(
    (day, meal) => {
      const ids = plan[day]?.[meal] || [];
      return ids.map((id) => recipes.find((r) => r.id === id)).filter(Boolean);
    },
    [plan, recipes],
  );

  // Count total planned recipes
  const totalPlanned = DAYS.reduce((sum, day) => {
    return (
      sum +
      MEALS.reduce((mealSum, meal) => {
        return mealSum + (plan[day]?.[meal]?.length || 0);
      }, 0)
    );
  }, 0);

  return {
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
  };
}
