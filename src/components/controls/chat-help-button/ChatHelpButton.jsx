import { useState } from "react";
import classes from "./chat-help-button.module.css";

function ChatHelpButton({ items, title }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={classes.wrapper}>
      <button
        className={classes.btn}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        ?
      </button>
      {open && (
        <div className={classes.dropdown}>
          <button
            className={classes.close}
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
          <div className={classes.content}>
            {title && <strong>{title}</strong>}
            <ul>
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatHelpButton;
