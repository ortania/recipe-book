/**
 * Shared ingredient calculation helpers — normalization, unit conversion, classification.
 * Used by buildShoppingList (ingredientUtils) and the meal planner.
 */

// ─── Ingredient Name Normalization ───

const HE_PLURAL_MAP = {
  אגוזים: "אגוז",
  עגבניות: "עגבנייה",
  עגבניה: "עגבנייה",
  ביצים: "ביצים",
  בצלים: "בצל",
  פלפלים: "פלפל",
  גזרים: "גזר",
  תפוזים: "תפוז",
  לימונים: "לימון",
  פטריות: "פטרייה",
  קישואים: "קישוא",
  מלפפונים: "מלפפון",
  תפוחים: "תפוח",
  אבוקדו: "אבוקדו",
  שומים: "שום",
  חצילים: "חציל",
  כרובית: "כרובית",
  ברוקולי: "ברוקולי",
  תירסים: "תירס",
  אפונים: "אפונה",
  שעועיות: "שעועית",
  חומוסים: "חומוס",
  עדשים: "עדשים",

  שקדים: "שקד",
  קשיואים: "קישוא",
  צנוברים: "צנובר",
  תמרים: "תמר",
  תאנים: "תאנה",
  משמשים: "משמיש",
  שזיפים: "שזיף",
  ענבים: "ענבים",
  נענע: "נענע",
  כוסברה: "כוסברה",
  בטטות: "בטטה",
  תפוחים: "תפוח",
};

const EN_PLURAL_MAP = {
  tomatoes: "tomato",
  eggs: "egg",
  onions: "onion",
  carrots: "carrot",
  potatoes: "potato",
  peppers: "pepper",
  mushrooms: "mushroom",
  zucchinis: "zucchini",
  cucumbers: "cucumber",
  apples: "apple",
  lemons: "lemon",
  oranges: "orange",
  avocados: "avocado",
  cloves: "clove",
  olives: "olive",
  almonds: "almond",
  walnuts: "walnut",
  pecans: "pecan",
  dates: "date",
  figs: "fig",
  grapes: "grape",
  berries: "berry",
  strawberries: "strawberry",
  blueberries: "blueberry",
  chickpeas: "chickpea",
  lentils: "lentil",
  beans: "bean",
};

const HE_ALIASES = {
  "סודה לשתיה": "סודה לשתיה",
  "אגוזים": "אגוזים",
  "שקדים": "שקדים",
  "אגוזי מלך מרוסקים": "אגוזי מלך",
  "תפוחים חתוכים": "תפוח",
  "תפוחים קצוצים": "תפוח",

  "אגוזים קצוצים": "אגוז",
  "לימון סחוט": "לימון",
  "פלפל שחור": "פלפל שחור",
  "פלפל אדום": "גמבה אדומה",
  גמבה: "גמבה",
  "קמח כוסמין": "קמח כוסמין",
  "שיבולת שועל מלאה": "שיבולת שועל",
  "שיבולת שועל גסה": "שיבולת שועל גסה",
  "שיבולת שועל דקה": "שיבולת שועל",
  "שמן זית": "שמן זית",
  "שמן זית רגיל": "שמן זית",
  "שמן קנולה": "שמן קנולה",
  "שמן חמניות": "שמן חמניות",
  "תפוחי אדמה": "תפוח אדמה",
  "תפוח אדמה": "תפוח אדמה",
  "אבקת אפיה": "אבקת אפיה",
  "שיבולת שועל": "שיבולת שועל",
  "גבינת קוטג'": "גבינת קוטג'",
  "גבינת שמנת": "גבינת שמנת",
  "שמנת מתוקה": "שמנת מתוקה",
  "שמנת חמוצה": "שמנת חמוצה",
  "חמאת בוטנים": "חמאת בוטנים",
  "רוטב סויה": "רוטב סויה",
  "רוטב עגבניות": "רוטב עגבניות",
  "קמח תירס": "קמח תירס",
  "סוכר חום": "סוכר חום",
  "סוכר דמררה": "סוכר דמררה",
  "שוקולד מריר": "שוקולד מריר",
  "שוקולד חלב": "שוקולד חלב",
  "שוקולד לבן": "שוקולד לבן",
};

/**
 * Normalize an ingredient name to a canonical form.
 * Handles Hebrew plural→singular, English plural→singular, and known aliases.
 */
