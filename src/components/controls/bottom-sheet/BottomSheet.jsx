import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import classes from "./bottom-sheet.module.css";

const CLOSE_THRESHOLD = 0.25;
const CLOSE_VELOCITY = 0.5;
const ANIM_MS = 300;
const TRANSITION_TRANSFORM = `transform ${ANIM_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`;
const TRANSITION_OPACITY = `opacity ${ANIM_MS}ms ease`;

function BottomSheet({ open, onClose, title, children }) {
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dragRef = useRef({
    active: false,
    startY: 0,
    offset: 0,
    fromHandle: false,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
  });

  /* ── animate out ─────────────────────────────────────── */
  const animateOut = useCallback(() => {
    closingRef.current = true;
    const sheet = sheetRef.current;
    const overlay = overlayRef.current;
    if (sheet) {
      sheet.style.transition = TRANSITION_TRANSFORM;
      sheet.style.transform = "translateY(100%)";
    }
    if (overlay) {
      overlay.style.transition = TRANSITION_OPACITY;
      overlay.style.opacity = "0";
    }
    setTimeout(() => {
      setMounted(false);
      closingRef.current = false;
      document.body.style.overflow = "";
    }, ANIM_MS + 20);
  }, []);

  /* ── user-initiated close (immediate animation) ──────── */
  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    animateOut();
    onCloseRef.current();
  }, [animateOut]);

  /* ── mount / unmount driven by `open` prop ───────────── */
  useEffect(() => {
    if (open && !mounted && !closingRef.current) {
      setMounted(true);
    } else if (!open && mounted && !closingRef.current) {
      animateOut();
    }
  }, [open, mounted, animateOut]);

  /* ── animate-in after mount ──────────────────────────── */
  useEffect(() => {
    if (!mounted || !open) return;
    const sheet = sheetRef.current;
    const overlay = overlayRef.current;
    if (!sheet || !overlay) return;

    sheet.style.transform = "translateY(100%)";
    sheet.style.transition = "none";
    overlay.style.opacity = "0";
    overlay.style.transition = "none";
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!sheetRef.current) return;
        sheet.style.transition = TRANSITION_TRANSFORM;
        sheet.style.transform = "translateY(0)";
        overlay.style.transition = TRANSITION_OPACITY;
        overlay.style.opacity = "1";
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  /* ── drag: helpers ───────────────────────────────────── */
  const applyDragOffset = useCallback((offset) => {
    const sheet = sheetRef.current;
    const overlay = overlayRef.current;
    if (sheet) {
      sheet.style.transition = "none";
      sheet.style.transform = `translateY(${offset}px)`;
    }
    if (overlay) {
      const h = sheet?.offsetHeight || window.innerHeight * 0.75;
      overlay.style.transition = "none";
      overlay.style.opacity = String(Math.max(0, 1 - offset / h));
    }
  }, []);

  const onHandleTouchStart = useCallback((e) => {
    if (closingRef.current) return;
    const t = e.touches[0];
    dragRef.current = {
      active: true,
      startY: t.clientY,
      offset: 0,
      fromHandle: true,
      lastY: t.clientY,
      lastTime: Date.now(),
      velocity: 0,
    };
  }, []);

  const onContentTouchStart = useCallback((e) => {
    if (closingRef.current) return;
    const t = e.touches[0];
    dragRef.current = {
      active: false,
      startY: t.clientY,
      offset: 0,
      fromHandle: false,
      lastY: t.clientY,
      lastTime: Date.now(),
      velocity: 0,
    };
  }, []);

  /* ── drag: move & end (window-level) ─────────────────── */
  useEffect(() => {
    if (!mounted) return;

    const onTouchMove = (e) => {
      if (closingRef.current) return;
      const drag = dragRef.current;
      const t = e.touches[0];
      const now = Date.now();
      drag.velocity = (t.clientY - drag.lastY) / (now - drag.lastTime || 1);
      drag.lastY = t.clientY;
      drag.lastTime = now;

      if (drag.fromHandle) {
        const delta = t.clientY - drag.startY;
        if (!drag.active && delta > 2) drag.active = true;
        if (drag.active) {
          drag.offset = Math.max(0, delta);
          applyDragOffset(drag.offset);
          e.preventDefault();
        }
      } else {
        const content = contentRef.current;
        if (!drag.active) {
          const delta = t.clientY - drag.startY;
          if (content && content.scrollTop <= 0 && delta > 8) {
            drag.active = true;
            drag.startY = t.clientY;
            drag.offset = 0;
          }
        }
        if (drag.active) {
          drag.offset = Math.max(0, t.clientY - drag.startY);
          applyDragOffset(drag.offset);
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = () => {
      const drag = dragRef.current;
      if (!drag.active) return;
      const h = sheetRef.current?.offsetHeight || window.innerHeight * 0.75;

      if (drag.offset > h * CLOSE_THRESHOLD || drag.velocity > CLOSE_VELOCITY) {
        handleClose();
      } else {
        const sheet = sheetRef.current;
        const overlay = overlayRef.current;
        if (sheet) {
          sheet.style.transition = TRANSITION_TRANSFORM;
          sheet.style.transform = "translateY(0)";
        }
        if (overlay) {
          overlay.style.transition = TRANSITION_OPACITY;
          overlay.style.opacity = "1";
        }
      }
      drag.active = false;
      drag.offset = 0;
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [mounted, handleClose, applyDragOffset]);

  /* ── Escape key ──────────────────────────────────────── */
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, handleClose]);

  /* ── Android back button (history) ───────────────────── */
  useEffect(() => {
    if (!mounted) return;
    window.history.pushState({ bottomSheet: true }, "");
    const onPop = () => handleClose();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (window.history.state?.bottomSheet) {
        window.history.back();
      }
    };
  }, [mounted, handleClose]);

  /* ── render ──────────────────────────────────────────── */
  if (!mounted) return null;

  return createPortal(
    <div className={classes.root} role="dialog" aria-modal="true">
      <div
        ref={overlayRef}
        className={classes.overlay}
        onClick={handleClose}
      />
      <div ref={sheetRef} className={classes.sheet}>
        <div
          className={classes.handleArea}
          onTouchStart={onHandleTouchStart}
        >
          <div className={classes.handle} />
        </div>

        <div className={classes.header}>
          <span className={classes.title}>{title || ""}</span>
          <button
            className={classes.closeBtn}
            onClick={handleClose}
            aria-label="סגירה"
          >
            ✕
          </button>
        </div>

        <div
          ref={contentRef}
          className={classes.content}
          onTouchStart={onContentTouchStart}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default BottomSheet;
