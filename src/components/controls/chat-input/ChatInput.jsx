import { useRef } from "react";
import { FaImage } from "react-icons/fa";
import classes from "./chat-input.module.css";

function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  showImageButton = false,
  onImageSelect,
}) {
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!disabled && value.trim()) {
      onSubmit(value);
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
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={classes.input}
          disabled={disabled}
        />
        <div className={classes.inputActions}>
          {showImageButton && (
            <button
              type="button"
              className={classes.imageBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              title="Upload food image"
            >
              <FaImage />
            </button>
          )}
          <button
            type="submit"
            className={classes.sendBtn}
            disabled={disabled || !value.trim()}
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
      </div>
    </form>
  );
}

export default ChatInput;
