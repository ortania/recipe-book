const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = "https://api.openai.com/v1/chat/completions";
const TTS_API_URL = "https://api.openai.com/v1/audio/speech";

export const speakWithOpenAI = async (text, voice = "nova") => {
  if (!OPENAI_API_KEY || !text) return null;
  const response = await fetch(TTS_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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

const callOpenAI = async (requestBody) => {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.",
    );
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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
User: "מה השלב הבא?" → {"text": "השלב הבא הוא להוסיף 2 ביצים ו-100 גרם סוכר לתערובת", "action": {"type": "next"}}
User: "כמה מלח צריך?" → {"text": "צריך כפית מלח", "action": null}
User: "מה צריך לשלב הזה?" → {"text": "לשלב הזה צריך 200 גרם קמח, 2 ביצים וחצי כוס חלב", "action": null}
User: "תחזור שלב" → {"text": "חוזרים לשלב הקודם", "action": {"type": "prev"}}
User: "תלך לשלב 3" → {"text": "עוברים לשלב 3", "action": {"type": "goto", "step": 3}}
User: "שלב 5" → {"text": "עוברים לשלב 5", "action": {"type": "goto", "step": 5}}
User: "תעבור למרכיבים" → {"text": "עוברים למרכיבים", "action": {"type": "switch_tab", "tab": "ingredients"}}
User: "תעבור להוראות" → {"text": "עוברים להוראות", "action": {"type": "switch_tab", "tab": "instructions"}}
User: "תקפוץ לשלב 2" → {"text": "קופצים לשלב 2", "action": {"type": "goto", "step": 2}}
User: "תפעיל טיימר ל-10 דקות" → {"text": "מפעיל טיימר ל-10 דקות", "action": {"type": "timer", "minutes": 10}}
User: "תכוון טיימר לחצי שעה" → {"text": "מפעיל טיימר ל-30 דקות", "action": {"type": "timer", "minutes": 30}}
User: "תעצור את הטיימר" → {"text": "עוצר את הטיימר", "action": {"type": "stop_timer"}}
User: "תעבור למרכיבים" → {"text": "עוברים למרכיבים", "action": {"type": "switch_tab", "tab": "ingredients"}}
User: "תעבור להוראות" → {"text": "עוברים להוראות הכנה", "action": {"type": "switch_tab", "tab": "instructions"}}
User: "תתחיל לבשל" → {"text": "עוברים להוראות הכנה", "action": {"type": "switch_tab", "tab": "instructions"}}`,
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
    return JSON.parse(cleaned);
  } catch {
    return { text: result, action: null };
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
