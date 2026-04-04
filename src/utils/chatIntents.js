const INTENT_PATTERNS = {
  ingredients_based: [
    /יש\s*לי\s.*(מצרכים|מרכיבים|חומרים|ירקות|ביצים|עגבניות|בצל)/,
    /מה\s*(אפשר|אוכל|ניתן)\s*(להכין|לבשל|לאפות)\s*(עם|מ)/,
    /i have .*(ingredients|eggs|tomatoes|chicken|vegetables)/i,
    /what (can|to) (make|cook|bake) with/i,
  ],
  recipe_idea: [
    /רעיון\s*(ל|של)?/,
    /מה\s*(להכין|לבשל|לאפות)/,
    /תני?\s*לי\s*רעיון/,
    /תציע[יו]?\s*(מתכון|ארוחה|משהו)/,
    /מה\s*מכינים/,
    /give me .*(idea|suggestion|recipe)/i,
    /what (should|to) (cook|make|bake)/i,
    /suggest .*(recipe|meal|dish)/i,
  ],
  meal_goal: [
    /בריא/,
    /מהיר/,
    /קל\s*(ו|להכנה)/,
    /לילדים/,
    /חלבון/,
    /טבעוני/,
    /ללא\s*(גלוטן|סוכר|לקטוז)/,
    /בלי\s*(גלוטן|סוכר|לקטוז)/,
    /דיאט/,
    /קלור/,
    /low[- ]?(cal|carb|fat)/i,
    /healthy/i,
    /quick/i,
    /for kids/i,
    /high[- ]?protein/i,
    /vegan/i,
    /gluten[- ]?free/i,
  ],
  recipe_improvement: [
    /לשדרג/,
    /לשפר/,
    /להחליף/,
    /להפחית/,
    /להתאים/,
    /גרסה\s*(יותר|בריאה|מהירה|קלה)/,
    /תחליף\s*(ל|של)?/,
    /איך\s*(לשדרג|לשפר|להפוך)/,
    /improve/i,
    /upgrade/i,
    /substitute/i,
    /make it .*(healthier|faster|easier|better)/i,
  ],
};

export function detectIntent(message) {
  if (!message || typeof message !== "string") return "general_food_question";
  const text = message.trim();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some((re) => re.test(text))) return intent;
  }
  return "general_food_question";
}

const INTENT_HINTS = {
  recipe_idea:
    "The user wants recipe ideas. Suggest 3–5 concrete, practical recipe ideas. For each idea give the name and one short sentence describing it. Keep it concise and inspiring.",
  ingredients_based:
    "The user has specific ingredients and wants to know what to cook. Suggest 3–5 practical dishes they can make with those ingredients. Prioritize simple, realistic options.",
  meal_goal:
    "The user is looking for recipes that match a specific goal (healthy, quick, for kids, high protein, etc.). Suggest 3–5 options tailored to that goal. Be practical and specific.",
  recipe_improvement:
    "The user wants to improve or modify a recipe. Give clear, actionable suggestions: what to change and how. Be specific rather than generic.",
  general_food_question: "",
};

export function getIntentPromptHint(intent) {
  return INTENT_HINTS[intent] || "";
}

const FOLLOW_UP_MAP = {
  recipe_idea: [
    { labelKey: "followUpMoreIdeas", promptKey: "followUpMoreIdeasPrompt" },
    { labelKey: "followUpHealthier", promptKey: "followUpHealthierPrompt" },
    { labelKey: "followUpForKids", promptKey: "followUpForKidsPrompt" },
    { labelKey: "followUpHighProtein", promptKey: "followUpHighProteinPrompt" },
  ],
  ingredients_based: [
    { labelKey: "followUpMoreIdeas", promptKey: "followUpMoreIdeasPrompt" },
    { labelKey: "followUpFullRecipe", promptKey: "followUpFullRecipePrompt" },
    { labelKey: "followUpHighProtein", promptKey: "followUpHighProteinPrompt" },
  ],
  meal_goal: [
    { labelKey: "followUpEasiest", promptKey: "followUpEasiestPrompt" },
    { labelKey: "followUpFewerCalories", promptKey: "followUpFewerCaloriesPrompt" },
    { labelKey: "followUpHighProtein", promptKey: "followUpHighProteinPrompt" },
  ],
  recipe_improvement: [
    { labelKey: "followUpMoreImprovements", promptKey: "followUpMoreImprovementsPrompt" },
    { labelKey: "followUpQuicker", promptKey: "followUpQuickerPrompt" },
  ],
  general_food_question: [
    { labelKey: "followUpMoreIdeas", promptKey: "followUpMoreIdeasPrompt" },
    { labelKey: "followUpHighProtein", promptKey: "followUpHighProteinPrompt" },
    { labelKey: "followUpForKids", promptKey: "followUpForKidsPrompt" },
  ],
};

