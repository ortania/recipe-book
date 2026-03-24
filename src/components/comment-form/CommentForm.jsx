import { useState, useRef } from "react";
import { Send, XCircle } from "lucide-react";
import { useLanguage } from "../../context";
import classes from "./comment-form.module.css";

function CommentForm({ onSubmit, currentUser, disabled }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting || !currentUser) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  if (!currentUser) return null;

  return (
    <form className={classes.form} onSubmit={handleSubmit}>
      <div className={classes.inputWrapper}>
        <textarea
          ref={textareaRef}
          className={classes.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={t("comments", "placeholder")}
          rows={1}
          disabled={disabled || submitting}
        />
        {text && (
          <button
            type="button"
            className={classes.clearBtn}
            onClick={() => {
              setText("");
              if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.focus();
              }
            }}
          >
            <XCircle strokeWidth={1} size={18} />
          </button>
        )}
        <button
          type="submit"
          className={classes.sendBtn}
          disabled={!text.trim() || submitting}
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}

export default CommentForm;
