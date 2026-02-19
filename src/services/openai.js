const CLOUD_CHAT_URL =
  "https://us-central1-recipe-book-82d57.cloudfunctions.net/openaiChat";
const CLOUD_TTS_URL =
  "https://us-central1-recipe-book-82d57.cloudfunctions.net/openaiTts";

const nutritionCache = new Map();
const NUTRITION_CACHE_MAX = 50;

export const clearNutritionCache = () => {
  nutritionCache.clear();
};

export const speakWithOpenAI = async (text, voice = "nova") => {
  if (!text) return null;
  const response = await fetch(CLOUD_TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: voice,
      response_format: "mp3",
    }),
  });
  if (!response.ok) return null;
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const callOpenAI = async (requestBody) => {
  const response = await fetch(CLOUD_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let msg = `Cloud function error (${response.status})`;
    try {
      const err = await response.json();
      msg = err.error?.message || err.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error("Unexpected API response format");
  }
  return data.choices[0].message.content;
};

export const analyzeImageForNutrition = async (base64Image) => {
  return callOpenAI({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a nutrition expert. When shown an image of food, analyze it and provide detailed nutritional information including estimated calories, protein, carbs, fat, fiber, and notable vitamins or minerals. Be concise and practical. If you cannot identify the food, say so politely. Always respond in Hebrew.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze this food image and provide its estimated nutritional values per serving.",
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
              detail: "high",
            },
          },
        ],
      },
    ],
    temperature: 0.5,
    max_tokens: 800,
  });
};

export const extractRecipeFromImage = async (base64Image, language = "he") => {
  const result = await callOpenAI({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a recipe extraction expert. When shown an image of a recipe (from a book, website screenshot, handwritten note, etc.), extract all recipe information from it.
You MUST respond with valid JSON in this exact format:
{
  "name": "recipe name",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "15 min" or "",
  "cookTime": "30 min" or "",
  "servings": "4" or "",
  "notes": "" 
}
- Extract ALL ingredients with their exact quantities.
- Extract ALL instructions as separate steps.
- If you cannot read or identify a recipe in the image, return: {"error": "Could not extract recipe from image"}
- Keep the original language of the recipe as-is. Do not translate.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please extract the recipe from this image.",
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
              detail: "high",
            },
          },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 2000,
  });

  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return { error: result };
  }
};

export const extractRecipeFromText = async (text) => {
  const truncated = text.slice(0, 8000);
  const result = await callOpenAI({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a recipe extraction expert. Given raw text from a webpage, extract the recipe information.
You MUST respond with valid JSON in this exact format:
{
  "name": "recipe name",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "15" or "",
  "cookTime": "30" or "",
  "servings": "4" or ""
}
- Extract ALL ingredients with their exact quantities as separate array items.
- Extract ALL instructions as separate steps in order.
- prepTime and cookTime should be numbers in minutes only (no units).
- Keep the original language of the recipe. Do not translate.
- If you cannot find a recipe in the text, return: {"error": "No recipe found"}`,
      },
      {
        role: "user",
        content: `Extract the recipe from this webpage text:\n\n${truncated}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 2000,
  });

  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return { error: result };
  }
};

export const parseFreeSpeechRecipe = async (text, categoryNames = []) => {
  const categoriesHint =
    categoryNames.length > 0
      ? `\n- Available categories: ${categoryNames.join(", ")}. Pick the BEST matching category from this list based on the recipe content. Return the exact category name from the list.`
      : "";
  const result = await callOpenAI({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a recipe extraction expert. The user dictated a recipe using free speech (no special keywords).
Parse the spoken text and extract the recipe information.
You MUST respond with valid JSON in this exact format:
{
  "name": "recipe name",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "15" or "",
  "cookTime": "30" or "",
  "servings": "4" or "",
  "difficulty": "Easy" or "Medium" or "Hard" or "VeryEasy" or "",
  "category": "category name or empty string"
}
- Extract ALL ingredients with their exact quantities as separate array items.
- Extract ALL instructions as separate steps in order.
- prepTime and cookTime should be numbers in minutes only (no units).
- Keep the original language of the recipe. Do not translate.
- If difficulty is mentioned, map it to: VeryEasy, Easy, Medium, or Hard.
- Even if difficulty is NOT explicitly mentioned, try to estimate it from the recipe complexity.${categoriesHint}
- If you cannot find a recipe in the text, return: {"error": "No recipe found"}`,
      },
      {
        role: "user",
        content: `Parse this spoken recipe:\n\n${text}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 2000,
  });

  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return { error: result };
  }
};

