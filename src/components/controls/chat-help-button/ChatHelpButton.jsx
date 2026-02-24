import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { BottomSheet } from "../bottom-sheet";
import classes from "./chat-help-button.module.css";

const MOBILE_BREAKPOINT = 768;

function ChatHelpButton({ items, title, description, onToggle }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const dragState = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const handleToggle = useCallback(
    (val) => {
      if (val) setPos({ x: 0, y: 0 });
      setOpen(val);
      if (onToggle) onToggle(val);
    },
    [onToggle],
  );

  /* ── Desktop drag-to-move ────────────────────────────── */
  const onDragStart = useCallback(
    (clientX, clientY) => {
      dragState.current = {
        dragging: true,
        startX: clientX - pos.x,
        startY: clientY - pos.y,
      };
    },
    [pos],
  );

  useEffect(() => {
    if (!open || isMobile) return;
    const onMove = (e) => {
      if (!dragState.current.dragging) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      setPos({
        x: cx - dragState.current.startX,
        y: cy - dragState.current.startY,
      });
    };
    const onEnd = () => {
      dragState.current.dragging = false;
    };
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
  }, [open, isMobile]);

  /* ── Shared item list ────────────────────────────────── */
  const renderItems = () => (
    <ul>
      {items.map((item, i) => {
        const hasContent = typeof item === "object" && item?.content != null;
        const text = typeof item === "string" ? item : item?.text ?? "";
        const indent = typeof item === "object" && item?.indent;
        let body;
        if (hasContent) body = item.content;
        else if (typeof item === "string") body = item;
        else if (text) body = text;
        else body = item;
        return (
          <li key={i} className={indent ? classes.indent : undefined}>
            {body}
          </li>
        );
      })}
    </ul>
  );

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

      {/* ── Mobile: BottomSheet ─────────────────────────── */}
      {isMobile && (
        <BottomSheet
          open={open}
          onClose={() => handleToggle(false)}
          title={title}
        >
          <div className={classes.content}>
            {description && (
              <p className={classes.description}>{description}</p>
            )}
            {renderItems()}
          </div>
        </BottomSheet>
      )}

      {/* ── Desktop: floating popup ────────────────────── */}
      {!isMobile &&
        open &&
        createPortal(
          <>
            <div
              className={classes.overlay}
              onClick={() => handleToggle(false)}
            />
            <div
              className={classes.dropdown}
              style={{
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              }}
            >
              <div
                className={classes.dragHeader}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onDragStart(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  onDragStart(e.touches[0].clientX, e.touches[0].clientY);
                }}
              >
                <span className={classes.dragIndicator}>⠿</span>
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
                {renderItems()}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

export default ChatHelpButton;