export function getFollowUpActions(intent) {
  return FOLLOW_UP_MAP[intent] || [];
}

const ACTION_HEALTHIER   = { key: "healthier",   labelKey: "healthierVersion",  icon: "Heart" };
const ACTION_PROTEIN     = { key: "protein",     labelKey: "addProtein",        icon: "Dumbbell" };
const ACTION_QUICK       = { key: "quick",       labelKey: "quickerVersion",    icon: "Zap" };
const ACTION_KIDS        = { key: "kids",        labelKey: "kidFriendly",       icon: "Baby" };
const ACTION_VEGAN       = { key: "vegan",       labelKey: "veganVersion",      icon: "Leaf" };
const ACTION_GLUTEN_FREE = { key: "glutenFree",  labelKey: "glutenFreeVersion", icon: "WheatOff" };

const KEYWORD_ACTION_RULES = [
  { test: /בריא.*חלבון|חלבון.*בריא|healthy.*protein|protein.*healthy/i,  actions: [ACTION_HEALTHIER, ACTION_PROTEIN] },
  { test: /בריא|דיאט|קלור|low[- ]?cal|healthy|diet|lighter/i,           actions: [ACTION_HEALTHIER] },
  { test: /חלבון|high[- ]?protein|protein/i,                             actions: [ACTION_PROTEIN] },
  { test: /לילדים|ילדים|for kids|kids/i,                                 actions: [ACTION_KIDS, ACTION_HEALTHIER] },
  { test: /טבעוני|צמחוני|vegan|vegetarian/i,                             actions: [ACTION_VEGAN] },
  { test: /ללא\s*גלוטן|בלי\s*גלוטן|gluten[- ]?free/i,                  actions: [ACTION_GLUTEN_FREE] },
  { test: /מהיר|קל|פשוט|quick|easy|fast|simple/i,                        actions: [ACTION_QUICK] },
];

export function getRecipeResultActions(userMessage) {
  const text = typeof userMessage === "string" ? userMessage : "";
  for (const rule of KEYWORD_ACTION_RULES) {
    if (rule.test.test(text)) return rule.actions;
  }
  return [ACTION_HEALTHIER, ACTION_PROTEIN];
}

const REDUNDANCY_CHECKS = {
  vegan:      (t) => /\bטבעוני\b|\bvegan\b/i.test(t),
  glutenFree: (t) => /ללא\s*גלוטן|\bgluten.?free\b/i.test(t),
  kids:       (t) => /\bלילדים\b|\bfor\s+kids\b/i.test(t),
};

export function filterRedundantActions(actions, recipe) {
  if (!recipe || actions.length === 0) return actions;
  const text = [
    ...(Array.isArray(recipe.categories) ? recipe.categories : []),
    ...(Array.isArray(recipe.tags) ? recipe.tags : []),
  ].join(" ").toLowerCase();

  const filtered = actions.filter((action) => {
    const check = REDUNDANCY_CHECKS[action.key];
    return !check || !check(text);
  });
  return filtered.length > 0 ? filtered : actions;
}

export const COMPACT_QUICK_SUGGESTIONS = [
  { labelKey: "quickSnack", promptKey: "quickSnack" },
  { labelKey: "quickDessert", promptKey: "quickDessert" },
  { labelKey: "quickHighProtein", promptKey: "quickHighProteinPrompt" },
];

/* ── Recipe-book search helpers ── */

const RECIPE_SEARCH_INTENTS = new Set([
  "recipe_idea", "ingredients_based", "meal_goal",
]);

export function shouldSearchRecipes(intent) {
  return RECIPE_SEARCH_INTENTS.has(intent);
}

const SEARCH_STOP = new Set([
  "של", "את", "עם", "מה", "יש", "לי", "אני", "רוצה", "אפשר",
  "משהו", "תני", "תן", "רעיון",
  "או", "גם", "כמו", "איזה", "כל", "הכי", "יותר", "מאוד",
  "זה", "זאת", "הוא", "היא", "כמה", "איך", "למה",
  "כי", "אם", "אבל", "אז", "עוד", "רק", "כן", "לא", "בלי", "ללא",
  "ערב", "בוקר", "צהריים",
  "אוכל", "בישול", "מתכון", "מתכונים", "שאלה", "כללית", "כללי", "תשאל", "תשאלי",
  "על", "אותי", "אותו", "אותה", "אותם", "שלי", "שלך", "שלו", "שלה",
  "טוב", "טובה", "יפה", "נחמד", "סתם", "פשוט", "בבקשה", "תודה",
  "i", "me", "my", "have", "the", "a", "an", "and", "or", "but",
  "what", "can", "to", "make", "cook", "bake", "want", "give", "some",
  "for", "with", "from", "that", "this", "is", "are", "it", "do", "how",
]);

