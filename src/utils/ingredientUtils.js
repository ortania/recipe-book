/**
 * Shared utilities for ingredient parsing and shopping list aggregation.
 */

import {
  normalizeIngredientName,
  normalizeUnit,
  mergeQuantities,
  unitsCompatible,
  classifyIngredient,
  resolveCategory,
  displayUnit,
  formatQty,
  PREP_STRIP_RE,
  PREP_ONLY_LINE_RE,
  PREP_WORDS,
} from "./ingredientCalc.js";

const _prepSet = new Set(PREP_WORDS.map((w) => w.toLowerCase()));

// ---- Ingredient Group Helpers ----
const GROUP_PREFIX = "::";

export function isGroupHeader(s) {
  return typeof s === "string" && s.startsWith(GROUP_PREFIX);
}

export function getGroupName(s) {
  return s.slice(GROUP_PREFIX.length);
}

export function makeGroupHeader(name) {
  return `${GROUP_PREFIX}${name}`;
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
  /^(יבשים|רטובים|לקישוט|להגשה|לציפוי|לבצק|למילוי|לעיטור|לבלילה|למלית|לסירופ|לקרם|לקוביות|לתערובת|לשכבה|לשטרוייזל|לרוטב|לתבלינים|לטיגון|לאפייה|למרינדה|לגרנולה|לדבש|לזיגוג|לטופינג|אופציונלי|optional|for garnish|for serving|for decoration|for the|מים|water|מכל|תבנית|תבניות|נייר אפייה|קערה|קערות|סיר|מחבת|תנור|שמן לטיגון|שמן לריסוס|שמן לסיכה|שמן לצליה)$/i;

const NON_INGREDIENT_KEYS = new Set([
  "מכל", "תבנית", "תבניות", "נייר אפייה", "קערה", "קערות",
  "סיר", "מחבת", "תנור", "מים", "water",
]);

// General catch: lines starting with "ל" + description + no digits = section headers
const SECTION_LIKE_LINE = /^ל\S+\s+\S/;


// Common Hebrew measurement words to skip when extracting the key word
const measurementWords =
  /^(כוס|כוסות|כף|כפות|כפית|כפיות|גרם|ק"ג|קילו|ליטר|מ"ל|מל|חבילה|חבילות|שקית|שקיות|סלסלה|סלסלת|קופסה|קופסת|קופסא|יח'|יחידה|יחידות|קורט|קמצוץ|גביע|גביעים|גדושה|גדושות|גדוש|שטוחה|שטוחות|שטוח|קליפה|קליפת|חצאי|חצאים|פרוסה|פרוסות|נתח|נתחי|cup|cups|tbsp|tsp|tablespoon|teaspoon|gram|grams|kg|liter|ml|oz|ounce|ounces|pound|pounds|lb|lbs|piece|pieces|bunch|can|cans|clove|cloves|slice|slices|pinch|dash|handful|heaped|rounded|level|packed)$/i;

// Quantity adverbs, fractions, and Hebrew number words to skip when extracting the key
const quantityAdverbs = /^(קצת|מעט|הרבה|שפע|כמה|חצי|וחצי|רבע|שליש|רביע|אחד|אחת|שניים|שנים|שתיים|שתי|שלוש|שלושה|ארבע|ארבעה|חמש|חמישה|שש|שישה|שבע|שבעה|שמונה|תשע|תשעה|עשר|עשרה|ושליש|ורבע|little|some|few|lots|half|quarter|third)$/i;

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
  סודה: null, // keep next word: סודה לשתייה
  baking: null, // keep next word: baking powder, baking soda
  cream: null,
  olive: "olive oil",
  coconut: null,
  soy: null,
};


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
      !_prepSet.has(word) &&
      word.length > 1
    ) {
      // Check if this word starts a compound name
      if (word in COMPOUND_NAMES) {
        const fixed = COMPOUND_NAMES[word];
        if (fixed) return fixed; // exact compound like "אבקת אפיה"
        // null means keep next word dynamically (skip prep words)
        const next = words[i + 1];
        if (
          next &&
          next.length > 1 &&
          !measurementWords.test(next) &&
          !_prepSet.has(next)
        ) {
          return word + " " + next;
        }
      }
      return word;
    }
  }

  // No meaningful ingredient word found — return empty to filter out
  return "";
}

