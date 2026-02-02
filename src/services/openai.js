const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = "https://api.openai.com/v1/chat/completions";

export const sendChatMessage = async (messages, recipeContext = null) => {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.",
    );
  }

  const systemMessage = {
    role: "system",
    content: `You are a helpful cooking assistant. You help users with recipe questions, ingredient substitutions, cooking techniques, and adjusting recipe quantities. Always be friendly, concise, and practical in your responses.`,
  };

  // Limit to last 5 messages to prevent token limit errors
  // This keeps the conversation context minimal and well under the 16K token limit
  const recentMessages = messages.slice(-5);

  const requestBody = {
    model: "gpt-3.5-turbo",
    messages: [systemMessage, ...recentMessages],
    temperature: 0.7,
    max_tokens: 500,
  };

  try {
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
      throw new Error(
        error.error?.message || "Failed to get response from ChatGPT",
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
};
