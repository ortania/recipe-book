import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import {
  sendChatMessage,
  analyzeImageForNutrition,
  calculateNutrition,
} from "../../services/openai";
import { normalizeImageDataUrl } from "../../firebase/imageService";
import { useLanguage, useRecipeBook } from "../../context";
import { Greeting } from "../greeting";
import { ChatHelpButton } from "../controls/chat-help-button";
import { ChatInput } from "../controls/chat-input";
import classes from "./chat-window.module.css";

import { ChatWindowContext } from "./ChatWindowContext";
import ChatWindowMessages from "./ChatWindowMessages";

const IDEA_CHIPS = ["ideaChip1", "ideaChip2", "ideaChip3", "ideaChip4", "ideaChip5", "ideaChip6"];

function ChatWindow({
  recipeContext: externalRecipeContext = null,
  showImageButton = false,
  recipe = null,
  servings = null,
  onUpdateRecipe = null,
  messages: externalMessages,
  onMessagesChange,
  appliedFields: externalAppliedFields,
  onAppliedFieldsChange,
  showGreeting,
}) {
  const { t, language } = useLanguage();
  const { currentUser } = useRecipeBook();

  const [internalMessages, setInternalMessages] = useState(() => {
    if (externalMessages !== undefined) return [];
    const saved = localStorage.getItem("chatMessages");
    return saved ? JSON.parse(saved) : [];
  });
  const messages = externalMessages !== undefined ? externalMessages : internalMessages;
  const setMessages = onMessagesChange || setInternalMessages;

  const [internalAppliedFields, setInternalAppliedFields] = useState({});
  const appliedFields = externalAppliedFields !== undefined ? externalAppliedFields : internalAppliedFields;
  const setAppliedFields = onAppliedFieldsChange || setInternalAppliedFields;

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [applyingIdx, setApplyingIdx] = useState(null);
  const [customUpdateIdx, setCustomUpdateIdx] = useState(null);
  const [customUpdateText, setCustomUpdateText] = useState("");
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const abortRef = useRef(null);

  const isRecipeMode = !!recipe;

  const handleStop = useCallback(() => { abortRef.current?.abort(); }, []);

  const recipeContext = useMemo(() => {
    if (recipe) {
      return {
        name: recipe.name,
        ingredients: Array.isArray(recipe.ingredients)
          ? recipe.ingredients
          : recipe.ingredients ? recipe.ingredients.split("\n").filter(Boolean) : [],
        instructions: Array.isArray(recipe.instructions)
          ? recipe.instructions
          : recipe.instructions ? recipe.instructions.split("\n").filter(Boolean) : [],
        notes: recipe.notes || "",
        servings,
        cookTime: recipe.cookTime || "",
        nutrition: recipe.nutrition || null,
      };
    }
    return externalRecipeContext;
  }, [recipe, servings, externalRecipeContext]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, customUpdateIdx]);

  useEffect(() => {
    if (externalMessages === undefined) {
      const forStorage = messages.map(({ image, ...rest }) => rest);
      localStorage.setItem("chatMessages", JSON.stringify(forStorage));
    }
  }, [messages, externalMessages]);

  const userInitial = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : "C";

  const clearChat = () => {
    setMessages([]);
    setAppliedFields({});
    setError("");
    setCustomUpdateIdx(null);
    setCustomUpdateText("");
    if (externalMessages === undefined) localStorage.removeItem("chatMessages");
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.jfif$/i.test(file.name)) {
      setError(t("chat", "selectImageFile"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setError(t("chat", "imageTooLarge")); return; }
    const reader = new FileReader();
    reader.onload = () => handleImageAnalysis(normalizeImageDataUrl(reader.result));
    reader.readAsDataURL(file);
  };

  const handleImageAnalysis = async (imageBase64) => {
    setMessages((prev) => [...prev, { role: "user", content: t("chat", "analyzeImageLabel"), image: imageBase64 }]);
    setIsLoading(true);
    setError("");
    abortRef.current = new AbortController();
    try {
      const response = await analyzeImageForNutrition(imageBase64, { signal: abortRef.current.signal });
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || t("chat", "analyzeImageError"));
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text) => {
    if (isLoading || !text.trim()) return;
    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setError("");
    abortRef.current = new AbortController();
    try {
      const response = await sendChatMessage(updatedMessages, recipeContext, language, { signal: abortRef.current.signal });
      setMessages([...updatedMessages, { role: "assistant", content: response }]);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyUpdate = async (aiResponse, msgIndex, userInstruction) => {
    if (!onUpdateRecipe) return;
    setApplyingIdx(msgIndex);
    setError("");
    try {
      const { callOpenAI } = await import("../../services/openai");

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

      const instruction = userInstruction ? `\n\nUser's specific instruction: ${userInstruction}` : "";
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
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      const changes = {};
      const updatedFieldNames = [];
      const arraysEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

      if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
        changes.ingredients = parsed.ingredients;
        if (!arraysEqual(parsed.ingredients, recipeContext.ingredients))
          updatedFieldNames.push(t("recipeChat", "fieldIngredients"));
      }
      if (parsed.instructions && Array.isArray(parsed.instructions)) {
        changes.instructions = parsed.instructions;
        if (!arraysEqual(parsed.instructions, recipeContext.instructions))
          updatedFieldNames.push(t("recipeChat", "fieldInstructions"));
      }
      if (parsed.cookTime && typeof parsed.cookTime === "string") {
        changes.cookTime = parsed.cookTime;
        updatedFieldNames.push(t("recipeChat", "fieldCookTime"));
      }
      if (parsed.nutrition && typeof parsed.nutrition === "object") {
        changes.nutrition = parsed.nutrition;
        updatedFieldNames.push(t("recipeChat", "fieldNutrition"));
      }

      if (changes.ingredients && !arraysEqual(changes.ingredients, recipeContext.ingredients) && !changes.nutrition) {
        try {
          const nutritionResult = await calculateNutrition(changes.ingredients, recipeContext.servings);
          if (nutritionResult && !nutritionResult.error) {
            changes.nutrition = nutritionResult;
            updatedFieldNames.push(t("recipeChat", "fieldNutrition"));
          }
        } catch (err) {
          console.error("Auto nutrition recalc failed:", err);
        }
      }

      if (Object.keys(changes).length > 0) {
        onUpdateRecipe(changes);
        const fieldsList = updatedFieldNames.length > 0
          ? `${t("recipeChat", "updatedFields")}: ${updatedFieldNames.join(", ")}`
          : t("recipeChat", "updatedFields");
        const ingLabel = t("recipeChat", "fieldIngredients");
        const insLabel = t("recipeChat", "fieldInstructions");
        const ingList = (changes.ingredients || recipeContext.ingredients).map((item) => `• ${item}`).join("\n");
        const insList = (changes.instructions || recipeContext.instructions).map((item, i) => `${i + 1}. ${item}`).join("\n");
        setAppliedFields((prev) => ({ ...prev, [msgIndex]: `${fieldsList}\n\n${ingLabel}:\n${ingList}\n\n${insLabel}:\n${insList}` }));
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

  const handleChipClick = (text) => { if (text) sendMessage(text); };
  const isEmpty = messages.length === 0 && !isRecipeMode;

  const contextValue = {
    messages, isLoading, error, isRecipeMode, isEmpty,
    applyingIdx, customUpdateIdx, setCustomUpdateIdx,
    customUpdateText, setCustomUpdateText,
    appliedFields, userInitial,
    handleApplyUpdate: onUpdateRecipe ? handleApplyUpdate : null,
    handleChipClick,
    messagesEndRef, messagesAreaRef,
    classes, t,
  };

  return (
    <ChatWindowContext.Provider value={contextValue}>
      <div className={`${classes.chatContainer} ${isRecipeMode ? classes.embedded : ""} ${isEmpty ? classes.emptyCenter : ""}`}>
        {!isEmpty && !isRecipeMode && (showGreeting === undefined ? true : showGreeting) && (
          <div className={classes.chatHeader}>
            <div className={classes.greeting}><Greeting /></div>
            {showGreeting === undefined && (
              <ChatHelpButton
                title={t("chat", "helpTitle")}
                items={[
                  t("chat", "helpFeature1"), t("chat", "helpFeature2"),
                  t("chat", "helpFeature3"), t("chat", "helpFeature4"),
                ]}
              />
            )}
          </div>
        )}

        {messages.length > 0 && (
          <div className={classes.chatToolbar}>
            <button className={classes.clearBtn} onClick={clearChat}>
              <Trash2 size={16} /> {t("chat", "clearChat")}
            </button>
          </div>
        )}

        <ChatWindowMessages />

        <div className={isEmpty ? classes.centeredInputWrapper : isRecipeMode ? classes.embeddedInputWrapper : classes.fixedInputWrapper}>
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={(text) => sendMessage(text)}
            placeholder={isRecipeMode ? t("recipeChat", "placeholder") : t("chat", "placeholder")}
            disabled={isLoading}
            isLoading={isLoading}
            onStop={handleStop}
            showImageButton={showImageButton}
            onImageSelect={handleImageFile}
          />
          <p className={classes.aiDisclaimer}>תשובות AI הן להכוונה בלבד ויתכנו טעויות.</p>
        </div>
      </div>
    </ChatWindowContext.Provider>
  );
}

export default ChatWindow;