function stripHebrewPrefix(word) {
  if (word.length <= 2) return word;
  const first = word[0];
  if ("בהוכלמש".includes(first)) return word.slice(1);
  return word;
}

function parseMinutes(val) {
  if (!val) return 0;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? 0 : n;
}

function getRecipeHint(recipe) {
  const totalMin = parseMinutes(recipe.prepTime) + parseMinutes(recipe.cookTime);
  if (totalMin > 0 && totalMin <= 30) return "hintQuick";

  const protein = parseFloat(recipe.nutrition?.protein);
  if (protein > 20) return "hintProtein";

  const ingCount = Array.isArray(recipe.ingredients) ? recipe.ingredients.filter(Boolean).length : 0;
  if (ingCount > 0 && ingCount <= 5) return "hintFewIngredients";

  const diff = (recipe.difficulty || "").toLowerCase();
  if (diff === "easy" || diff === "קל") return "hintEasy";

  return "";
}

export function findRelevantRecipes(userMessage, recipes, maxResults = 3) {
  if (!userMessage || !recipes || recipes.length === 0) return [];

  const raw = userMessage.toLowerCase().replace(/[.,!?;:"'()]/g, "").split(/\s+/).filter((w) => w.length > 1);
  const words = [];
  for (const w of raw) {
    if (SEARCH_STOP.has(w)) continue;
    words.push(w);
    const stripped = stripHebrewPrefix(w);
    if (stripped !== w && !SEARCH_STOP.has(stripped)) words.push(stripped);
  }
  if (words.length === 0) return [];

  const scored = [];
  for (const recipe of recipes) {
    const name = (recipe.name || "").toLowerCase();
    const ings = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.join(" ").toLowerCase()
      : (recipe.ingredients || "").toLowerCase();
    let score = 0;
    for (const w of words) {
      if (name.includes(w)) score += 3;
      if (ings.includes(w)) score += 1;
    }
    if (score > 0) scored.push({ recipe, name: recipe.name, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map(({ recipe: r, name }) => {
    const hint = getRecipeHint(r);
    return { id: r.id, name, ...(hint && { hint }) };
  });
}

/* ── Create-recipe-from-chat helpers ── */

const CREATE_RECIPE_INTENTS = new Set([
  "recipe_idea", "ingredients_based", "meal_goal",
]);

export function shouldOfferCreateRecipe(intent, assistantMessage) {
  if (!assistantMessage || assistantMessage.length < 40) return false;
  if (CREATE_RECIPE_INTENTS.has(intent)) return true;
  if (extractRecipeNames(assistantMessage).length > 0) return true;
  return false;
}

export function extractRecipeNames(text) {
  if (!text) return [];
  const names = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!/^(?:\d+[.)]\s*|-\s+|•\s+)/.test(trimmed)) continue;

    const boldMatch = trimmed.match(/\*\*(.+?)\*\*/);
    if (boldMatch) {
      const name = boldMatch[1].trim();
      if (name.length >= 3 && name.length <= 60) { names.push(name); continue; }
    }

    const m = trimmed.match(/^(?:\d+[.)]\s*|-\s+|•\s+)\s*(.+)$/);
    if (m) {
      const raw = m[1].replace(/\*+/g, "").replace(/\s*[-–:]\s.*$/, "").trim();
      if (raw.length >= 3 && raw.length <= 60) names.push(raw);
    }
  }
  return names;
}

export function buildRecipeDraftFromChat(text) {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let name = "";
  const ingredients = [];
  const instructions = [];
  let section = "";

  for (const line of lines) {
    if (/^#{1,3}\s|^[*]*מרכיבים|^[*]*מצרכים|^[*]*חומרים|^[*]*ingredients/i.test(line)) {
      section = "ingredients";
      continue;
    }
    if (/^[*]*הוראות|^[*]*אופן הכנה|^[*]*שלבים|^[*]*instructions|^[*]*steps|^[*]*directions/i.test(line)) {
      section = "steps";
      continue;
    }
    const clean = line.replace(/^[\d.)\-*•–—]+\s*/, "").replace(/\*+/g, "").trim();
    if (!name && clean.length >= 3 && clean.length <= 80 && section === "") {
      name = clean;
      continue;
    }
    if (section === "ingredients" && clean.length >= 2) {
      ingredients.push(clean);
    } else if (section === "steps" && clean.length >= 5) {
      instructions.push(clean);
    }
  }

  if (!name && lines.length > 0) name = lines[0].replace(/\*+/g, "").trim().slice(0, 60);

  const draft = { name };
  if (ingredients.length > 0) draft.ingredients = ingredients;
  if (instructions.length > 0) draft.instructions = instructions;
  return draft;
}
