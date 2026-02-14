import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../../../services/openai";
import { useLanguage } from "../../../context";
import classes from "./recipe-chat.module.css";

function RecipeChat({
  recipe,
  servings,
  onUpdateRecipe,
  messages: externalMessages,
  onMessagesChange,
  appliedFields: externalAppliedFields,
  onAppliedFieldsChange,
}) {
  const { t, language } = useLanguage();
  const messages = externalMessages || [];
  const setMessages = onMessagesChange || (() => {});
  const appliedFields = externalAppliedFields || {};
  const setAppliedFields = onAppliedFieldsChange || (() => {});
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [applyingIdx, setApplyingIdx] = useState(null);
  const [customUpdateIdx, setCustomUpdateIdx] = useState(null);
  const [customUpdateText, setCustomUpdateText] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, customUpdateIdx]);

  const recipeContext = {
    name: recipe.name,
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : recipe.ingredients
        ? recipe.ingredients.split("\n").filter(Boolean)
        : [],
    instructions: Array.isArray(recipe.instructions)
      ? recipe.instructions
      : recipe.instructions
        ? recipe.instructions.split("\n").filter(Boolean)
        : [],
    notes: recipe.notes || "",
    servings: servings,
    cookTime: recipe.cookTime || "",
    nutrition: recipe.nutrition || null,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const response = await sendChatMessage(
        updatedMessages,
        recipeContext,
        language,
      );
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: response },
      ]);
    } catch (err) {
      setError(err.message || "Failed to get response.");
      console.error("Recipe chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyUpdate = async (aiResponse, msgIndex, userInstruction) => {
    if (!onUpdateRecipe) return;
    setApplyingIdx(msgIndex);
    setError("");
    try {
      const { callOpenAI } = await import("../../../services/openai");

      const systemPrompt = `You are a recipe update assistant. Given the original recipe and an AI suggestion, apply the suggested changes and return the updated recipe.

CRITICAL RULES:
1. ALWAYS return the COMPLETE "ingredients" array — ALL original ingredients with the suggested changes applied. Never omit unchanged ingredients.
2. ALWAYS return the COMPLETE "instructions" array — ALL original steps with the suggested changes applied. Never omit unchanged steps.
3. If cooking time changed, include "cookTime".
4. If nutritional values changed, include "nutrition" with all fields: calories, protein, carbs, fat, fiber, sugar.
5. Keep the original language of the recipe.
6. Return ONLY valid JSON, no extra text.

JSON format:
{
  "ingredients": ["complete ingredient 1", "complete ingredient 2", ...],
  "instructions": ["complete step 1", "complete step 2", ...],
  "cookTime": "time if changed",
  "nutrition": {"calories": "...", "protein": "...", "carbs": "...", "fat": "...", "fiber": "...", "sugar": "..."} 
}

Always include "ingredients" and "instructions" with the FULL lists. Only include "cookTime" and "nutrition" if they changed.`;

      const instruction = userInstruction
        ? `\n\nUser's specific instruction: ${userInstruction}`
        : "";

      const userPrompt = `Original recipe:
Name: ${recipeContext.name}
Ingredients: ${JSON.stringify(recipeContext.ingredients)}
Instructions: ${JSON.stringify(recipeContext.instructions)}
Cook time: ${recipeContext.cookTime || "not specified"}
Nutrition: ${JSON.stringify(recipeContext.nutrition || "not specified")}

AI suggestion to apply:
${aiResponse}${instruction}

Return the COMPLETE updated recipe as JSON. Include ALL ingredients and ALL instructions (not just the changed ones).`;

      const result = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const cleaned = result
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      const changes = {};
      const updatedFieldNames = [];

      const arraysEqual = (a, b) =>
        a.length === b.length && a.every((v, i) => v === b[i]);

      if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
        changes.ingredients = parsed.ingredients;
        if (!arraysEqual(parsed.ingredients, recipeContext.ingredients)) {
          updatedFieldNames.push(t("recipeChat", "fieldIngredients"));
        }
      }
      if (parsed.instructions && Array.isArray(parsed.instructions)) {
        changes.instructions = parsed.instructions;
        if (!arraysEqual(parsed.instructions, recipeContext.instructions)) {
          updatedFieldNames.push(t("recipeChat", "fieldInstructions"));
        }
      }
      if (parsed.cookTime && typeof parsed.cookTime === "string") {
        changes.cookTime = parsed.cookTime;
        updatedFieldNames.push(t("recipeChat", "fieldCookTime"));
      }
      if (parsed.nutrition && typeof parsed.nutrition === "object") {
        changes.nutrition = parsed.nutrition;
        updatedFieldNames.push(t("recipeChat", "fieldNutrition"));
      }

      if (Object.keys(changes).length > 0) {
        onUpdateRecipe(changes);

        const fieldsList =
          updatedFieldNames.length > 0
            ? `${t("recipeChat", "updatedFields")}: ${updatedFieldNames.join(", ")}`
            : t("recipeChat", "updatedFields");

        const ingLabel = t("recipeChat", "fieldIngredients");
        const insLabel = t("recipeChat", "fieldInstructions");
        const ingList = (changes.ingredients || recipeContext.ingredients)
          .map((item) => `• ${item}`)
          .join("\n");
        const insList = (changes.instructions || recipeContext.instructions)
          .map((item, i) => `${i + 1}. ${item}`)
          .join("\n");

        const details = `${fieldsList}\n\n${ingLabel}:\n${ingList}\n\n${insLabel}:\n${insList}\n\n${t("recipeChat", "autoUpdateNote")}`;

        setAppliedFields((prev) => ({
          ...prev,
          [msgIndex]: details,
        }));
        setCustomUpdateIdx(null);
        setCustomUpdateText("");
      }
    } catch (err) {
      console.error("Failed to apply changes:", err);
      setError(t("recipeChat", "updateFailed"));
    } finally {
      setApplyingIdx(null);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setAppliedFields({});
    setError("");
    setCustomUpdateIdx(null);
    setCustomUpdateText("");
  };

  const suggestions = [
    t("recipeChat", "suggestSubstitute"),
    t("recipeChat", "suggestHealthier"),
    t("recipeChat", "suggestDouble"),
  ];

  const handleSuggestion = (text) => {
    setInput(text);
  };

  return (
    <div className={classes.recipeChatContainer}>
      {messages.length === 0 && (
        <div className={classes.emptyState}>
          <span className={classes.emptyIcon}>💬</span>
          <p className={classes.emptyText}>{t("recipeChat", "emptyMessage")}</p>
          <p className={classes.emptyHint}>{t("recipeChat", "updateHint")}</p>
          <div className={classes.suggestions}>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                className={classes.suggestionChip}
                onClick={() => handleSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <>
          <div className={classes.chatToolbar}>
            <button
              className={classes.clearBtn}
              onClick={handleClearChat}
              title={t("recipeChat", "clearChat")}
            >
              {t("recipeChat", "clearChat")}
            </button>
          </div>
          <div className={classes.messagesArea}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${classes.message} ${
                  message.role === "user"
                    ? classes.userMessage
                    : classes.assistantMessage
                }`}
              >
                <div className={classes.bubble}>
                  {message.content}
                  {message.role === "assistant" && onUpdateRecipe && (
                    <div className={classes.applySection}>
                      {appliedFields[index] ? (
                        <div className={classes.updateSummary}>
                          {appliedFields[index]}
                        </div>
                      ) : (
                        <div className={classes.applyActions}>
                          <button
                            className={classes.applyBtn}
                            onClick={() =>
                              handleApplyUpdate(message.content, index)
                            }
                            disabled={applyingIdx !== null}
                          >
                            {applyingIdx === index
                              ? t("recipeChat", "updating")
                              : t("recipeChat", "applyToRecipe")}
                          </button>
                          {customUpdateIdx === index ? (
                            <div className={classes.customUpdateWrap}>
                              <input
                                className={classes.customUpdateInput}
                                value={customUpdateText}
                                onChange={(e) =>
                                  setCustomUpdateText(e.target.value)
                                }
                                placeholder={t(
                                  "recipeChat",
                                  "customUpdatePlaceholder",
                                )}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    customUpdateText.trim()
                                  ) {
                                    handleApplyUpdate(
                                      message.content,
                                      index,
                                      customUpdateText.trim(),
                                    );
                                  }
                                }}
                                disabled={applyingIdx !== null}
                              />
                              <button
                                className={classes.customUpdateBtn}
                                onClick={() =>
                                  handleApplyUpdate(
                                    message.content,
                                    index,
                                    customUpdateText.trim(),
                                  )
                                }
                                disabled={
                                  applyingIdx !== null ||
                                  !customUpdateText.trim()
                                }
                              >
                                {t("recipeChat", "applyCustom")}
                              </button>
                              <button
                                className={classes.customCancelBtn}
                                onClick={() => {
                                  setCustomUpdateIdx(null);
                                  setCustomUpdateText("");
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              className={classes.customChooseBtn}
                              onClick={() => {
                                setCustomUpdateIdx(index);
                                setCustomUpdateText("");
                              }}
                              disabled={applyingIdx !== null}
                            >
                              {t("recipeChat", "customUpdate")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${classes.message} ${classes.assistantMessage}`}>
                <div className={classes.bubble}>
                  <div className={classes.typing}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            {error && <div className={classes.errorMessage}>{error}</div>}
            <div ref={messagesEndRef} />
          </div>
        </>
      )}

      <form className={classes.inputForm} onSubmit={handleSubmit}>
        <div className={classes.inputWrap}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("recipeChat", "placeholder")}
            className={classes.input}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={classes.sendBtn}
            disabled={isLoading || !input.trim()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 2L11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecipeChat;
