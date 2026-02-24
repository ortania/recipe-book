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

export const callOpenAI = async (requestBody, options = {}) => {
  const { signal } = options;
  const response = await fetch(CLOUD_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal,
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

export const analyzeImageForNutrition = async (base64Image, options = {}) => {
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
  }, options);
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
  "ingredients": ["::group name", "ingredient 1 with quantity", "ingredient 2", "::another group", "ingredient 3"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "15 min" or "",
  "cookTime": "30 min" or "",
  "servings": "4" or "",
  "notes": "" 
}
- Extract ALL ingredients with their exact quantities.
- Always write quantities as digits, not words. For example: "3 ביצים" not "שלוש ביצים", "2 cups" not "two cups". Always put the number BEFORE the ingredient.
- ONLY use "::" group prefixes for SPECIFIC named sub-sections like "::לבצק", "::למילוי", "::לציפוי", "::For the dough", "::For the filling". Do NOT create groups for generic words like "מרכיבים" (ingredients) or "הוראות" (instructions) - these are NOT groups. If there are no specific named sub-sections, just list all ingredients without any group headers.
- Extract ALL instructions as separate steps.
- If you cannot read or identify a recipe in the image, return: {"error": "Could not extract recipe from image"}
- CRITICAL: Keep the ENTIRE recipe in its original language. Do not translate ANY part.`,
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

/**
 * Multi-section Hebrew recipe extraction.
 * Headers: "לבלילה:", "לבלילת העוגה:", "למלית:", "לקישוט העוגה:", etc.
 * Prompt and rules tuned so the model returns ALL sections, not only the first.
 * Stability: temperature 0 + optional retry when result has very few ingredients.
 * Model: gpt-4o for reliable multi-section extraction (4o-mini caused regression).
 */
export const extractRecipeFromText = async (text) => {
  const truncated = text.slice(0, 15000);
  const hasMultipleSectionMarkers =
    /לבלילה|לבלילת|למלית|מלית|לקישוט|לציפוי|לעיטור|להגשה|למילוי|לבצק/.test(truncated);

  const buildUserMessage = (retry = false) =>
    retry
      ? `Second attempt: the text has multiple ingredient sections (e.g. לבלילה:, למלית:, לבלילת העוגה, לקישוט העוגה). List EVERY section and ALL ingredients for each. Output full JSON:\n\n${truncated}`
      : `Extract the recipe from this webpage text. IMPORTANT: If the text has section headers like "לבלילה:", "למלית:", "לבלילת העוגה:", "לקישוט העוגה:" (or similar), you MUST list ingredients for EVERY section - do not stop after the first. Include ALL ingredients from every section (לבלילה, למלית, לקישוט, לציפוי, לעיטור, להגשה, etc.) and ALL steps. Ignore ads:\n\n${truncated}`;

  const systemContent = `You are a recipe extraction expert. Given raw text from a webpage, extract ONLY the recipe information.
You MUST respond with valid JSON in this exact format:
{
  "name": "recipe name",
  "ingredients": ["::group name", "ingredient 1 with quantity", "ingredient 2", "::another group", "ingredient 3"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "15" or "",
  "cookTime": "30" or "",
  "servings": "4" or ""
}
- Extract ALL ingredients with their exact quantities as separate array items. Do NOT skip any ingredient. Scan the ENTIRE text from start to end.
- Always write quantities as digits, not words. For example: "3 ביצים" not "שלוש ביצים", "2 cups" not "two cups". Always put the number BEFORE the ingredient.
- ONLY use "::" group prefixes for SPECIFIC named sub-sections like "::לבלילה", "::למלית", "::לבצק", "::למילוי", "::לציפוי", "::לעיטור", "::להגשה", "::לקישוט", "::For the dough", "::For the filling". Do NOT create groups for generic words like "מרכיבים" (ingredients) or "הוראות" (instructions) - these are NOT groups. If there are no specific named sub-sections, just list all ingredients without any group headers.
- CRITICAL - Multiple Hebrew sections: The page often has headers like "לבלילה:" (for batter), "למלית:" (for filling), "לציפוי", "לעיטור" (decoration), "לבלילת העוגה:", "לקישוט העוגה:", "להגשה", etc. You MUST output ingredients for EVERY such section. Never output only the first section and stop. Always scan the full text for every section header (e.g. לבלילה:, למלית:, לציפוי, לעיטור, לבלילת העוגה, לקישוט העוגה, להגשה) and add "::header" plus that section's ingredients. If you see "לבלילה:" you must also find and output "למלית:" (or whatever comes after) with its ingredients.
- Explicit rule: When the source text contains multiple sections (e.g. "לבלילה:" and "למלית:", or "לבלילת העוגה:" and "לקישוט העוגה:"), your ingredients array MUST include a group and ingredients for EACH section (e.g. "::לבלילה" and "::למלית"). One section alone is wrong.
- Extract ALL instructions as separate steps in order.
- prepTime and cookTime should be numbers in minutes only (no units).
- CRITICAL: Keep the ENTIRE recipe in its original language. Do not translate ANY part - not the name, not the ingredients, not the instructions, and not the group names.
- IMPORTANT: ONLY extract the actual recipe content. Completely IGNORE any of these: advertisements, recommendations, "you might also like", related articles, comments, social media links, navigation, author bio, newsletter signup, or any other non-recipe content.
- If you cannot find a recipe in the text, return: {"error": "No recipe found"}`;

  const parseResponse = (raw) => {
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned);
  };

  const model = "gpt-4o";
  let result = await callOpenAI({
    model,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: buildUserMessage(false) },
    ],
    temperature: 0,
    max_tokens: 3000,
  });

  let data;
  try {
    data = parseResponse(result);
  } catch {
    return { error: result };
  }

  const ingCount = Array.isArray(data.ingredients) ? data.ingredients.length : 0;
  const shouldRetry =
    hasMultipleSectionMarkers &&
    ingCount <= 5 &&
    !data.error;

  if (shouldRetry) {
    try {
      const retryResult = await callOpenAI({
        model,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: buildUserMessage(true) },
        ],
        temperature: 0,
        max_tokens: 3000,
      });
      const retryData = parseResponse(retryResult);
      const retryIngCount = Array.isArray(retryData.ingredients)
        ? retryData.ingredients.length
        : 0;
      if (!retryData.error && retryIngCount > ingCount) {
        return retryData;
      }
    } catch (_) {
      /* retry failed or invalid JSON – use first result */
    }
  }

  return data;
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
  "ingredients": ["::group name", "ingredient 1 with quantity", "ingredient 2", "::another group", "ingredient 3"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "15" or "",
  "cookTime": "30" or "",
  "servings": "4" or "",
  "difficulty": "Easy" or "Medium" or "Hard" or "VeryEasy" or "",
  "category": "category name or empty string"
}
- Extract ALL ingredients with their exact quantities as separate array items.
- IMPORTANT: Always write quantities as digits, not words. For example: "3 ביצים" instead of "שלוש ביצים", "2 cups flour" instead of "two cups flour". Always put the number BEFORE the ingredient.
- ONLY use "::" group prefixes for SPECIFIC named sub-sections like "::לבלילה", "::למלית", "::לציפוי", "::לעיטור", "::לקישוט", "::לבצק", "::למילוי", "::For the dough", "::For the filling". Do NOT create groups for generic words like "מרכיבים" (ingredients) or "הוראות" (instructions) - these are NOT groups.
- CRITICAL for Hebrew: If the user said "לבלילה", "למלית", "לציפוי", "לעיטור", "לקישוט" or similar before a set of ingredients, you MUST output a "::group name" line and then the ingredients for that group. For example: if they said "לבלילה מרכיב 2 ביצים למלית מרכיב 500 גרם גבינה", output ["::לבלילה", "2 ביצים", "::למלית", "500 גרם גבינה"]. Never merge multiple sections into one.
- Extract ALL instructions as separate steps in order.
- prepTime and cookTime should be numbers in minutes only (no units).
- CRITICAL: Keep the ENTIRE recipe in its original language. Do not translate ANY part - not the name, not the ingredients, not the instructions, and not the group names.
- If difficulty is mentioned, map it to: VeryEasy, Easy, Medium, or Hard.
- Even if difficulty is NOT explicitly mentioned, try to estimate it from the recipe complexity.${categoriesHint}
- If you cannot find a recipe in the text, return: {"error": "No recipe found"}`,
      },
      {
        role: "user",
        content: `Parse this spoken recipe. If the text has sections like לבלילה, למלית, לציפוי, לקישוט – output each as a "::section name" group with its ingredients.\n\n${text}`,
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
  "calories",
  "protein",
  "fat",
  "carbs",
  "sugars",
  "fiber",
  "sodium",
  "calcium",
  "iron",
  "cholesterol",
  "saturatedFat",
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
  const ingredientArray = (Array.isArray(ingredients)
    ? ingredients
    : ingredients
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
  ).filter((s) => !s.startsWith("::"));
  const numServings = parseInt(servings, 10) || 1;

  const cacheKey = `${ingredientArray.join("|")}|${numServings}`;
  if (nutritionCache.has(cacheKey)) {
    return nutritionCache.get(cacheKey);
  }

  try {
    const results = await Promise.all(
      ingredientArray.map((ing) => lookupSingleIngredient(ing)),
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
    const msg = err.message || "";
    const isQuota =
      msg.includes("quota") ||
      msg.includes("insufficient") ||
      msg.includes("billing") ||
      msg.includes("rate limit") ||
      msg.includes("429") ||
      msg.includes("402");
    return {
      error: isQuota ? "QUOTA_EXCEEDED" : msg,
    };
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
    content: `You are a helpful voice cooking assistant for "${recipeName}" (${servings} servings).
Currently on ${tabLabel} tab. ${activeTab === "ingredients" ? `Ingredient ${currentStep + 1}/${ingredients.length}: "${currentItemText}"` : `Step ${currentStep + 1}/${instructions.length}: "${currentItemText}"`}
Timer: ${isTimerRunning ? "running" : "off"}

INGREDIENTS:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join("\n")}

INSTRUCTIONS:
${instructions.map((inst, i) => `${i + 1}. ${inst}`).join("\n")}

You MUST respond with valid JSON: {"text": "your answer", "action": null}
Possible actions: {"type":"next"}, {"type":"prev"}, {"type":"goto","step":N}, {"type":"timer","minutes":N}, {"type":"stop_timer"}, {"type":"switch_tab","tab":"ingredients"}, {"type":"switch_tab","tab":"instructions"}, {"type":"play_music"}, {"type":"pause_music"}, {"type":"toggle_music"}, {"type":"volume_up"}, {"type":"volume_down"}

RULES:
- Always respond in ${langName}, 1-2 sentences max (read aloud).
- Write numbers as Hebrew words: "מאתיים" not "200", "שתי כפות" not "2 כפות".
- When user asks about an ingredient (e.g. "כמה סוכר", "כמה תפוחים"), find ALL matching ingredients and quote their EXACT quantities.
- When reading or describing an instruction step, ALWAYS mention the specific ingredient quantities needed for that step.
- "סיימתי שלב" / "סיימתי" / "finished" / "done" → advance to next step with action {"type":"next"} and read the next step with its ingredient quantities.
- "תגיד לי" / "מה השלב" / "tell me" → read the current step content with ingredient quantities.
- "מה הבא" / "השלב הבא" / "next" / "הבא" → read next step with action {"type":"next"}.
- Do NOT switch tabs automatically. Only use switch_tab action if user explicitly says "תעבור למרכיבים" or "תעבור להוראות". Answer ingredient questions without switching tabs.
- "תפעיל מוסיקה" / "play music" / "שים רדיו" → play music with action {"type":"play_music"}.
- "עצור מוסיקה" / "stop music" / "הפסק מוסיקה" → pause music with action {"type":"pause_music"}.
- "הגבר" / "תגביר" / "louder" / "volume up" → raise volume with action {"type":"volume_up"}.
- "הנמך" / "תנמיך" / "quieter" / "volume down" → lower volume with action {"type":"volume_down"}.
- ALWAYS try to answer. Never say you don't understand unless truly unrelated to cooking.

EXAMPLES:
"כמה סוכר?" → {"text": "יש מאתיים גרם סוכר ושתי כפות סוכר חום", "action": null}
"כמה תפוחים?" → {"text": "צריך ארבעה תפוחים", "action": null}
"סיימתי שלב" → {"text": "מעולה! השלב הבא הוא להוסיף מאתיים גרם סוכר ושלוש ביצים לקערה ולערבב", "action": {"type": "next"}}
"תגיד לי" → {"text": "בשלב הזה מוסיפים מאתיים גרם סוכר לקערה ומערבבים", "action": null}
"מה השלב הבא?" → {"text": "בשלב הבא מוסיפים שלוש ביצים ומערבבים", "action": {"type": "next"}}
"תפעיל טיימר ל-10 דקות" → {"text": "מפעיל טיימר לעשר דקות", "action": {"type": "timer", "minutes": 10}}`,
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
    // Try to extract "text" value from malformed JSON
    const textMatch = result.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    let action = null;
    // Try to extract action from malformed JSON
    const actionMatch = result.match(/"action"\s*:\s*(\{[^}]+\})/);
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
      } catch {
        /* ignore */
      }
    }
    if (textMatch && textMatch[1].length > 2) {
      return { text: textMatch[1], action };
    }
    // If no valid text found, return a generic response instead of gibberish
    return { text: "לא הצלחתי להבין, אנא נסה שוב", action: null };
  }
};

export const sendChatMessage = async (
  messages,
  recipeContext = null,
  language = "he",
  options = {},
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

  return callOpenAI(
    {
      model: "gpt-4o-mini",
      messages: [systemMessage, ...recentMessages],
      temperature: 0.7,
      max_tokens: 500,
    },
    options,
  );
};
