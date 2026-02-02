import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaTimes, FaTrash } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { PiTrash } from "react-icons/pi";
import { CiSearch } from "react-icons/ci";
import { sendChatMessage } from "../../services/openai";
import classes from "./chat-window.module.css";

function ChatWindow({ onClose, recipeContext = null }) {
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
    localStorage.setItem("chatMessages", JSON.stringify(messages));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const response = await sendChatMessage(updatedMessages, recipeContext);
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
            <span>Cooking Assistant</span>
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
                <h4>Conversations</h4>
              </div>
              <div className={classes.separator}></div>
              <div className={classes.chatLogLabel}>Chat Log</div>
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
              <div className={classes.messageContent}>{message.content}</div>
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
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about recipes, cooking tips..."
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
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
