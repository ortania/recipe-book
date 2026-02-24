/**
 * Shared utilities for ingredient parsing and shopping list aggregation.
 */

// ---- Ingredient Group Helpers ----
const GROUP_PREFIX = "::";

export function isGroupHeader(s) {
  return typeof s === "string" && s.startsWith(GROUP_PREFIX);
}

export function getGroupName(s) {
  return s.slice(GROUP_PREFIX.length).trim();
}

export function makeGroupHeader(name) {
  return `${GROUP_PREFIX}${name.trim()}`;
}

/**
 * Filter out group headers, returning only actual ingredient strings.
 */
export function ingredientsOnly(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((s) => s && !isGroupHeader(s));
}

// Section header words used in speech (e.g. "לבלילה", "לציפוי") – split ingredient strings by these
const SECTION_HEADER_WORDS =
  /(לבצק|למילוי|לציפוי|לעיטור|לבלילה|למלית|להגשה|לסירופ|לקרם|לקישוט|לקוביות|לתערובת|לשכבה)/i;

// Same section-header words for name stripping (when "שם עוגת גבינה לבלילה" puts לבלילה in the name)
const TRAILING_SECTION_HEADER = /\s+(לבצק|למילוי|לציפוי|לעיטור|לבלילה|למלית|להגשה|לסירופ|לקרם|לקישוט|לקוביות|לתערובת|לשכבה)\s*$/i;

/**
 * If the recipe name ends with a section header (e.g. "עוגת גבינה לבלילה"), returns
 * the name without it and the header, so the wizard can put "::לבלילה" at the start of ingredients.
 */
export function stripTrailingSectionHeaderFromName(nameStr) {
  if (typeof nameStr !== "string" || !nameStr.trim()) return { name: nameStr || "", header: null };
  const trimmed = nameStr.trim();
  const match = trimmed.match(TRAILING_SECTION_HEADER);
  if (!match) return { name: trimmed, header: null };
  const header = match[1];
  const nameWithout = trimmed.replace(new RegExp("\\s+" + header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "i"), "").trim();
  return { name: nameWithout, header };
}

/**
 * For "ניתוח רגיל" (parseRecipeFromText): ingredient strings may contain section headers
 * in the middle (e.g. "שתי כפות סוכר לבלילה גבינה 5%"). This splits such strings and
 * inserts "::header" lines so the UI shows separate groups.
 */
export function expandGroupHeadersInIngredients(ingredientsArray) {
  if (!Array.isArray(ingredientsArray)) return ingredientsArray;
  const out = [];
  for (const item of ingredientsArray) {
    if (typeof item !== "string" || !item.trim()) continue;
    if (item.startsWith(GROUP_PREFIX)) {
      out.push(item);
      continue;
    }
    const parts = item.split(SECTION_HEADER_WORDS);
    if (parts.length === 1) {
      if (looksLikeGroupHeader(item)) {
        out.push(GROUP_PREFIX + item.replace(/[:\-–—]\s*$/, "").trim());
      } else {
        out.push(item);
      }
      continue;
    }
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const trimmed = p.trim();
      if (!trimmed) continue;
      if (looksLikeGroupHeader(trimmed)) {
        out.push(GROUP_PREFIX + trimmed.replace(/[:\-–—]\s*$/, "").trim());
      } else {
        out.push(trimmed);
      }
    }
  }
  return out;
}

// ---- End Group Helpers ----

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

// Lines that look like group headers when ingredients are newline-separated (display only)
const DISPLAY_GROUP_LINE = /^(לבצק|למילוי|לציפוי|לעיטור|לבלילה|למלית|להגשה|לסירופ|לקרם|לקישוט|לקוביות|לתערובת|לשכבה)(\s|:|\s*$)/i;

function looksLikeGroupHeader(line) {
  const t = line.replace(/[:\-–—]\s*$/, "").trim();
  return t.length > 0 && t.length <= 50 && !/^\d/.test(t) && DISPLAY_GROUP_LINE.test(t);
}

/**
 * Parse a recipe's ingredients field into an array of strings.
 * When the string contains newlines, splits by newline and marks group-like lines with "::" for display.
 */
export function parseIngredients(recipe) {
  if (!recipe || !recipe.ingredients) return [];
  if (Array.isArray(recipe.ingredients)) return recipe.ingredients;
  if (typeof recipe.ingredients === "string") {
    const s = recipe.ingredients.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    if (!s) return [];
    const byNewline = s.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (byNewline.length > 1) {
      return byNewline.map((line) =>
        looksLikeGroupHeader(line) ? "::" + line.replace(/[:\-–—]+\s*$/, "").trim() : line,
      );
    }
    return s.split(",").map((part) => part.trim()).filter(Boolean);
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
      if (isGroupHeader(raw)) return;
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
