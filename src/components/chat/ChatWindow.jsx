import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaTimes, FaTrash, FaImage } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { PiTrash } from "react-icons/pi";
import { CiSearch } from "react-icons/ci";
import {
  sendChatMessage,
  analyzeImageForNutrition,
} from "../../services/openai";
import { useLanguage } from "../../context";
import classes from "./chat-window.module.css";

function ChatWindow({ onClose, recipeContext = null }) {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    const scrollY = window.scrollY;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;

    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const clearChat = () => {
    setMessages([]);
    setError("");
    localStorage.removeItem("chatMessages");
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
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
    e.target.value = "";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!input.trim()) return;

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
      const finalMessages = [
        ...updatedMessages,
        { role: "assistant", content: response },
      ];
      setMessages(finalMessages);
    } catch (err) {
      setError(err.message || "Failed to get response. Please try again.");
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={classes.chatOverlay} onClick={onClose}>
      <div className={classes.chatWindow} onClick={(e) => e.stopPropagation()}>
        <div className={classes.chatHeader}>
          <h3>
            <CiSearch className={classes.searchIcon} />
            <span>{t("chat", "cookingAssistant")}</span>
          </h3>
          <div className={classes.headerButtons}>
            <button
              className={classes.clearButton}
              onClick={clearChat}
              title="Clear chat history"
            >
              {/* <FaTrash /> */}
              {<PiTrash />}
            </button>
            <button className={classes.closeButton} onClick={onClose}>
              {/* <FaTimes /> */}
              {<IoClose />}
            </button>
          </div>
        </div>

        <div className={classes.messagesContainer}>
          {messages.length > 0 && (
            <>
              <div className={classes.conversationsHeader}>
                <h4>{t("chat", "conversations")}</h4>
              </div>
              <div className={classes.separator}></div>
              <div className={classes.chatLogLabel}>{t("nav", "chatLog")}</div>
            </>
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
              <div className={classes.messageContent}>
                {message.image && (
                  <img
                    src={message.image}
                    alt="Uploaded food"
                    className={classes.chatImage}
                  />
                )}
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={`${classes.message} ${classes.assistantMessage}`}>
              <div className={classes.messageContent}>
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

        <form className={classes.inputContainer} onSubmit={handleSubmit}>
          <div className={classes.inputRow}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className={classes.imageUploadButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Upload food image for nutritional analysis"
            >
              <FaImage />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat", "placeholder")}
              className={classes.input}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={classes.sendButton}
              disabled={isLoading || !input.trim()}
            >
              <FaPaperPlane />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
