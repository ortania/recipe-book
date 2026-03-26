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
const TRAILING_SECTION_HEADER =
  /\s+(לבצק|למילוי|לציפוי|לעיטור|לבלילה|למלית|להגשה|לסירופ|לקרם|לקישוט|לקוביות|לתערובת|לשכבה)\s*$/i;

/**
 * If the recipe name ends with a section header (e.g. "עוגת גבינה לבלילה"), returns
 * the name without it and the header, so the wizard can put "::לבלילה" at the start of ingredients.
 */
export function stripTrailingSectionHeaderFromName(nameStr) {
  if (typeof nameStr !== "string" || !nameStr.trim())
    return { name: nameStr || "", header: null };
  const trimmed = nameStr.trim();
  const match = trimmed.match(TRAILING_SECTION_HEADER);
  if (!match) return { name: trimmed, header: null };
  const header = match[1];
  const nameWithout = trimmed
    .replace(
      new RegExp(
        "\\s+" + header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$",
        "i",
      ),
      "",
    )
    .trim();
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

// ---- Ingredient Scaling ----

export function scaleIngredient(ingredient, servings, originalServings) {
  if (servings === originalServings) return ingredient;

  const ratio = servings / originalServings;
  const numberRegex = /(\d+\/\d+|\d+\.?\d*|\d*\.\d+)/g;

  return ingredient.replace(numberRegex, (match) => {
    if (match.includes("/")) {
      const [num, denom] = match.split("/").map(Number);
      const scaled = (num / denom) * ratio;
      if (scaled === 0.5) return "1/2";
      if (scaled === 0.25) return "1/4";
      if (scaled === 0.75) return "3/4";
      if (scaled === 0.33 || scaled === 0.34) return "1/3";
      if (scaled === 0.67 || scaled === 0.66) return "2/3";
      return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
    }

    const num = parseFloat(match);
    const scaled = num * ratio;
    return scaled % 1 === 0
      ? scaled.toString()
      : scaled.toFixed(1).replace(/\.0$/, "");
  });
}

// ---- End Group Helpers ----

const junkPatterns =
  /related\s*articles|advertisement|sponsored|click\s*here|read\s*more|sign\s*up|subscribe|newsletter|copyright|©|http|www\.|ראה בקישור|לחצ[וי] כאן|see link|see recipe/i;

const nonIngredientWords =
  /^(יבשים|רטובים|לקישוט|להגשה|לציפוי|לבצק|למילוי|לעיטור|לבלילה|למלית|לסירופ|לקרם|לקוביות|לתערובת|לשכבה|אופציונלי|optional|for garnish|for serving|for decoration|מים|water)$/i;

// Common Hebrew measurement words to skip when extracting the key word
const measurementWords =
  /^(כוס|כוסות|כף|כפות|כפית|כפיות|גרם|ק"ג|קילו|ליטר|מ"ל|מל|חבילה|חבילות|שקית|שקיות|יח'|יחידה|יחידות|קורט|קמצוץ|cup|cups|tbsp|tsp|tablespoon|teaspoon|gram|grams|kg|liter|ml|oz|ounce|ounces|pound|pounds|lb|lbs|piece|pieces|bunch|can|cans|clove|cloves|slice|slices|pinch|dash|handful)$/i;

// Quantity adverbs to skip when extracting the key ("קצת מלח" → key should be "מלח")
const quantityAdverbs = /^(קצת|מעט|הרבה|שפע|כמה|little|some|few|lots)$/i;

// Ingredients to exclude entirely from the shopping list (common pantry basics)
const EXCLUDED_INGREDIENT_LINE =
  /^(מים|מייים|water|מלח ופלפל|salt and pepper|קצת מלח ופלפל|מלח|פלפל שחור|פלפל)$/i;
const EXCLUDED_FULL_TEXT = /\b(מים|מייים|water)\b/i;
const EXCLUDED_KEYS = new Set([
  "מלח",
  "salt",
  "פלפל",
  "pepper",
  "מים",
  "מייים",
  "water",
]);

// Compound ingredient names — if the first meaningful word matches a key here,
// consume the next word(s) to form the full name.
const COMPOUND_NAMES = {
  אבקת: "אבקת אפיה",
  שיבולת: "שיבולת שועל",
  גבינת: null, // keep next word: גבינת שמנת, גבינת קוטג'
  שמנת: null, // keep next word: שמנת מתוקה, שמנת חמוצה
  חמאת: null, // keep next word: חמאת בוטנים
  קמח: null, // keep next word: קמח תירס, קמח מלא
  שוקולד: null, // keep next word: שוקולד מריר, שוקולד חלב
  רוטב: null, // keep next word: רוטב סויה, רוטב עגבניות
  baking: "baking powder",
  cream: null,
  olive: "olive oil",
  coconut: null,
  soy: null,
};

// Preparation adjectives to strip from shopping display
const PREP_STRIP =
  /\s+(מגורד|מגורדים|מגורדת|קלוף|קלופים|קלופה|חצוי|חצויים|חצויה|מומס|מומסת|מומסים|מופשר|מופשרת|מופשרים)(\s|,|$)/gi;

/**
 * Build a normalized key for aggregation.
 * Strategy: strip leading number, then take the first meaningful word(s).
 * Supports compound names: "אבקת אפיה" stays as-is, "שיבולת שועל" stays as-is.
 * "2 תפוחים, מכל זן" → "תפוחים"
 * "3 כפות סוכר" → "סוכר" (skips measurement word כפות)
 * "1 כפית אבקת אפיה" → "אבקת אפיה"
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

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (
      !measurementWords.test(word) &&
      !quantityAdverbs.test(word) &&
      word.length > 1
    ) {
      // Check if this word starts a compound name
      if (word in COMPOUND_NAMES) {
        const fixed = COMPOUND_NAMES[word];
        if (fixed) return fixed; // exact compound like "אבקת אפיה"
        // null means keep next word dynamically
        const next = words[i + 1];
        if (next && next.length > 1 && !measurementWords.test(next)) {
          return word + " " + next;
        }
      }
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
 * Extract the measurement unit from an ingredient string (e.g. "גרם" from "153 גרם סוכר").
 */
function extractUnit(s) {
  const afterQty = s.replace(/^[\d\s½¼¾⅓⅔.,/\-]+/, "").trim();
  const words = afterQty.split(/\s+/);
  if (words.length > 1 && measurementWords.test(words[0])) {
    return words[0];
  }
  return "";
}

/**
 * Strip preparation-method adjectives for a cleaner shopping display.
 */
function cleanForShopping(s) {
  return s
    .replace(PREP_STRIP, "$2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Lines that look like group headers when ingredients are newline-separated (display only)
const DISPLAY_GROUP_LINE =
  /^(לבצק|למילוי|לציפוי|לעיטור|לבלילה|למלית|להגשה|לסירופ|לקרם|לקישוט|לקוביות|לתערובת|לשכבה)(\s|:|\s*$)/i;

function looksLikeGroupHeader(line) {
  const t = line.replace(/[:\-–—]\s*$/, "").trim();
  return (
    t.length > 0 &&
    t.length <= 50 &&
    !/^\d/.test(t) &&
    DISPLAY_GROUP_LINE.test(t)
  );
}

/**
 * Parse a recipe's ingredients field into an array of strings.
 * When the string contains newlines, splits by newline and marks group-like lines with "::" for display.
 */
export function parseIngredients(recipe) {
  if (!recipe || !recipe.ingredients) return [];
  if (Array.isArray(recipe.ingredients)) return recipe.ingredients;
  if (typeof recipe.ingredients === "string") {
    const s = recipe.ingredients
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();
    if (!s) return [];
    const byNewline = s
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (byNewline.length > 1) {
      return byNewline.map((line) =>
        looksLikeGroupHeader(line)
          ? "::" + line.replace(/[:\-–—]+\s*$/, "").trim()
          : line,
      );
    }
    return s
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

// ---- Ingredient Highlighting in Instructions ----

/**
 * Build search data from ingredients for highlighting in instruction text.
 * Returns entries sorted by name length (longest first) for greedy matching.
 */
export function buildIngredientSearchData(ingredientsArray) {
  const entries = [];
  const seenKeys = new Set();

  for (const ing of ingredientsArray) {
    if (isGroupHeader(ing)) continue;
    const key = normalizeKey(ing);
    if (!key || key.length < 2 || seenKeys.has(key)) continue;
    seenKeys.add(key);
    entries.push({ name: key, fullText: ing });
  }

  entries.sort((a, b) => b.name.length - a.name.length);
  return entries;
}

/**
 * Find ingredient names inside an instruction string and return segments
 * for rendering with highlights and tooltips.
 *
 * @param {string} text - instruction text
 * @param {Array} entries - from buildIngredientSearchData
 * @param {Function} [scaleFn] - optional scaleIngredient wrapper
 * @returns {Array|null} segments array, or null if no matches
 *
 * Each segment: { text: string, highlight?: boolean, tooltip?: string }
 */
export function highlightIngredientsInText(text, entries, scaleFn) {
  if (!text || !entries || entries.length === 0) return null;

  // Safe Hebrew prefixes: ה (the), ו (and), ב (in), ל (to/for), כ (like).
  // Excludes מ and ש to avoid false positives (מחממים, שמים).
  // Lookbehind/lookahead enforce Hebrew-aware word boundaries.
  const patterns = entries.map((e) => {
    const escaped = e.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return `(?<![א-ת])(?:[הובלכ](?:ה)?)?${escaped}(?![א-ת])`;
  });

  const regex = new RegExp(`(${patterns.join("|")})`, "g");

  const segments = [];
  let lastIndex = 0;
  let hasMatch = false;

  for (const match of text.matchAll(regex)) {
    hasMatch = true;
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    const matchLower = match[0].toLowerCase();
    let tooltip = match[0];
    for (const entry of entries) {
      if (matchLower.includes(entry.name)) {
        tooltip = scaleFn ? scaleFn(entry.fullText) : entry.fullText;
        break;
      }
    }

    segments.push({ text: match[0], tooltip, highlight: true });
    lastIndex = match.index + match[0].length;
  }

  if (!hasMatch) return null;

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments;
}

// ---- End Ingredient Highlighting ----

/**
 * Build an aggregated shopping list from an array of recipe IDs.
 * @param {string[]} selectedIds - recipe IDs to include
 * @param {object[]} recipes - all available recipes
 * @returns {Array<{name: string, unit: string, count: number, totalQty: number, display: string, displayText: string}>}
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
      if (EXCLUDED_FULL_TEXT.test(raw)) return;

      const stripped = raw.replace(/^[\d\s½¼¾⅓⅔.,/\-]+/, "").trim();
      if (EXCLUDED_INGREDIENT_LINE.test(stripped)) return;

      const key = normalizeKey(raw) || raw.toLowerCase();
      if (!key || nonIngredientWords.test(key)) return;
      if (EXCLUDED_KEYS.has(key)) return;

      const qty = extractQty(raw);
      const unit = extractUnit(raw);
      const cleaned = cleanForShopping(raw);

      if (ingredientMap[key]) {
        ingredientMap[key].count += 1;
        ingredientMap[key].totalQty += qty;
        if (!ingredientMap[key].unit && unit) {
          ingredientMap[key].unit = unit;
        }
        if (cleaned.length > ingredientMap[key].display.length) {
          ingredientMap[key].display = cleaned;
        }
      } else {
        ingredientMap[key] = {
          name: key,
          unit: unit,
          count: 1,
          totalQty: qty,
          display: cleaned,
        };
      }
    });
  });

  return Object.values(ingredientMap)
    .map((item) => {
      if (item.count > 1) {
        const qtyStr =
          item.totalQty % 1 === 0
            ? String(item.totalQty)
            : item.totalQty.toFixed(1);
        item.displayText = item.unit
          ? `${qtyStr} ${item.unit} ${item.name}`
          : `${qtyStr} ${item.name}`;
      } else {
        item.displayText = item.display;
      }
      return item;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
