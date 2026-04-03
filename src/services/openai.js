import { auth } from "../firebase/config";

const CLOUD_CHAT_URL =
  "https://us-central1-recipe-book-82d57.cloudfunctions.net/openaiChat";
const CLOUD_TTS_URL =
  "https://us-central1-recipe-book-82d57.cloudfunctions.net/openaiTts";
const CLOUD_OCR_URL =
  "https://us-central1-recipe-book-82d57.cloudfunctions.net/ocrImage";
const CLOUD_RECIPE_IMAGE_URL =
  "https://us-central1-recipe-book-82d57.cloudfunctions.net/openaiRecipeImage";

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

const nutritionCache = new Map();
const NUTRITION_CACHE_MAX = 50;

export const clearNutritionCache = () => {
  nutritionCache.clear();
};

export const speakWithOpenAI = async (text, voice = "nova") => {
  if (!text) return null;
  const response = await fetch(CLOUD_TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
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

/**
 * Calls Cloud Function that runs DALL·E; returns a data URL suitable for uploadRecipeImage.
 * @param {{ recipeName: string, ingredients?: string[] }} params
 */
export async function generateRecipeImageDataUrl({
  recipeName,
  ingredients = [],
}) {
  const response = await fetch(CLOUD_RECIPE_IMAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify({ recipeName, ingredients }),
  });

  if (!response.ok) {
    let msg = `Image generation failed (${response.status})`;
    try {
      const err = await response.json();
      msg = err.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = await response.json();
  const { mimeType, imageBase64 } = data;
  if (!imageBase64) {
    throw new Error("No image data");
  }
  return `data:${mimeType || "image/png"};base64,${imageBase64}`;
}

export const callOpenAI = async (requestBody, options = {}) => {
  const { signal } = options;
  const response = await fetch(CLOUD_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
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
  return callOpenAI(
    {
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
    },
    options,
  );
};

export const extractRecipeFromImage = async (base64Images, language = "he") => {
  const images = Array.isArray(base64Images) ? base64Images : [base64Images];

  // Always use GPT-4o direct image extraction.
  // GPT-4o vision handles both printed and handwritten text reliably,
  // whereas Google Cloud Vision OCR fails on handwriting.
  return extractRecipeDirectFromImage(images);
};

const IMAGE_RECIPE_SYSTEM_PROMPT = `You are a recipe extraction expert specialized in reading handwritten and printed recipes in any language, especially Hebrew.

CRITICAL: The image may contain HANDWRITTEN text. You MUST read it carefully, even if messy or hard to read. Do your best to decipher every word. Handwritten Hebrew recipes are common — look for ingredient lists (often marked with *, -, or •) and instructions (often marked with <, >, numbers, or written as steps).

Return valid JSON in this exact format:
{
  "name": "recipe name",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "15",
  "cookTime": "30",
  "servings": "4",
  "notes": ""
}

ABSOLUTE RULE — NO HALLUCINATION:
- Extract ONLY text that is ACTUALLY VISIBLE and WRITTEN in the image.
- NEVER invent, generate, complete, or add ANY content from your own knowledge.
- If the instructions in the image are brief or incomplete, return them exactly as written — do NOT expand, elaborate, or add steps.
- If only a few words of instructions are readable, return only those few words. An empty instructions array is better than invented steps.
- If you are unsure about a word, write your best guess but NEVER make up entire sentences.

Rules:
- Read ALL text in the image thoroughly. Spend extra effort on handwritten text.
- If the recipe is partially readable, extract whatever you CAN read. Do NOT return an error just because some words are unclear.
- ingredients: include only items that appear to be ingredients. One item per array element.
- Always write quantities as digits, not words. For example: "3 ביצים" not "שלוש ביצים". Put the number BEFORE the ingredient.
- ONLY use "::" group prefixes for clearly labeled sub-sections (e.g. "::לבלילה", "::למלית"). Do NOT create groups for generic labels like "מרכיבים".
- instructions: include ONLY steps that are ACTUALLY WRITTEN in the image. One step per array element. If instructions are hard to read, include only what you can decipher.
- prepTime: return "" if not explicitly written in the image.
- cookTime: return "" if not explicitly written in the image.
- servings: return "" if not explicitly written in the image.
- notes: include oven temperature or tips ONLY if written in the image. Return "" if none visible.
- Keep the entire recipe in its original language. Do NOT translate.
- ONLY return {"error": "No recipe found"} if the image clearly contains NO recipe at all (e.g. a photo of a landscape).`;

const OCR_STRUCTURE_SYSTEM_PROMPT = `You are a recipe formatter. You receive raw text extracted by an OCR scanner from a recipe image.
Your job is to structure it into JSON. Use ONLY the text provided — do NOT add, infer, or complete anything from your own knowledge.

Return valid JSON in this exact format:
{
  "name": "recipe name",
  "ingredients": ["::group name", "ingredient 1 with quantity", "ingredient 2", "::another group", "ingredient 3"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "15",
  "cookTime": "30",
  "servings": "4",
  "notes": ""
}

Rules:
- ingredients: include only items listed in the ingredients section of the text. One item per array element.
- ONLY use "::" group prefixes for clearly labeled sub-sections (e.g. "::לבלילה", "::למלית"). Do NOT create groups for generic labels like "מרכיבים".
- instructions: include only steps listed in the instructions section. One step per array element.
- prepTime: preparation/hands-on time in minutes. Return "" if not in the text.
- cookTime: cooking, baking, or oven time in minutes. This includes any time labeled as אפייה, בישול, זמן תנור, זמן אפייה, baking time, cooking time, oven time. For ranges like "45-55 דקות", return the higher value (e.g. "55"). Return "" if not in the text.
- servings: return "" if not in the text.
- notes: include any extra info like oven temperature (e.g. "170-175 מעלות"), cooling instructions, or tips found in the text. Return "" if none.
- Keep the entire recipe in its original language. Do NOT translate.
- If no recipe is found, return: {"error": "No recipe found"}`;

function parseRecipeJSON(raw) {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}

async function extractRecipeWithVision(images) {
  const imageContent = images.map((img) => ({
    type: "image_url",
    image_url: { url: img, detail: "high" },
  }));

  try {
    console.log("[ImageImport] Sending", images.length, "image(s) to GPT-4o vision");
    const result = await callOpenAI({
      model: "gpt-4o",
      messages: [
        { role: "system", content: IMAGE_RECIPE_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "This image contains a recipe (possibly handwritten in Hebrew). Read all the text carefully and extract the recipe into JSON. If it's handwritten, do your best to read every word." },
            ...imageContent,
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });
    console.log("[ImageImport] Vision response:", result?.substring(0, 200));
    return parseRecipeJSON(result);
  } catch (e) {
    console.error("[ImageImport] Vision extraction failed:", e.message);
    return { error: "Failed to parse recipe from image" };
  }
}

async function extractRecipeDirectFromImage(images) {
  let rawText = "";

  // Pass 1: Try Google Cloud Vision OCR
  try {
    const ocrResponse = await fetch(CLOUD_OCR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({ images }),
    });

    if (ocrResponse.ok) {
      const data = await ocrResponse.json();
      rawText = data.text || "";
    }
  } catch (e) {
    console.warn("[ImageImport] OCR failed:", e.message);
  }

  console.log("[ImageImport] OCR text length:", rawText?.trim().length || 0);

  // If OCR returned very little text (e.g. handwriting), go straight to vision
  if (!rawText?.trim() || rawText.trim().length < 30) {
    console.log("[ImageImport] OCR insufficient, using GPT-4o vision");
    return extractRecipeWithVision(images);
  }

  // Pass 2: GPT structures the raw OCR text
  try {
    const result = await callOpenAI({
      model: "gpt-4o",
      messages: [
        { role: "system", content: OCR_STRUCTURE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Structure this recipe text into JSON:\n\n${rawText}`,
        },
      ],
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const parsed = parseRecipeJSON(result);

    // If OCR text produced garbage that GPT couldn't structure, try vision
    if (parsed.error) {
      console.log("[ImageImport] OCR structuring failed, trying vision fallback");
      return extractRecipeWithVision(images);
    }

    // Sanity check: if OCR produced very few ingredients, vision might do better
    if ((!parsed.ingredients || parsed.ingredients.length < 2) &&
        (!parsed.instructions || parsed.instructions.length < 1)) {
      console.log("[ImageImport] OCR result too sparse, trying vision fallback");
      return extractRecipeWithVision(images);
    }

    return parsed;
  } catch {
    console.log("[ImageImport] OCR structuring threw, trying vision fallback");
    return extractRecipeWithVision(images);
  }
}

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
    /לבלילה|לבלילת|למלית|מלית|לקישוט|לציפוי|לעיטור|להגשה|למילוי|לבצק/.test(
      truncated,
    );

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
  "servings": "4" or "",
  "notes": ""
}
- Extract ALL ingredients with their exact quantities as separate array items. Do NOT skip any ingredient. Scan the ENTIRE text from start to end.
- Always write quantities as digits, not words. For example: "3 ביצים" not "שלוש ביצים", "2 cups" not "two cups". Always put the number BEFORE the ingredient.
- ONLY use "::" group prefixes for SPECIFIC named sub-sections like "::לבלילה", "::למלית", "::לבצק", "::למילוי", "::לציפוי", "::לעיטור", "::להגשה", "::לקישוט", "::For the dough", "::For the filling". Do NOT create groups for generic words like "מרכיבים" (ingredients) or "הוראות" (instructions) - these are NOT groups. If there are no specific named sub-sections, just list all ingredients without any group headers.
- CRITICAL - Multiple Hebrew sections: The page often has headers like "לבלילה:" (for batter), "למלית:" (for filling), "לציפוי", "לעיטור" (decoration), "לבלילת העוגה:", "לקישוט העוגה:", "להגשה", etc. You MUST output ingredients for EVERY such section. Never output only the first section and stop. Always scan the full text for every section header (e.g. לבלילה:, למלית:, לציפוי, לעיטור, לבלילת העוגה, לקישוט העוגה, להגשה) and add "::header" plus that section's ingredients. If you see "לבלילה:" you must also find and output "למלית:" (or whatever comes after) with its ingredients.
- Explicit rule: When the source text contains multiple sections (e.g. "לבלילה:" and "למלית:", or "לבלילת העוגה:" and "לקישוט העוגה:"), your ingredients array MUST include a group and ingredients for EACH section (e.g. "::לבלילה" and "::למלית"). One section alone is wrong.
- Extract ALL instructions as separate steps in order.
- CRITICAL: ONLY extract instructions that are ACTUALLY WRITTEN in the source text. NEVER invent, generate, or add instructions that do not appear in the original text. If there are no instructions in the text, return an empty array for "instructions".
- prepTime: preparation/hands-on time in minutes only (no units). Return "" if not found.
- cookTime: cooking, baking, or oven time in minutes only (no units). This includes any time labeled as אפייה, בישול, זמן תנור, זמן אפייה, baking time, cooking time, oven time. For ranges like "45-55 דקות", return the higher value (e.g. "55"). Return "" if not found.
- CRITICAL: Keep the ENTIRE recipe in its original language. Do not translate ANY part - not the name, not the ingredients, not the instructions, and not the group names.
- notes: extract any tips, notes, serving suggestions, substitutions, or extra info found in sections labeled "טיפים", "הערות", "טיפים ותחליפים", "tips", "notes", or similar. Also include oven temperature details or cooling instructions if mentioned outside the main steps. Combine all tips into a single string separated by newlines. Return "" if none found.
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

  const ingCount = Array.isArray(data.ingredients)
    ? data.ingredients.length
    : 0;
  const shouldRetry = hasMultipleSectionMarkers && ingCount <= 5 && !data.error;

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
  "category": "category name or empty string",
  "notes": ""
}
- Extract ALL ingredients with their exact quantities as separate array items.
- IMPORTANT: Always write quantities as digits, not words. For example: "3 ביצים" instead of "שלוש ביצים", "2 cups flour" instead of "two cups flour". Always put the number BEFORE the ingredient.
- ONLY use "::" group prefixes for SPECIFIC named sub-sections like "::לבלילה", "::למלית", "::לציפוי", "::לעיטור", "::לקישוט", "::לבצק", "::למילוי", "::For the dough", "::For the filling". Do NOT create groups for generic words like "מרכיבים" (ingredients) or "הוראות" (instructions) - these are NOT groups.
- CRITICAL for Hebrew: If the user said "לבלילה", "למלית", "לציפוי", "לעיטור", "לקישוט" or similar before a set of ingredients, you MUST output a "::group name" line and then the ingredients for that group. For example: if they said "לבלילה מרכיב 2 ביצים למלית מרכיב 500 גרם גבינה", output ["::לבלילה", "2 ביצים", "::למלית", "500 גרם גבינה"]. Never merge multiple sections into one.
- Extract ALL instructions as separate steps in order.
- CRITICAL: ONLY extract instructions that the user ACTUALLY SAID or WROTE. NEVER invent, generate, or add instructions that do not appear in the original text. If the user did not mention any instructions, return an empty array for "instructions".
- prepTime: preparation/hands-on time in minutes only (no units). Return "" if not found.
- cookTime: cooking, baking, or oven time in minutes only (no units). This includes any time labeled as אפייה, בישול, זמן תנור, זמן אפייה, baking time, cooking time, oven time. For ranges like "45-55 דקות", return the higher value (e.g. "55"). Return "" if not found.
- CRITICAL: Keep the ENTIRE recipe in its original language. Do not translate ANY part - not the name, not the ingredients, not the instructions, and not the group names.
- notes: if the user mentioned any tips, notes, serving suggestions, or substitutions (e.g. "טיפ", "הערה", "אפשר גם"), include them here. Return "" if none.
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

const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || "";
const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

const USDA_NUTRIENT_MAP = {
  1008: "calories",
  1003: "protein",
  1004: "fat",
  1005: "carbs",
  2000: "sugars",
  1079: "fiber",
  1093: "sodium",
  1087: "calcium",
  1089: "iron",
  1253: "cholesterol",
  1258: "saturatedFat",
};

const parseIngredientWithGPT = async (ingredient) => {
  const result = await callOpenAI({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You translate food ingredients to English and estimate their total weight in grams.
Return ONLY a JSON object, no markdown:
{"english":"<USDA search term in English>","grams":<total weight in grams as number>}

Rules:
- "english" should be a simple USDA-friendly food name (e.g. "carrot raw", "egg whole raw", "all purpose flour", "chicken breast raw").
- Do NOT include quantities in "english", only the food name.
- "grams" is the TOTAL weight of the ingredient as stated.
- When size is not specified, assume MEDIUM size.
- When a weight has a range, use the MIDPOINT.
- Common weights: 1 medium egg = 50g, 1 medium carrot = 61g, 1 medium onion = 110g, 1 medium potato = 150g, 1 cup flour = 125g, 1 cup sugar = 200g, 1 cup milk = 244g, 1 tablespoon oil = 14g, 1 tablespoon butter = 14g.
- For "כוס" (cup), "כף" (tablespoon), "כפית" (teaspoon) use standard metric conversions.`,
      },
      { role: "user", content: ingredient },
    ],
    temperature: 0,
    seed: 42,
    max_tokens: 100,
  });

  let cleaned = result
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) cleaned = objMatch[0];
  return JSON.parse(cleaned);
};

const searchUSDA = async (englishFoodName) => {
  const nutrientIds = Object.keys(USDA_NUTRIENT_MAP).join(",");
  const url = `${USDA_API_BASE}/foods/search?query=${encodeURIComponent(englishFoodName)}&dataType=SR%20Legacy,Foundation&pageSize=3&nutrients=${nutrientIds}&api_key=${USDA_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`USDA API error: ${response.status}`);
  const data = await response.json();
  if (!data.foods || data.foods.length === 0) return null;

  const food = data.foods[0];
  const per100g = {};
  for (const nutrient of food.foodNutrients || []) {
    const fieldName = USDA_NUTRIENT_MAP[nutrient.nutrientId];
    if (fieldName) {
      per100g[fieldName] = nutrient.value || 0;
    }
  }
  return per100g;
};

const lookupWithGPTFallback = async (ingredient) => {
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
- When size is not specified, ALWAYS assume MEDIUM size.
- When a weight or nutritional value has a known range, use the MIDPOINT.
- Use USDA values. All numbers are integers. Unknown fields = 0.`,
      },
      { role: "user", content: ingredient },
    ],
    temperature: 0,
    seed: 42,
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

const lookupSingleIngredient = async (ingredient) => {
  if (USDA_API_KEY) {
    try {
      const parsed = await parseIngredientWithGPT(ingredient);
      if (parsed.english && parsed.grams > 0) {
        const usdaPer100g = await searchUSDA(parsed.english);
        if (usdaPer100g) {
          const factor = parsed.grams / 100;
          const result = {};
          for (const f of NUTRITION_FIELDS) {
            result[f] = Math.round((usdaPer100g[f] || 0) * factor);
          }
          return result;
        }
      }
    } catch (err) {
      console.warn("USDA lookup failed, falling back to GPT:", err);
    }
  }
  return lookupWithGPTFallback(ingredient);
};

export const calculateNutrition = async (ingredients, servings) => {
  const ingredientArray = (
    Array.isArray(ingredients)
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

  const nextStepIdx = currentStep + 1;
  const prevStepIdx = currentStep - 1;
  const nextStepText = instructions[nextStepIdx] || null;
  const prevStepText = instructions[prevStepIdx] || null;

  const tabLabel = activeTab === "ingredients" ? "Ingredients" : "Instructions";

  const systemMessage = {
    role: "system",
    content: `You are a voice cooking assistant inside a recipe app. You respond in ${langName}.

Current recipe: "${recipeName}" (${servings} servings).
Current step: ${currentStep + 1} of ${instructions.length}.

Ingredients:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join("\n")}

Instructions:
${instructions.map((inst, i) => `${i + 1}. ${inst}`).join("\n")}

The user speaks to you via voice (Hebrew). You must classify their intent and respond.

Respond ONLY in JSON:
{
  "action": "next_step | previous_step | goto_step | repeat_step | answer_question",
  "step_number": number or null,
  "message": "short spoken response in ${langName}"
}

NOTE: Timer, radio, and volume commands are handled separately. You will NOT receive them. Focus only on step navigation and answering questions.

Intent classification:
- "שלב הבא", "המשך", "תתקדם", "סיימתי", "קדימה", "מה השלב הבא" → next_step
- "שלב קודם", "תחזור", "אחורה", "מה השלב הקודם" → previous_step
- "שלב 3", "מה השלב הראשון", "תחזור לשלב 2", "תתקדם לשלב 5" → goto_step (set step_number: ראשון=1, שני=2, שלישי=3, רביעי=4, חמישי=5)
- "מה עושים עכשיו", "תקריא שוב", "חזור על השלב" → repeat_step
- "כמה ביצים", "איזה מרכיבים", "כמה סוכר", "מה כמות..." → answer_question (look up in the ingredients list and answer with exact quantity)

Rules:
1. Keep message very short (1-2 sentences in ${langName}).
2. For ingredient questions: find the ingredient in the list above and state the exact quantity. Never say "search the list" — YOU search it and answer directly!
3. If the user mentions a step number with context of steps (שלב + number, or "הראשון/השני/השלישי") → goto_step.
4. A bare number alone (like "2" or "שתיים") is NOT a step command — respond with answer_question asking what they mean.
5. If you don't understand the request, use answer_question with a helpful message. Never default to goto_step.
6. Never invent information not in the recipe.
7. Numbers in message should be written as words ("שלוש" not "3").`,
  };

  const result = await callOpenAI({
    model: "gpt-4o-mini",
    messages: [systemMessage, { role: "user", content: userText }],
    temperature: 0.1,
    max_tokens: 200,
  });

  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    const actionMap = {
      next_step: { type: "next" },
      previous_step: { type: "prev" },
      goto_step: { type: "goto", step: parsed.step_number },
      repeat_step: { type: "read_step" },
      answer_question: null,
      none: null,
    };

    return {
      text: parsed.message || "לא הצלחתי להבין",
      action: actionMap[parsed.action] ?? null,
    };
  } catch {
    const msgMatch = result.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (msgMatch && msgMatch[1].length > 2) {
      return { text: msgMatch[1], action: null };
    }
    return { text: "לא הצלחתי להבין, אנא נסי שוב", action: null };
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

  if (!recipeContext) {
    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    if (lastUserMsg) {
      const { detectIntent, getIntentPromptHint } = await import("../utils/chatIntents");
      const intent = detectIntent(lastUserMsg.content);
      const hint = getIntentPromptHint(intent);
      if (hint) systemMessage.content += `\n\n${hint}`;
    }
  }

  const recentMessages = messages
    .slice(-5)
    .map(({ image, intent, ...msg }) => msg);

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