export function normalizeIngredientName(name) {
  if (!name) return "";
  const lower = name.trim().toLowerCase();

  if (HE_ALIASES[lower]) return HE_ALIASES[lower];

  const words = lower.split(/\s+/);
  const normalized = words
    .map((w) => HE_PLURAL_MAP[w] || EN_PLURAL_MAP[w] || w)
    .join(" ");

  if (HE_ALIASES[normalized]) return HE_ALIASES[normalized];
  return normalized;
}

// ─── Unit Normalization & Conversion ───

const UNIT_ALIASES = {
  // Weight
  גרם: "g",
  גרמים: "g",
  "גר'": "g",
  g: "g",
  gr: "g",
  gram: "g",
  grams: "g",
  קילו: "kg",
  קילוגרם: "kg",
  קילוגרמים: "kg",
  'ק"ג': "kg",
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  // Volume
  'מ"ל': "ml",
  'מ"ל': "ml",
  מל: "ml",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  ליטר: "l",
  ליטרים: "l",
  l: "l",
  liter: "l",
  liters: "l",
  // Spoons
  כף: "tbsp",
  כפות: "tbsp",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  כפית: "tsp",
  כפיות: "tsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  // Count
  יחידה: "piece",
  יחידות: "piece",
  "יח'": "piece",
  piece: "piece",
  pieces: "piece",
  // Cup
  כוס: "cup",
  כוסות: "cup",
  cup: "cup",
  cups: "cup",
  // Package
  חבילה: "pkg",
  חבילות: "pkg",
  // Other
  שקית: "bag",
  שקיות: "bag",
  קורט: "pinch",
  קמצוץ: "pinch",
  pinch: "pinch",
  bunch: "bunch",
  can: "can",
  cans: "can",
  slice: "slice",
  slices: "slice",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  pound: "lb",
  pounds: "lb",
  lb: "lb",
  lbs: "lb",
};

/**
 * Normalize a unit string to a canonical key.
 * Returns "" for unrecognized/empty units.
 */
export function normalizeUnit(unit) {
  if (!unit) return "";
  const lower = unit.trim().toLowerCase();
  return UNIT_ALIASES[lower] || "";
}

// Conversion groups: units that can be converted to a common base
const CONVERSION_GROUPS = {
  weight: {
    base: "g",
    factors: { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 },
  },
  volume: {
    base: "ml",
    factors: { ml: 1, l: 1000, tbsp: 15, tsp: 5, cup: 250 },
  },
};

function getConversionGroup(normalizedUnit) {
  for (const [group, data] of Object.entries(CONVERSION_GROUPS)) {
    if (normalizedUnit in data.factors) return { group, ...data };
  }
  return null;
}

/**
 * Convert a quantity from one normalized unit to another.
 * Returns { qty, unit } in the target unit, or null if not convertible.
 */
export function convertUnit(qty, fromUnit, toUnit) {
  if (fromUnit === toUnit) return { qty, unit: toUnit };
  const fromGroup = getConversionGroup(fromUnit);
  const toGroup = getConversionGroup(toUnit);
  if (!fromGroup || !toGroup || fromGroup.group !== toGroup.group) return null;
  const baseQty = qty * fromGroup.factors[fromUnit];
  return { qty: baseQty / toGroup.factors[toUnit], unit: toUnit };
}

/**
 * Check if two normalized units are compatible (can be merged after conversion).
 */
export function unitsCompatible(unitA, unitB) {
  if (!unitA && !unitB) return true;
  if (unitA === unitB) return true;
  const gA = getConversionGroup(unitA);
  const gB = getConversionGroup(unitB);
  return !!(gA && gB && gA.group === gB.group);
}

/**
 * Merge two quantities with potentially different (but compatible) units.
 * Returns { qty, unit } in the best display unit, or null if not compatible.
 */
export function mergeQuantities(qtyA, unitA, qtyB, unitB) {
  const nA = normalizeUnit(unitA) || unitA;
  const nB = normalizeUnit(unitB) || unitB;

  if (!nA && !nB) return { qty: qtyA + qtyB, unit: "" };
  if (nA === nB) return { qty: qtyA + qtyB, unit: nA };

  const gA = getConversionGroup(nA);
  const gB = getConversionGroup(nB);
  if (!gA || !gB || gA.group !== gB.group) return null;

  const baseA = qtyA * gA.factors[nA];
  const baseB = qtyB * gB.factors[nB];
  const totalBase = baseA + baseB;

  const preferredUnit = pickDisplayUnit(totalBase, gA);
  return { qty: totalBase / gA.factors[preferredUnit], unit: preferredUnit };
}

function pickDisplayUnit(baseQty, groupData) {
  if (groupData.base === "g") {
    return baseQty >= 1000 ? "kg" : "g";
  }
  if (groupData.base === "ml") {
    return baseQty >= 1000 ? "l" : "ml";
  }
  return groupData.base;
}

