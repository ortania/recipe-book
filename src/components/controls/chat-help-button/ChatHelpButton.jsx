import { useState } from "react";
import { createPortal } from "react-dom";
import classes from "./chat-help-button.module.css";

function ChatHelpButton({ items, title, description, onToggle }) {
  const [open, setOpen] = useState(false);

  const handleToggle = (val) => {
    setOpen(val);
    if (onToggle) onToggle(val);
  };

  return (
    <div className={classes.wrapper}>
      <button
        className={classes.btn}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle(!open);
        }}
      >
        ?
      </button>
      {open &&
        createPortal(
          <>
            <div
              className={classes.overlay}
              onClick={() => handleToggle(false)}
            />
            <div className={classes.dropdown}>
              <button
                className={classes.close}
                onClick={() => handleToggle(false)}
              >
                ✕
              </button>
              <div className={classes.content}>
                {title && <strong>{title}</strong>}
                {description && (
                  <p className={classes.description}>{description}</p>
                )}
                <ul>
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

export default ChatHelpButton;
