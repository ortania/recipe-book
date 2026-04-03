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
