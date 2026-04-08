import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import {
  sendChatMessage,
  analyzeImageForNutrition,
  calculateNutrition,
} from "../../services/openai";
import {
  detectIntent, COMPACT_QUICK_SUGGESTIONS, findRelevantRecipes,
  shouldOfferCreateRecipe, extractRecipeNames, buildRecipeDraftFromChat,
} from "../../utils/chatIntents";
import { normalizeImageDataUrl } from "../../firebase/imageService";
import { useLanguage, useRecipeBook } from "../../context";
import { Greeting } from "../greeting";
import { ChatHelpButton } from "../controls/chat-help-button";
import { ChatInput } from "../controls/chat-input";
import { FEATURES } from "../../config/entitlements";
import useEntitlements from "../../hooks/useEntitlements";
import { UsageIndicator } from "../usage-indicator";
import classes from "./chat-window.module.css";

import { ChatWindowContext } from "./ChatWindowContext";
import ChatWindowMessages from "./ChatWindowMessages";
import { useRecipesView } from "../recipes/RecipesViewContext";

const IDEA_CHIPS = [
  "ideaChip1", "ideaChip2", "ideaChip3", "ideaChip4",
  "ideaChip5", "ideaChip6", "ideaChip7", "ideaChip8",
];

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
  const { currentUser, recipes: allRecipes } = useRecipeBook();
  const navigate = useNavigate();
  const { canUse, incrementUsage } = useEntitlements();

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
  const [showBroadChips, setShowBroadChips] = useState(false);
  const [loadingRecipeName, setLoadingRecipeName] = useState(null);
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

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (messagesAreaRef.current) {
        messagesAreaRef.current.scrollTo({
          top: messagesAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 150);
  }, []);

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
    const photoCheck = canUse(FEATURES.NUTRITION_PHOTO);
    if (!photoCheck.allowed) {
      setError(t("premium", "premiumOnly"));
      return;
    }
    if (!file.type.startsWith("image/") && !/\.jfif$/i.test(file.name)) {
      setError(t("chat", "selectImageFile"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setError(t("chat", "imageTooLarge")); return; }
    const reader = new FileReader();
    reader.onload = () => handleImageAnalysis(normalizeImageDataUrl(reader.result));
    reader.readAsDataURL(file);
  };

  const formatNutritionResult = (result) => {
    if (result.error || !result.nutrition || result.nutrition.error) {
      return t("chat", "analyzeImageError");
    }
    const n = result.nutrition;
    const LABELS = {
      calories: "קלוריות",
      protein: "חלבון",
      fat: "שומן",
      carbs: "פחמימות",
      sugars: "סוכרים",
      fiber: "סיבים תזונתיים",
      sodium: "נתרן",
      calcium: "סידן",
      iron: "ברזל",
      cholesterol: "כולסטרול",
      saturatedFat: "שומן רווי",
    };
    const units = { sodium: "mg", calcium: "mg", iron: "mg", cholesterol: "mg" };
    const lines = [];
    if (result.description) {
      lines.push(`**${result.description}**`);
      lines.push("");
    }
    if (result.items?.length) {
      lines.push(result.items.map((item) => `• ${item}`).join("\n"));
      lines.push("");
    }
    const header = result.servings > 1
      ? `**ערכים תזונתיים (למנה)** (${result.servings} מנות)`
      : "**ערכים תזונתיים (למנה)**";
    lines.push(header);
    for (const [key, label] of Object.entries(LABELS)) {
      const val = parseInt(n[key], 10) || 0;
      if (val === 0 && key !== "calories") continue;
      const unit = units[key] || (key === "calories" ? "" : "g");
      if (key === "sugars" && val > 0) {
        const tsp = Math.round(val / 4 * 10) / 10;
        lines.push(`${label}: ${val}${unit} (≈ ${tsp} כפיות סוכר)`);
      } else {
        lines.push(`${label}: ${val}${unit}`);
      }
    }
    return lines.join("\n");
  };

  const handleImageAnalysis = async (imageBase64) => {
    setMessages((prev) => [...prev, { role: "user", content: t("chat", "analyzeImageLabel"), image: imageBase64 }]);
    setIsLoading(true);
    setError("");
    abortRef.current = new AbortController();
    try {
      const result = await analyzeImageForNutrition(imageBase64, { signal: abortRef.current.signal });
      const formatted = formatNutritionResult(result);
      setMessages((prev) => [...prev, { role: "assistant", content: formatted }]);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || t("chat", "analyzeImageError"));
    } finally {
      setIsLoading(false);
    }
  };

  const chatFeatureKey = isRecipeMode ? FEATURES.RECIPE_CHAT : FEATURES.GENERAL_CHAT;

  const sendMessage = async (text) => {
    if (isLoading || !text.trim()) return;
    const check = canUse(chatFeatureKey);
    if (!check.allowed) return;
    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setError("");
    abortRef.current = new AbortController();
    try {
      const intent = !isRecipeMode ? detectIntent(text) : undefined;
      const matched = !isRecipeMode
        ? findRelevantRecipes(text, allRecipes)
        : [];
      const response = await sendChatMessage(updatedMessages, recipeContext, language, { signal: abortRef.current.signal });
      const assistantMsg = { role: "assistant", content: response };
      if (intent) assistantMsg.intent = intent;
      if (matched.length > 0) assistantMsg.matchedRecipes = matched;
      if (!isRecipeMode && shouldOfferCreateRecipe(intent, response)) {
        assistantMsg.offerCreate = true;
        const names = extractRecipeNames(response);
        if (names.length > 0) assistantMsg.recipeNames = names;
      }
      setMessages([...updatedMessages, assistantMsg]);
      await incrementUsage(chatFeatureKey);
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

  const recipesView = useRecipesView();

  const handleCreateRecipeFromName = useCallback(async (recipeName) => {
    if (!recipesView?.onAddRecipe || isLoading) return;
    setIsLoading(true);
    setLoadingRecipeName(recipeName);
    setError("");
    abortRef.current = new AbortController();
    try {
      const { callOpenAI } = await import("../../services/openai");
      const response = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a recipe assistant. Write a complete recipe in the user's language.\nFormat:\nFirst line: recipe name\nThen a section titled מרכיבים: with one ingredient per line (use - prefix).\nThen a section titled אופן הכנה: with numbered steps." },
          { role: "user", content: `כתוב לי מתכון מלא ל${recipeName} עם רשימת מרכיבים מדויקת ואופן הכנה צעד אחר צעד` },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }, { signal: abortRef.current.signal });
      const draft = buildRecipeDraftFromChat(response);
      if (draft && draft.name) {
        try { sessionStorage.setItem("chatRecipeDraft", JSON.stringify(draft)); } catch {}
        recipesView.onAddRecipe("manual");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Failed to get recipe details");
    } finally {
      setIsLoading(false);
      setLoadingRecipeName(null);
    }
  }, [recipesView, isLoading]);

  const handleRecipeVariation = useCallback(async (recipeId, variationType) => {
    if (!recipesView?.onAddRecipe || isLoading) return;
    const source = allRecipes.find((r) => r.id === recipeId);
    if (!source) return;
    setIsLoading(true);
    setError("");
    abortRef.current = new AbortController();
    try {
      const { callOpenAI } = await import("../../services/openai");
      const ings = Array.isArray(source.ingredients) ? source.ingredients.join("\n") : "";
      const steps = Array.isArray(source.instructions) ? source.instructions.join("\n") : "";
      const base = `הנה מתכון קיים:\nשם: ${source.name}\nמרכיבים:\n${ings}\nאופן הכנה:\n${steps}\n\n`;
      const fmt = "שמור על אותו פורמט: שורה ראשונה שם, אח\"כ מרכיבים: עם - לפני כל מרכיב, אח\"כ אופן הכנה: עם מספור.";
      const variationPrompts = {
        healthier:  `כתוב גרסה בריאה יותר של המתכון. ${fmt}`,
        protein:    `כתוב גרסה עם יותר חלבון של המתכון. ${fmt}`,
        quick:      `כתוב גרסה מהירה ופשוטה יותר של המתכון עם פחות שלבים. ${fmt}`,
        kids:       `כתוב גרסה מותאמת לילדים של המתכון - טעמים עדינים, ללא חריף. ${fmt}`,
        vegan:      `כתוב גרסה טבעונית של המתכון - ללא מוצרים מן החי. ${fmt}`,
        glutenFree: `כתוב גרסה ללא גלוטן של המתכון - החלף מרכיבים עם גלוטן בתחליפים. ${fmt}`,
      };
      const prompt = base + (variationPrompts[variationType] || variationPrompts.healthier);
      const response = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a recipe assistant. Return a complete recipe in the user's language.\nFormat:\nFirst line: recipe name\nThen מרכיבים: with - prefix per ingredient.\nThen אופן הכנה: with numbered steps." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }, { signal: abortRef.current.signal });
      const draft = buildRecipeDraftFromChat(response);
      if (draft && draft.name) {
        draft.parentRecipeId = source.id;
        draft.parentRecipeName = source.name;
        draft.variationType = variationType || "custom";
        try { sessionStorage.setItem("chatRecipeDraft", JSON.stringify(draft)); } catch {}
        recipesView.onAddRecipe("manual");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Failed to create variation");
    } finally {
      setIsLoading(false);
    }
  }, [recipesView, isLoading, allRecipes]);

  const detectVariationType = (text) => {
    const t = (text || "").toLowerCase();
    if (/בריא|healthy|healthier|קל(ה|ות)?\s*יותר/.test(t)) return "healthier";
    if (/חלבון|protein/.test(t)) return "protein";
    if (/מהיר|quick|פשוט|קל\b/.test(t)) return "quick";
    if (/ילד|kids|child|תינוק/.test(t)) return "kids";
    if (/טבעונ|vegan/.test(t)) return "vegan";
    if (/גלוטן|gluten/.test(t)) return "glutenFree";
    return "custom";
  };

  const handleCreateVariation = useCallback(async (aiResponse, msgIndex, userInstruction) => {
    if (!recipeContext || applyingIdx !== null) return;
    const variationCheck = canUse(FEATURES.CREATE_VARIATION);
    if (!variationCheck.allowed) {
      setError(t("premium", "limitReached"));
      return;
    }
    setApplyingIdx(msgIndex);
    setError("");
    try {
      const { callOpenAI } = await import("../../services/openai");
      const instruction = userInstruction ? `\n\nUser's specific instruction: ${userInstruction}` : "";
      const result = await callOpenAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You are a recipe update assistant. Given the original recipe and an AI suggestion, apply the suggested changes and return the updated recipe as a VARIATION.
Return ONLY valid JSON: { "name": "...", "ingredients": [...], "instructions": [...] }
IMPORTANT: The "name" must describe the variation, e.g. "Original Name – healthier version" or "Original Name – more protein". Do NOT return the original name unchanged.
Include the COMPLETE ingredients and instructions arrays with changes applied. Keep the original language.` },
          { role: "user", content: `Original recipe:\nName: ${recipeContext.name}\nIngredients: ${JSON.stringify(recipeContext.ingredients)}\nInstructions: ${JSON.stringify(recipeContext.instructions)}\n\nAI suggestion to apply:\n${aiResponse}${instruction}\n\nReturn the COMPLETE updated recipe as JSON.` },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });
      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const src = recipe || {};
      const draft = {
        name: parsed.name || `${src.name || ""} – ${t("recipeChat", "variation")}`,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : recipeContext.ingredients,
        instructions: Array.isArray(parsed.instructions) ? parsed.instructions : recipeContext.instructions,
        prepTime: src.prepTime || "",
        cookTime: parsed.cookTime || src.cookTime || "",
        servings: src.servings || "",
        difficulty: src.difficulty || "Unknown",
        categories: Array.isArray(src.categories) ? src.categories : [],
        notes: src.notes || "",
        author: src.author || "",
        sourceUrl: src.sourceUrl || "",
        nutrition: parsed.nutrition || src.nutrition || {},
        isFavorite: false,
        parentRecipeId: src.id || null,
        parentRecipeName: src.name || "",
        variationType: detectVariationType(`${aiResponse} ${userInstruction || ""}`),
      };
      try { sessionStorage.setItem("chatRecipeDraft", JSON.stringify(draft)); } catch (e) { console.error("Failed to save draft:", e); }
      await incrementUsage(FEATURES.CREATE_VARIATION);
      if (recipesView?.onAddRecipe) {
        recipesView.onAddRecipe("manual");
      } else {
        sessionStorage.setItem("openAddRecipe", "manual");
        navigate("/categories");
      }
    } catch (err) {
      console.error("Failed to create variation:", err);
      setError(t("recipeChat", "updateFailed"));
    } finally {
      setApplyingIdx(null);
    }
  }, [recipesView, recipeContext, recipe, applyingIdx, t, navigate, canUse, incrementUsage]);

  const isEmpty = messages.length === 0 && !isRecipeMode;

  const hasMessages = messages.length > 0;

  const contextValue = {
    messages, isLoading, error, isRecipeMode, isEmpty,
    applyingIdx, customUpdateIdx, setCustomUpdateIdx,
    customUpdateText, setCustomUpdateText,
    appliedFields, userInitial,
    handleApplyUpdate: onUpdateRecipe ? handleApplyUpdate : null,
    handleCreateVariation: onUpdateRecipe ? handleCreateVariation : null,
    handleChipClick,
    handleCreateRecipeFromName, loadingRecipeName,
    handleRecipeVariation, allRecipes,
    messagesEndRef, messagesAreaRef,
    recipe, recipeContext,
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
          {!isRecipeMode && hasMessages && (
            <>
              <div className={classes.bottomQuickActions}>
                {COMPACT_QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s.labelKey}
                    className={classes.bottomQuickChip}
                    onClick={() => handleChipClick(t("chat", s.promptKey))}
                    disabled={isLoading}
                  >
                    {t("chat", s.labelKey)}
                  </button>
                ))}
              </div>
              <button
                className={classes.broadChipsToggle}
                onClick={() => setShowBroadChips((v) => !v)}
              >
                <Lightbulb size={14} />
                {t("chat", "quickIdeasToggle")}
                {showBroadChips ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showBroadChips && (
                <div className={classes.broadChipsPanel}>
                  {IDEA_CHIPS.map((chipKey) => (
                    <button
                      key={chipKey}
                      className={classes.bottomQuickChip}
                      onClick={() => { handleChipClick(t("chat", chipKey)); setShowBroadChips(false); }}
                      disabled={isLoading}
                    >
                      {t("chat", chipKey)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <div className={classes.inputMeta}>
            <UsageIndicator featureKey={chatFeatureKey} />
          </div>
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={(text) => sendMessage(text)}
            placeholder={isRecipeMode ? t("recipeChat", "placeholder") : t("chat", "placeholder")}
            disabled={isLoading || !canUse(chatFeatureKey).allowed}
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
