import { useRef, useState, useCallback, useEffect } from "react";
import { FaImage } from "react-icons/fa";
import { FaStop } from "react-icons/fa6";
import { IoCloseCircle } from "react-icons/io5";
import { PiMicrophoneLight, PiMicrophoneSlash } from "react-icons/pi";
import { useLanguage } from "../../../context";
import classes from "./chat-input.module.css";

const SPEECH_LANG_MAP = {
  he: "he-IL",
  en: "en-US",
  ru: "ru-RU",
  de: "de-DE",
  mixed: "he-IL",
};

function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  isLoading = false,
  onStop,
  showImageButton = false,
  onImageSelect,
}) {
  const { language, t } = useLanguage();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const toggleSpeech = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = SPEECH_LANG_MAP[language] || "he-IL";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      onChange(text);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        alert("יש לאפשר גישה למיקרופון");
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, language, onChange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!disabled && value.trim()) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
        setIsListening(false);
      }
      onSubmit(value);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !onImageSelect) return;
    onImageSelect(file);
    e.target.value = "";
  };

  return (
    <form className={classes.inputForm} onSubmit={handleSubmit}>
      {showImageButton && (
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: "none" }}
        />
      )}
      <div className={classes.inputWrap}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "🎤 ..." : placeholder}
          className={classes.input}
          disabled={disabled}
          rows={1}
        />
        <div className={classes.inputActions}>
          {isLoading && onStop ? (
            <button
              type="button"
              className={classes.stopBtn}
              onClick={onStop}
              title={t("chat", "voiceStop")}
            >
              <FaStop />
            </button>
          ) : value.trim() ? (
            <>
              <button
                type="button"
                className={classes.clearBtn}
                onClick={() => {
                  onChange("");
                  textareaRef.current?.focus();
                }}
                title={t("common", "clear") || "Clear"}
              >
                <IoCloseCircle />
              </button>
              <button
                type="submit"
                className={classes.sendBtn}
                disabled={disabled}
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
            </>
          ) : (
            <>
              {showImageButton && (
                <button
                  type="button"
                  className={classes.imageBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  title={t("chat", "uploadImage")}
                >
                  <FaImage />
                </button>
              )}
              <button
                type="button"
                className={`${classes.micBtn} ${isListening ? classes.micActive : ""}`}
                onClick={toggleSpeech}
                disabled={disabled}
                title={isListening ? t("chat", "voiceStop") : t("chat", "voiceInput")}
              >
                {isListening ? <PiMicrophoneLight /> : <PiMicrophoneSlash />}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

export default ChatInput;
