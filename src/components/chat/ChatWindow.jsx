import { useState, useRef, useEffect } from "react";
import { FiTrash2 } from "react-icons/fi";
import {
  sendChatMessage,
  analyzeImageForNutrition,
} from "../../services/openai";
import { useLanguage, useRecipeBook } from "../../context";
import { Greeting } from "../greeting";
import { ChatHelpButton } from "../controls/chat-help-button";
import { ChatInput } from "../controls/chat-input";
import classes from "./chat-window.module.css";

const IDEA_CHIPS = [
  "ideaChip1",
  "ideaChip2",
  "ideaChip3",
  "ideaChip4",
  "ideaChip5",
  "ideaChip6",
];

function ChatWindow({ recipeContext = null }) {
  const { t, language } = useLanguage();
  const { currentUser } = useRecipeBook();
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
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

  useEffect(() => {
    const messagesForStorage = messages.map(({ image, ...rest }) => rest);
    localStorage.setItem("chatMessages", JSON.stringify(messagesForStorage));
  }, [messages]);

  const userInitial = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : "C";

  const clearChat = () => {
    setMessages([]);
    setError("");
    localStorage.removeItem("chatMessages");
  };

  const handleImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleImageAnalysis(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageAnalysis = async (imageBase64) => {
    const userImageMsg = {
      role: "user",
      content: "🖼️ Analyze nutritional values",
      image: imageBase64,
    };
    setMessages((prev) => [...prev, userImageMsg]);
    setIsLoading(true);
    setError("");

    try {
      const response = await analyzeImageForNutrition(imageBase64);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (err) {
      setError(err.message || "Failed to analyze image. Please try again.");
      console.error("Image analysis error:", err);
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
      setError(err.message || "Failed to get response. Please try again.");
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = (text) => {
    sendMessage(text);
    setInput("");
  };

  const handleChipClick = (chipKey) => {
    const text = t("chat", chipKey);
    if (text) sendMessage(text);
  };

  return (
    <div className={classes.chatContainer}>
      <div className={classes.chatHeader}>
        <div className={classes.greeting}>
          <Greeting />
        </div>
        <ChatHelpButton
          title={t("chat", "helpTitle")}
          items={[
            t("chat", "helpFeature1"),
            t("chat", "helpFeature2"),
            t("chat", "helpFeature3"),
            t("chat", "helpFeature4"),
          ]}
        />
      </div>

      {messages.length > 0 && (
        <div className={classes.chatToolbar}>
          <button className={classes.clearBtn} onClick={clearChat}>
            <FiTrash2 /> {t("chat", "clearChat")}
          </button>
        </div>
      )}

      <div className={classes.messagesArea}>
        {messages.length === 0 && (
          <div className={classes.ideasSection}>
            <h3 className={classes.ideasTitle}>{t("chat", "ideaTitle")}</h3>
            <p className={classes.ideasSubtitle}>{t("chat", "ideaSubtitle")}</p>
            <div className={classes.ideaChips}>
              {IDEA_CHIPS.map((chipKey) => (
                <button
                  key={chipKey}
                  className={classes.ideaChip}
                  onClick={() => handleChipClick(chipKey)}
                  disabled={isLoading}
                >
                  {t("chat", chipKey)}
                </button>
              ))}
            </div>
          </div>
        )}

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
              {message.image && (
                <img
                  src={message.image}
                  alt="Uploaded food"
                  className={classes.chatImage}
                />
              )}
              {message.content}
            </div>
            {message.role === "user" && (
              <div className={classes.avatar}>{userInitial}</div>
            )}
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

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleChatSubmit}
        placeholder={t("chat", "placeholder")}
        disabled={isLoading}
        showImageButton={true}
        onImageSelect={handleImageFile}
      />
    </div>
  );
}

export default ChatWindow;