/**
 * Extract numeric quantity from the beginning of an ingredient string.
 */
const HE_NUMBERS = {
  אחד: 1, אחת: 1,
  שניים: 2, שנים: 2, שתיים: 2, שתי: 2,
  שלוש: 3, שלושה: 3,
  ארבע: 4, ארבעה: 4,
  חמש: 5, חמישה: 5,
  שש: 6, שישה: 6,
  שבע: 7, שבעה: 7,
  שמונה: 8,
  תשע: 9, תשעה: 9,
  עשר: 10, עשרה: 10,
  חצי: 0.5,
  שליש: 0.33,
  רבע: 0.25,
};

export function extractQty(s) {
  // Try numeric prefix first: "1", "1.5", "1/2", "½"
  const m = s.match(/^([\d½¼¾⅓⅔.,/]+)/);
  if (m) {
    const v = m[1].replace(",", ".");
    const fracs = {
      "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 0.33, "⅔": 0.67,
    };
    if (fracs[v]) return fracs[v];
    if (v.includes("/")) {
      const [num, denom] = v.split("/").map(Number);
      if (denom && !isNaN(num) && !isNaN(denom)) return num / denom;
    }
    const num = parseFloat(v);
    if (!isNaN(num)) {
      const rest = s.slice(m[0].length).trim();
      if (/^וחצי(?=\s|$)/.test(rest)) return num + 0.5;
      if (/^ורבע(?=\s|$)/.test(rest)) return num + 0.25;
      if (/^ושליש(?=\s|$)/.test(rest)) return num + 0.33;
      return num;
    }
  }
  // Try Hebrew number/fraction word: "חצי", "אחד וחצי", "שלוש כפות"
  const heWords = Object.keys(HE_NUMBERS).join("|");
  const heMatch = s.match(new RegExp(`^(${heWords})(?:\\s|$)`));
  if (heMatch) {
    const base = HE_NUMBERS[heMatch[1]];
    const rest = s.slice(heMatch[0].length).trim();
    if (/^וחצי(?=\s|$)/.test(rest)) return base + 0.5;
    if (/^ורבע(?=\s|$)/.test(rest)) return base + 0.25;
    if (/^ושליש(?=\s|$)/.test(rest)) return base + 0.33;
    return base;
  }
  return 1;
}

/**
 * Extract the measurement unit from an ingredient string (e.g. "גרם" from "153 גרם סוכר").
 */
const HE_NUM_WORDS_RE = /^(אחד|אחת|שניים|שנים|שתיים|שתי|שלוש|שלושה|ארבע|ארבעה|חמש|חמישה|שש|שישה|שבע|שבעה|שמונה|תשע|תשעה|עשר|עשרה|חצי|רבע|שליש|וחצי|ורבע|ושליש)\s+/i;

