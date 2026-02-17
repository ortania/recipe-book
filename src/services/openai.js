import { getOpenAIKey } from "../firebase/apiKeyService";

const API_URL = "https://api.openai.com/v1/chat/completions";
const TTS_API_URL = "https://api.openai.com/v1/audio/speech";

export const speakWithOpenAI = async (text, voice = "nova") => {
  const apiKey = await getOpenAIKey();
  if (!apiKey || !text) return null;
  const response = await fetch(TTS_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
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

export const callOpenAI = async (requestBody) => {
  const apiKey = await getOpenAIKey();
  if (!apiKey) {
    throw new Error(
      "OpenAI API key is not configured. Save it via Settings or add VITE_OPENAI_API_KEY to your .env file.",
    );
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to get response from AI");
  }

  const data = await response.json();
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

export const calculateNutrition = async (ingredients, servings) => {
  const ingredientsList = Array.isArray(ingredients)
    ? ingredients.join("\n")
    : ingredients;
  const servingsText = servings ? `The recipe makes ${servings} servings.` : "";

  console.log("🍎 calculateNutrition - calling OpenAI with", {
    ingredientsCount: Array.isArray(ingredients) ? ingredients.length : "text",
    servings,
  });

  const result = await callOpenAI({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a nutrition expert. Given a list of recipe ingredients, estimate the nutritional values PER SERVING.
${servingsText}
You MUST respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "calories": "250",
  "protein": "10",
  "fat": "8",
  "carbs": "30",
  "sugars": "12",
  "fiber": "3"
}
- All values should be numbers as strings (grams, except calories which is kcal).
- Provide realistic estimates based on common ingredient quantities.
- If you cannot estimate, use empty string "".
- Do NOT include units in the values, just the number.
- Respond with ONLY the JSON object, nothing else.`,
      },
      {
        role: "user",
        content: `Calculate nutrition per serving for this recipe:\n\n${ingredientsList}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 300,
  });

  console.log("🍎 calculateNutrition - raw API result:", result);

  try {
    let cleaned = result
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    // Extract JSON object if surrounded by extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    const parsed = JSON.parse(cleaned);
    console.log("🍎 calculateNutrition - parsed result:", parsed);
    return parsed;
  } catch (parseErr) {
    console.error("🍎 calculateNutrition - JSON parse failed:", parseErr, "raw:", result);
    return { error: result };
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
    // JSON parse failed - extract just the spoken text, strip JSON artifacts
    const textMatch = result.match(/"text"\s*:\s*"([^"]+)"/);
    if (textMatch) {
      return { text: textMatch[1], action: null };
    }
    // Remove any JSON-like artifacts before returning
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

  // Limit to last 5 messages to prevent token limit errors
  // Strip image data from older messages to save tokens
  const recentMessages = messages.slice(-5).map(({ image, ...msg }) => msg);

  return callOpenAI({
    model: "gpt-4o-mini",
    messages: [systemMessage, ...recentMessages],
    temperature: 0.7,
    max_tokens: 500,
  });
};