// ─── Preparation Words (to strip from shopping display) ───

export const PREP_WORDS = [
  // Hebrew
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
  "דק", "דקה", "דקים", "דקות",
  "גס", "גסה", "גסים", "גסות",
  "מגוררים", "מגוררות", "מגורר", "מגוררת",
  "ממולחים", "ממולחות",
  "ללא", "בלי",
  // English
  "chopped", "diced", "minced", "sliced", "mashed",
  "melted", "thawed", "crushed", "grated", "peeled",
  "without",
];

const _prepJoined = PREP_WORDS.join("|");
export const PREP_STRIP_RE = new RegExp(`\\s+(${_prepJoined})(?=\\s|,|\\(|$)`, "gi");
export const PREP_ONLY_LINE_RE = new RegExp(`^(${_prepJoined})(?=\\s|$)`, "i");

// ─── Shopping Classification ───

const PANTRY_ITEMS = new Set([
  "סודה לשתיה",
  "תמצית וניל",
  "מלח",
  "salt",
  "פלפל",
  "pepper",
  "פלפל שחור",
  "black pepper",
  "שמן",
  "oil",
  "שמן זית",
  "olive oil",
  "שמן קנולה",
  "canola oil",
  "שמן חמניות",
  "sunflower oil",
  "סוכר",
  "sugar",
  "קמח",
  "flour",
  "אבקת אפיה",
  "baking powder",
  "סודה לשתייה",
  "baking soda",
  "וניל",
  "vanilla",
  "תמצית וניל",
  "vanilla extract",
  "קינמון",
  "cinnamon",
  "פפריקה",
  "paprika",
  "כורכום",
  "turmeric",
  "כמון",
  "cumin",
  "אורגנו",
  "oregano",
  "חומץ",
  "vinegar",
]);

const EXCLUDED_ITEMS = new Set(["מים", "מייים", "water"]);

const VAGUE_QUANTITY_PATTERNS =
  /לפי הטעם|לפי הצורך|מעט|קמצוץ|לקישוט|אופציונלי|optional|to taste|as needed|a? ?pinch|for garnish|for decoration|כמה טיפות|a few drops/i;

/**
 * Classify an ingredient for shopping purposes.
 * @param {string} ingredientName - normalized ingredient name
 * @param {string} rawText - original full ingredient text
 * @returns {{ shouldBuy: boolean, isPantry: boolean, excludeReason: string }}
 */
export function classifyIngredient(ingredientName, rawText = "") {
  const lower = ingredientName.toLowerCase();
  const rawLower = (rawText || "").toLowerCase();

  if (EXCLUDED_ITEMS.has(lower)) {
    return { shouldBuy: false, isPantry: false, excludeReason: "excluded" };
  }

  if (VAGUE_QUANTITY_PATTERNS.test(rawLower)) {
    return { shouldBuy: false, isPantry: false, excludeReason: "vague" };
  }

  if (PANTRY_ITEMS.has(lower)) {
    return { shouldBuy: true, isPantry: true, excludeReason: "" };
  }

  return { shouldBuy: true, isPantry: false, excludeReason: "" };
}

// ─── Display Helpers ───

const UNIT_DISPLAY_HE = {
  g: "גרם",
  kg: 'ק"ג',
  ml: 'מ"ל',
  l: "ליטר",
  tbsp: "כף",
  tsp: "כפית",
  cup: "כוס",
  piece: "יח'",
  pkg: "חבילה",
  bag: "שקית",
  pinch: "קמצוץ",
  bunch: "צרור",
  can: "פחית",
  slice: "פרוסה",
  oz: "oz",
  lb: "lb",
};

/**
 * Get a Hebrew display string for a normalized unit.
 */
export function displayUnit(normalizedUnit) {
  if (!normalizedUnit) return "";
  return UNIT_DISPLAY_HE[normalizedUnit] || normalizedUnit;
}

/**
 * Format a quantity for display (clean decimals).
 */
export function formatQty(qty) {
  if (qty == null || isNaN(qty)) return "";
  if (qty % 1 === 0) return String(qty);
  if (Math.abs(qty - 0.25) < 0.01) return "¼";
  if (Math.abs(qty - 0.33) < 0.01) return "⅓";
  if (Math.abs(qty - 0.5) < 0.01) return "½";
  if (Math.abs(qty - 0.67) < 0.01) return "⅔";
  if (Math.abs(qty - 0.75) < 0.01) return "¾";
  return qty.toFixed(1).replace(/\.0$/, "");
}