function extractUnit(s) {
  let afterQty = s.replace(/^[\d\s½¼¾⅓⅔.,/\-]+/, "").trim();
  // Skip Hebrew number/fraction words to reach the unit
  while (HE_NUM_WORDS_RE.test(afterQty)) {
    afterQty = afterQty.replace(HE_NUM_WORDS_RE, "").trim();
  }
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
    .replace(PREP_STRIP_RE, " ")
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

// Preparation words that are CLEARLY about preparation method (not type/grade).
// Excluded from PREP_WORDS: "דק/דקה/גס/גסה" — those describe TYPE for items
// like שיבולת שועל and we want to keep them as part of the ingredient name.
const CLEAR_PREP = new Set([
  "מגורד", "מגורדים", "מגורדת",
  "קלוף", "קלופים", "קלופה",
  "חצוי", "חצויים", "חצויה",
  "מומס", "מומסת", "מומסים",
  "מופשר", "מופשרת", "מופשרים",
  "קצוץ", "קצוצה", "קצוצים", "קצוצות",
  "טחון", "טחונה", "טחונים", "טחונות",
  "חתוך", "חתוכה", "חתוכים", "חתוכות",
  "מעוך", "מעוכה", "מעוכים", "מעוכות",
  "פרוס", "פרוסה", "פרוסים", "פרוסות",
  "מרוסק", "מרוסקת", "מרוסקים", "מרוסקות",
  "בשל", "בשלה", "בשלים", "בשלות",
  "מגוררים", "מגוררות", "מגורר", "מגוררת",
  "ממולחים", "ממולחות",
  "ללא", "בלי",
  // Size adjectives — usually just hints (לא סוג נפרד של ירק).
  // NOTE: "דק/דקה/דקים/דקות" and "גס/גסה/עבה/עבות" are intentionally OMITTED
  // because they describe the TYPE for products like שיבולת שועל / קמח.
  "גדול", "גדולה", "גדולים", "גדולות",
  "קטן", "קטנה", "קטנים", "קטנות",
  "בינוני", "בינונית", "בינוניים", "בינוניות",
  "ענק", "ענקית", "ענקיים", "ענקיות",
  "chopped", "diced", "minced", "sliced", "mashed",
  "melted", "thawed", "crushed", "grated", "peeled",
  "without",
  "large", "small", "medium", "big", "huge",
]);

// Synonym/default-variant map: aliases on the LEFT collapse to the canonical
// form on the RIGHT. So "סוכר לבן" merges with plain "סוכר" in the shopping
// list, and a generic "סוכר" mention in instructions matches a "סוכר לבן"
// ingredient line. Add entries here as new synonyms come up.
const DEFAULT_VARIANT = {
  "סוכר לבן": "סוכר",
  "סוכר רגיל": "סוכר",
  "סוכר פשוט": "סוכר",
  "קמח לבן": "קמח",
  "קמח רגיל": "קמח",
  "קמח חיטה": "קמח",
  "אורז לבן": "אורז",
  "אורז רגיל": "אורז",
  "מלח רגיל": "מלח",
  "מלח שולחן": "מלח",
  "white sugar": "sugar",
  "regular sugar": "sugar",
  "plain sugar": "sugar",
  "all-purpose flour": "flour",
  "all purpose flour": "flour",
  "white flour": "flour",
  "plain flour": "flour",
  "white rice": "rice",
  "table salt": "salt",
  "regular salt": "salt",
};

/**
 * Extract the full descriptive ingredient name (including type/variant adjectives).
 * Unlike `normalizeKey`, this keeps trailing descriptors so we can distinguish
 * variants like "סוכר" vs "סוכר חום" or "שיבולת שועל דקה" vs "שיבולת שועל עבה".
 *
 * Also:
 *  - Strips trailing preparation words (קלופים, מומס, chopped, …) so
 *    "תפוחי אדמה קלופים" merges with "תפוחי אדמה".
 *  - Canonicalizes synonyms via DEFAULT_VARIANT so "סוכר לבן" → "סוכר".
 *
 * "1 כוס סוכר חום"           → "סוכר חום"
 * "1/2 כוס שיבולת שועל דקה" → "שיבולת שועל דקה"
 * "2 כפות סוכר"             → "סוכר"
 * "1 כוס סוכר לבן"           → "סוכר"
 * "200 גרם תפוחי אדמה קלופים" → "תפוחי אדמה"
 */
function extractDisplayKey(rawIngredient) {
  if (typeof rawIngredient !== "string") return "";
  let s = rawIngredient
    .replace(/^[\d\s½¼¾⅓⅔.,/\-]+/, "")
    .trim()
    .toLowerCase();
  while (HE_NUM_WORDS_RE.test(s)) {
    s = s.replace(HE_NUM_WORDS_RE, "").trim();
  }
  if (!s) return "";

  const tokens = s.split(/\s+/).filter(Boolean);

  let i = 0;
  while (
    i < tokens.length &&
    (measurementWords.test(tokens[i]) ||
      quantityAdverbs.test(tokens[i]) ||
      _prepSet.has(tokens[i]))
  ) {
    i++;
  }
  if (i >= tokens.length) return "";

  // Take remaining tokens up to the first comma / parenthesis / semicolon;
  // these usually introduce a side note, not part of the ingredient name.
  // Also stop when we hit a trailing quantity/unit pattern such as
  // "סוכר 200 גרם" — once the ingredient name has started, a numeric token
  // or a measurement word marks the start of a trailing quantity.
  const out = [];
  for (let j = i; j < tokens.length; j++) {
    const tok = tokens[j];
    const cutIdx = tok.search(/[,،.;:()\[\]{}]/);
    if (cutIdx === 0) break;
    if (cutIdx > 0) {
      out.push(tok.slice(0, cutIdx));
      break;
    }
    // Trailing quantity: pure number, fraction, or measurement word.
    if (out.length > 0) {
      if (/^[\d½¼¾⅓⅔./\-]+$/.test(tok)) break;
      if (measurementWords.test(tok)) break;
    }
    out.push(tok);
  }

  // Strip trailing preparation words ("תפוחי אדמה קלופים" → "תפוחי אדמה").
  while (out.length > 1 && CLEAR_PREP.has(out[out.length - 1])) {
    out.pop();
  }

  const cleaned = out.filter((t) => /[א-תa-z]/i.test(t));
  if (cleaned.length === 0) return "";
  const joined = cleaned.join(" ").trim();
  // Canonicalize synonyms ("סוכר לבן" → "סוכר").
  return DEFAULT_VARIANT[joined] || joined;
}

/**
 * Build search data from ingredients for highlighting in instruction text.
 *
 * Strategy:
 *  - For each ingredient compute a short key (normalizeKey) AND a long key
 *    (extractDisplayKey, which preserves type/variant adjectives).
 *  - When two ingredients collapse to the same short key (e.g. "סוכר" and
 *    "סוכר חום" both → "סוכר"), use the LONG key for both so the regex can
 *    distinguish them in instruction text. Otherwise keep the short key
 *    (preserves the existing tolerant matching for single-variant recipes).
 *
 * Returns entries sorted by name length (longest first) for greedy matching.
 */
export function buildIngredientSearchData(ingredientsArray) {
  const items = [];
  for (const ing of ingredientsArray) {
    if (isGroupHeader(ing)) continue;
    const shortName = normalizeKey(ing);
    if (!shortName || shortName.length < 2) continue;
    const longName = extractDisplayKey(ing) || shortName;
    items.push({ shortName, longName, fullText: ing });
  }

  const shortCount = {};
  for (const it of items) {
    shortCount[it.shortName] = (shortCount[it.shortName] || 0) + 1;
  }

  const entries = [];
  const seenNames = new Set();
  for (const it of items) {
    const useName = shortCount[it.shortName] > 1 ? it.longName : it.shortName;
    if (!useName || useName.length < 2 || seenNames.has(useName)) continue;
    seenNames.add(useName);
    entries.push({ name: useName, fullText: it.fullText });
  }

  // Note: when a short name collides between only specialty variants (e.g.
  // recipe has "סוכר ונילי" + "סוכר חום" but no plain/white sugar), we DO NOT
  // register a generic short-name fallback. By design — bare "סוכר" in the
  // instructions means white/regular sugar; if the recipe has only specials,
  // we want NO highlight rather than an arbitrary specialty tooltip.

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
  // For multi-word names ("סוכר חום") we also allow an optional ה ("the") on
  // the inner words so "הסוכר החום" still matches.
  const patterns = entries.map((e) => {
    const words = e.name.split(/\s+/).filter(Boolean);
    const wordPatterns = words.map((w, idx) => {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const prefix = idx === 0 ? "(?:[הובלכ](?:ה)?)?" : "(?:ה)?";
      return prefix + escaped;
    });
    return `(?<![א-ת])${wordPatterns.join("\\s+")}(?![א-ת])`;
  });

  const regex = new RegExp(`(${patterns.join("|")})`, "g");
  // Per-entry anchored regex used to identify which entry produced a match
  // (a plain `match.includes(entry.name)` fails when Hebrew prefixes appear
  // on the inner words, e.g. "הסוכר החום").
  const entryRegexes = patterns.map((p) => new RegExp(`^${p}$`));

  const segments = [];
  let lastIndex = 0;
  let hasMatch = false;

  for (const match of text.matchAll(regex)) {
    hasMatch = true;
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    let tooltip = match[0];
    for (let k = 0; k < entries.length; k++) {
      if (entryRegexes[k].test(match[0])) {
        tooltip = scaleFn ? scaleFn(entries[k].fullText) : entries[k].fullText;
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
 * Normalizes ingredient names and units, converts compatible units before merging,
 * and classifies items as must-buy / pantry / excluded.
 *
 * @param {string[]} selectedIds - recipe IDs to include
 * @param {object[]} recipes - all available recipes
 * @returns {Array<{name: string, normalizedName: string, unit: string, normalizedUnit: string,
 *   count: number, totalQty: number, display: string, displayText: string,
 *   shouldBuy: boolean, isPantry: boolean, excludeReason: string}>}
 */
export function buildShoppingList(selectedIds, recipes) {
  // Map keyed by "normalizedName|normalizedUnit-group" for safe merging
  const ingredientMap = {};

  selectedIds.forEach((id) => {
    const recipe = recipes.find((r) => r.id === id);
    const ingredients = parseIngredients(recipe);

    ingredients.forEach((ing) => {
      const raw = ing.trim();
      if (!raw || raw.length < 2 || raw.length > 150) return;
      if (isGroupHeader(raw)) return;
      if (junkPatterns.test(raw)) return;

      const stripped = raw.replace(/^[\d\s½¼¾⅓⅔.,/\-]+/, "").trim();
      if (nonIngredientWords.test(stripped)) return;
      if (PREP_ONLY_LINE_RE.test(stripped)) return;
      if (SECTION_LIKE_LINE.test(stripped) && !/\d/.test(stripped)) return;

      // Prefer the long descriptive key (e.g. "סוכר חום" not just "סוכר")
      // so variants don't merge into one wrong shopping line.
      // Fall back to normalizeKey for items extractDisplayKey can't parse.
      const rawKey =
        extractDisplayKey(raw) || normalizeKey(raw) || raw.toLowerCase();
      if (!rawKey) return;
      if (/^\d+$/.test(rawKey)) return;
      if (!/[א-תa-zA-Z]/.test(rawKey)) return;
      if (!/[א-ת]/.test(rawKey) && rawKey.length < 3) return;
      if (NON_INGREDIENT_KEYS.has(rawKey)) return;
      // Also reject single-word keys that are pure non-ingredients
      // (e.g. extractDisplayKey may produce a multi-word "נייר אפייה ...").
      const firstWord = rawKey.split(/\s+/)[0];
      if (NON_INGREDIENT_KEYS.has(firstWord)) return;

      const normalizedName = normalizeIngredientName(rawKey);
      const rawUnit = extractUnit(raw);
      const normUnit = normalizeUnit(rawUnit) || rawUnit;
      const qty = extractQty(raw);
      const cleaned = cleanForShopping(raw);
      const classification = classifyIngredient(normalizedName, raw);

      // Build a merge key that keeps incompatible units separate
      // e.g. "ביצה|piece" vs "ביצה|g" won't merge
      const unitGroup = getUnitGroup(normUnit);
      const mergeKey = `${normalizedName}|${unitGroup}`;

      const existing = ingredientMap[mergeKey];
      if (existing) {
        const merged = mergeQuantities(
          existing.totalQty,
          existing.normalizedUnit,
          qty,
          normUnit,
        );
        if (merged) {
          existing.totalQty = merged.qty;
          existing.normalizedUnit = merged.unit;
        } else {
          existing.totalQty += qty;
        }
        existing.count += 1;
        if (cleaned.length > existing.display.length) {
          existing.display = cleaned;
        }
      } else {
        ingredientMap[mergeKey] = {
          name: rawKey,
          normalizedName,
          unit: rawUnit,
          normalizedUnit: normUnit,
          count: 1,
          totalQty: qty,
          display: cleaned,
          shouldBuy: classification.shouldBuy,
          isPantry: classification.isPantry,
          excludeReason: classification.excludeReason,
          category: resolveCategory(normalizedName),
        };
      }
    });
  });

  return Object.values(ingredientMap)
    .map((item) => {
      const qtyStr = formatQty(item.totalQty);
      const unitStr = displayUnit(item.normalizedUnit) || item.unit;
      item.displayText = unitStr
        ? `${qtyStr} ${unitStr} ${item.normalizedName}`
        : `${qtyStr} ${item.normalizedName}`;
      return item;
    })
    .sort((a, b) => {
      if (a.isPantry !== b.isPantry) return a.isPantry ? 1 : -1;
      return a.normalizedName.localeCompare(b.normalizedName);
    });
}

function getUnitGroup(normUnit) {
  if (!normUnit) return "count";
  if (["g", "kg", "oz", "lb"].includes(normUnit)) return "weight";
  if (["ml", "l", "tbsp", "tsp", "cup"].includes(normUnit)) return "volume";
  return normUnit;
}
