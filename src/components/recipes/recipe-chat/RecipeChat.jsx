import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../../../services/openai";
import { useLanguage } from "../../../context";
import classes from "./recipe-chat.module.css";

function RecipeChat({ recipe, servings }) {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          <p className={classes.emptyText}>
            {t("recipeChat", "emptyMessage")}
          </p>
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
              <div className={classes.bubble}>{message.content}</div>
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
