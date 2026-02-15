/**
 * Shared utilities for ingredient parsing and shopping list aggregation.
 */

const junkPatterns =
  /related\s*articles|advertisement|sponsored|click\s*here|read\s*more|sign\s*up|subscribe|newsletter|copyright|©|http|www\.|ראה בקישור|לחצ[וי] כאן|see link|see recipe/i;

const nonIngredientWords =
  /^(יבשים|רטובים|לקישוט|להגשה|לציפוי|אופציונלי|optional|for garnish|for serving|for decoration|מים|water)$/i;

// Common Hebrew measurement words to skip when extracting the key word
const measurementWords =
  /^(כוס|כוסות|כף|כפות|כפית|כפיות|גרם|ק"ג|קילו|ליטר|מ"ל|מל|חבילה|חבילות|שקית|שקיות|יח'|יחידה|יחידות|קורט|קמצוץ|cup|cups|tbsp|tsp|tablespoon|teaspoon|gram|grams|kg|liter|ml|oz|ounce|ounces|pound|pounds|lb|lbs|piece|pieces|bunch|can|cans|clove|cloves|slice|slices|pinch|dash|handful)$/i;

/**
 * Build a normalized key for aggregation.
 * Strategy: strip leading number, then take only the FIRST meaningful word.
 * "2 תפוחים, מכל זן" → "תפוחים"
 * "5 תפוחים קלופים" → "תפוחים"
 * "11 ביצים" → "ביצים"
 * "4 ביצים L" → "ביצים"
 * "3 כפות סוכר" → "סוכר" (skips measurement word כפות)
 */
export function normalizeKey(s) {
  // Strip leading numbers, fractions, punctuation
  const stripped = s
    .replace(/^[\d\s½¼¾⅓⅔.,/\-]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!stripped) return "";

  // Split into words and find the first non-measurement word
  const words = stripped.split(/[\s,،.;:()\-–—]+/).filter(Boolean);

  for (const word of words) {
    if (!measurementWords.test(word) && word.length > 1) {
      return word;
    }
  }

  // Fallback: return first word
  return words[0] || stripped;
}

/**
 * Extract numeric quantity from the beginning of an ingredient string.
 */
export function extractQty(s) {
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
}

/**
 * Parse a recipe's ingredients field into an array of strings.
 */
export function parseIngredients(recipe) {
  if (!recipe || !recipe.ingredients) return [];
  if (Array.isArray(recipe.ingredients)) return recipe.ingredients;
  if (typeof recipe.ingredients === "string") {
    return recipe.ingredients
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Build an aggregated shopping list from an array of recipe IDs.
 * @param {string[]} selectedIds - recipe IDs to include
 * @param {object[]} recipes - all available recipes
 * @returns {Array<{name: string, count: number, totalQty: number, display: string}>}
 */
export function buildShoppingList(selectedIds, recipes) {
  const ingredientMap = {};

  selectedIds.forEach((id) => {
    const recipe = recipes.find((r) => r.id === id);
    const ingredients = parseIngredients(recipe);

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
        // Keep the longer display string for more context
        if (raw.length > ingredientMap[key].display.length) {
          ingredientMap[key].display = raw;
        }
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