const NUTRITION_FIELDS = [
  "calories", "protein", "fat", "carbs", "sugars",
  "fiber", "sodium", "calcium", "iron", "cholesterol", "saturatedFat",
];

const lookupSingleIngredient = async (ingredient) => {
  const result = await callOpenAI({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a nutrition database. Return the TOTAL nutritional values for the EXACT quantity of the given ingredient.
Return ONLY a JSON object, no markdown, no explanation:
{"calories":<n>,"protein":<n>,"fat":<n>,"carbs":<n>,"sugars":<n>,"fiber":<n>,"sodium":<n>,"calcium":<n>,"iron":<n>,"cholesterol":<n>,"saturatedFat":<n>}

Rules:
- Values are for the FULL quantity stated (e.g. "10 eggs" = 10 × single egg).
- 1 large egg = 72 cal, 6g protein, 5g fat, 0.4g carbs, 186mg cholesterol.
- 1 cup flour = 455 cal, 13g protein, 1g fat, 95g carbs.
- 100g chicken breast = 165 cal, 31g protein, 3.6g fat.
- Use USDA values. All numbers are integers. Unknown fields = 0.`,
      },
      { role: "user", content: ingredient },
    ],
    temperature: 0,
    max_tokens: 150,
  });

  let cleaned = result
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) cleaned = objMatch[0];
  return JSON.parse(cleaned);
};

export const calculateNutrition = async (ingredients, servings) => {
  const ingredientArray = Array.isArray(ingredients)
    ? ingredients
    : ingredients.split("\n").map((s) => s.trim()).filter(Boolean);
  const numServings = parseInt(servings, 10) || 1;

  const cacheKey = `${ingredientArray.join("|")}|${numServings}`;
  if (nutritionCache.has(cacheKey)) {
    return nutritionCache.get(cacheKey);
  }

  try {
    const results = await Promise.all(
      ingredientArray.map((ing) => lookupSingleIngredient(ing))
    );

    const totals = {};
    for (const f of NUTRITION_FIELDS) totals[f] = 0;
    for (const item of results) {
      for (const f of NUTRITION_FIELDS) {
        totals[f] += parseFloat(item[f]) || 0;
      }
    }

    const perServing = {};
    for (const f of NUTRITION_FIELDS) {
      perServing[f] = String(Math.round(totals[f] / numServings));
    }

    if (nutritionCache.size >= NUTRITION_CACHE_MAX) {
      const firstKey = nutritionCache.keys().next().value;
      nutritionCache.delete(firstKey);
    }
    nutritionCache.set(cacheKey, perServing);
    return perServing;
  } catch (err) {
    console.error("calculateNutrition failed:", err);
    return { error: err.message };
  }
};

const LANG_NAMES = {
  he: "Hebrew",
  en: "English",
  ru: "Russian",
  de: "German",
  mixed: "Hebrew",
};

export const sendCookingChatMessage = async (
  userText,
  recipeData,
  language = "he",
) => {
  const {
    recipeName,
    ingredients,
    instructions,
    activeTab,
    currentStep,
    servings,
    isTimerRunning,
  } = recipeData;

  const langName = LANG_NAMES[language] || "Hebrew";

  const currentItemText =
    activeTab === "ingredients"
      ? ingredients[currentStep] || ""
      : instructions[currentStep] || "";

  const tabLabel = activeTab === "ingredients" ? "Ingredients" : "Instructions";

  const systemMessage = {
    role: "system",
    content: `You are a voice cooking assistant helping a user cook "${recipeName}" (${servings} servings).

The user is currently viewing the ${tabLabel} tab.
${activeTab === "ingredients" ? `Current ingredient: ${currentStep + 1} of ${ingredients.length} - "${currentItemText}"` : `Current instruction step: ${currentStep + 1} of ${instructions.length} - "${currentItemText}"`}
Timer status: ${isTimerRunning ? "running" : "not running"}

All ingredients (with quantities):
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join("\n")}

All instructions:
${instructions.map((inst, i) => `${i + 1}. ${inst}`).join("\n")}

RULES:
- Answer cooking questions about this recipe concisely (1-2 sentences max).
- When answering about an instruction step, ALWAYS mention the specific ingredient quantities needed for that step.
- If the user asks "what do I need for this step" or similar, list the relevant ingredients with their exact quantities.
- If the user asks to go to next step, previous step, or a specific step, include the action in your response.
- Always respond in ${langName}.
- Keep answers SHORT - this will be read aloud.
- CRITICAL: Write ALL numbers as Hebrew words, NEVER use digits. Examples: "שתיים" not "2", "מאה" not "100", "חצי" not "0.5", "שלוש כפות" not "3 כפות". This is required for text-to-speech.
- You MUST respond with valid JSON in this exact format:
{"text": "your spoken response here", "action": null}

Possible actions:
- {"type": "next"} - go to next step
- {"type": "prev"} - go to previous step  
- {"type": "goto", "step": 3} - go to specific step (1-indexed)
- {"type": "timer", "minutes": 5} - start a cooking timer for X minutes
- {"type": "stop_timer"} - stop the currently running timer
- {"type": "switch_tab", "tab": "ingredients"} - switch to ingredients tab
- {"type": "switch_tab", "tab": "instructions"} - switch to instructions tab
- null - no navigation action

Examples:
"מה השלב הבא?" → {"text": "השלב הבא הוא להוסיף שתי ביצים וחצי כוס חלב", "action": {"type": "next"}}
"כמה מלח צריך?" → {"text": "צריך כפית מלח", "action": null}
"תלך לשלב 3" → {"text": "עוברים לשלב שלוש", "action": {"type": "goto", "step": 3}}
"תפעיל טיימר ל-10 דקות" → {"text": "מפעיל טיימר לעשר דקות", "action": {"type": "timer", "minutes": 10}}
"תעבור להוראות" → {"text": "עוברים להוראות", "action": {"type": "switch_tab", "tab": "instructions"}}`,
  };

  const result = await callOpenAI({
    model: "gpt-4o-mini",
    messages: [systemMessage, { role: "user", content: userText }],
    temperature: 0.3,
    max_tokens: 200,
  });

  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      text: parsed.text || result,
      action: parsed.action || null,
    };
  } catch {
    const textMatch = result.match(/"text"\s*:\s*"([^"]+)"/);
    if (textMatch) {
      return { text: textMatch[1], action: null };
    }
    const cleanText = result
      .replace(/[{}"]/g, "")
      .replace(/\b(text|action|null|type)\b\s*:?\s*/gi, "")
      .replace(/,\s*$/g, "")
      .trim();
    return { text: cleanText || "לא הצלחתי להבין", action: null };
  }
};

export const sendChatMessage = async (
  messages,
  recipeContext = null,
  language = "he",
) => {
  const langName = LANG_NAMES[language] || "Hebrew";

  let contextBlock = "";
  if (recipeContext) {
    const { name, ingredients, instructions, notes, servings } = recipeContext;
    contextBlock = `\n\nYou are currently helping with the recipe "${name}" (${servings || ""} servings).

Ingredients:
${(ingredients || []).map((ing, i) => `${i + 1}. ${ing}`).join("\n")}

Instructions:
${(instructions || []).map((inst, i) => `${i + 1}. ${inst}`).join("\n")}
${notes ? `\nNotes: ${notes}` : ""}

Help the user with questions about THIS recipe - substitutions, adjustments, technique tips, etc. Keep answers concise and practical.`;
  }

  const systemMessage = {
    role: "system",
    content: `You are a helpful cooking assistant. You help users with recipe questions, ingredient substitutions, cooking techniques, and adjusting recipe quantities. Always be friendly, concise, and practical in your responses. Always respond in ${langName}.${contextBlock}`,
  };

  const recentMessages = messages.slice(-5).map(({ image, ...msg }) => msg);

  return callOpenAI({
    model: "gpt-4o-mini",
    messages: [systemMessage, ...recentMessages],
    temperature: 0.7,
    max_tokens: 500,
  });
};
