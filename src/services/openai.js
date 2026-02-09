const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = "https://api.openai.com/v1/chat/completions";

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

  const currentItemText = instructions[currentStep] || "";

  const systemMessage = {
    role: "system",
    content: `You are a voice cooking assistant helping a user cook "${recipeName}" (${servings} servings).

Current instruction step: ${currentStep + 1} of ${instructions.length}
Current instruction: "${currentItemText}"
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
- You MUST respond with valid JSON in this exact format:
{"text": "your spoken response here", "action": null}

Possible actions:
- {"type": "next"} - go to next step
- {"type": "prev"} - go to previous step  
- {"type": "goto", "step": 3} - go to specific step (1-indexed)
- {"type": "timer", "minutes": 5} - start a cooking timer for X minutes
- {"type": "stop_timer"} - stop the currently running timer
- null - no navigation action

Examples:
User: "מה השלב הבא?" → {"text": "השלב הבא הוא להוסיף 2 ביצים ו-100 גרם סוכר לתערובת", "action": {"type": "next"}}
User: "כמה מלח צריך?" → {"text": "צריך כפית מלח", "action": null}
User: "מה צריך לשלב הזה?" → {"text": "לשלב הזה צריך 200 גרם קמח, 2 ביצים וחצי כוס חלב", "action": null}
User: "תחזור שלב" → {"text": "חוזרים לשלב הקודם", "action": {"type": "prev"}}
User: "תלך לשלב 3" → {"text": "עוברים לשלב 3", "action": {"type": "goto", "step": 3}}
User: "שלב 5" → {"text": "עוברים לשלב 5", "action": {"type": "goto", "step": 5}}
User: "תקפוץ לשלב 2" → {"text": "קופצים לשלב 2", "action": {"type": "goto", "step": 2}}
User: "תפעיל טיימר ל-10 דקות" → {"text": "מפעיל טיימר ל-10 דקות", "action": {"type": "timer", "minutes": 10}}
User: "תכוון טיימר לחצי שעה" → {"text": "מפעיל טיימר ל-30 דקות", "action": {"type": "timer", "minutes": 30}}
User: "תעצור את הטיימר" → {"text": "עוצר את הטיימר", "action": {"type": "stop_timer"}}`,
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
