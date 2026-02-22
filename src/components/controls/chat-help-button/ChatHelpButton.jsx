import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../context";
import classes from "./chat-help-button.module.css";

function ChatHelpButton({ items, title, description, onToggle }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragState = useRef({ dragging: false, startX: 0, startY: 0 });

  const handleToggle = (val) => {
    if (val) setPos({ x: 0, y: 0 });
    setOpen(val);
    if (onToggle) onToggle(val);
  };

  const onDragStart = useCallback((clientX, clientY) => {
    dragState.current = { dragging: true, startX: clientX - pos.x, startY: clientY - pos.y };
  }, [pos]);

  useEffect(() => {
    if (!open) return;
    const onMove = (e) => {
      if (!dragState.current.dragging) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      setPos({ x: cx - dragState.current.startX, y: cy - dragState.current.startY });
    };
    const onEnd = () => { dragState.current.dragging = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [open]);

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
            <div
              className={classes.dropdown}
              style={{ transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
            >
              <div
                className={classes.dragHeader}
                onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }}
                onTouchStart={(e) => { onDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
              >
                <span className={classes.dragHint}>
                  <span className={classes.dragIndicator} aria-hidden>⠿</span>
                  <span className={classes.dragLabel}>{t("common", "dragToMove")}</span>
                </span>
                <button
                  className={classes.close}
                  onClick={() => handleToggle(false)}
                >
                  ✕
                </button>
              </div>
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
