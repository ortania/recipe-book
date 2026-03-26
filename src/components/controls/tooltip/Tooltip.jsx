import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import classes from "./tooltip.module.css";

const AUTO_HIDE_MS = 2500;
const EDGE_PAD = 8;
const GAP = 6;

function Tooltip({ text, children, className }) {
  const [show, setShow] = useState(false);
  const triggerRef = useRef(null);
  const bubbleRef = useRef(null);
  const timerRef = useRef(null);
  const touchedRef = useRef(false);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const hide = useCallback(() => {
    setShow(false);
    clear();
  }, []);

  const handleTouchStart = useCallback(() => {
    touchedRef.current = true;
  }, []);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (touchedRef.current) e.preventDefault();
      touchedRef.current = false;
      setShow((prev) => !prev);
      clear();
      timerRef.current = setTimeout(hide, AUTO_HIDE_MS);
    },
    [hide],
  );

  const handleEnter = useCallback(() => {
    if (touchedRef.current) return;
    setShow(true);
  }, []);

  const handleLeave = useCallback(() => {
    if (touchedRef.current) return;
    hide();
  }, [hide]);

  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    const trigger = triggerRef.current;
    if (!show || !bubble || !trigger) return;

    const tr = trigger.getBoundingClientRect();
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const vw = window.innerWidth;

    let left = tr.left + tr.width / 2 - bw / 2;
    left = Math.max(EDGE_PAD, Math.min(left, vw - bw - EDGE_PAD));

    let top;
    const above = tr.top - GAP - bh;
    if (above >= EDGE_PAD) {
      top = tr.top - GAP - bh;
    } else {
      top = tr.bottom + GAP;
    }

    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
    bubble.style.opacity = "1";
  }, [show, text]);

  useEffect(() => {
    if (!show) return;
    const onTap = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        bubbleRef.current?.contains(e.target)
      )
        return;
      hide();
    };
    document.addEventListener("pointerdown", onTap, true);
    return () => document.removeEventListener("pointerdown", onTap, true);
  }, [show, hide]);

  useEffect(() => clear, []);

  const bubble = show
    ? createPortal(
        <span ref={bubbleRef} className={classes.bubble} role="tooltip">
          {text}
        </span>,
        document.body,
      )
    : null;

  return (
    <span className={`${classes.wrapper} ${className || ""}`}>
      <span
        ref={triggerRef}
        className={classes.trigger}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        role="button"
        tabIndex={0}
        aria-label={text}
      >
        {children}
      </span>
      {bubble}
    </span>
  );
}

export default Tooltip;
