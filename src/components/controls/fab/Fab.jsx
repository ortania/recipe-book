import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { BottomSheet } from "../bottom-sheet";
import classes from "./fab.module.css";

const SCROLL_THRESHOLD = 20;
const STROKE = 1.5;
const DRAG_THRESHOLD = 8;
const FAB_POS_KEY = "fabPosition";

function findScrollParent(el) {
  let parent = el?.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    if (/auto|scroll/.test(style.overflow + style.overflowY)) return parent;
    parent = parent.parentElement;
  }
  return window;
}

function Fab({
  icon = <Plus size="1em" strokeWidth={STROKE} />,
  label,
  onClick,
  children,
  sheetTitle,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fabRef = useRef(null);
  const lastScrollY = useRef(0);
  const scrollParentRef = useRef(null);
  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });
  const wasDraggedRef = useRef(false);

  const getScrollTop = useCallback(() => {
    const el = scrollParentRef.current;
    if (!el || el === window) return window.scrollY;
    return el.scrollTop;
  }, []);

  const onScroll = useCallback(() => {
    const currentY = getScrollTop();
    const delta = currentY - lastScrollY.current;
    if (delta > SCROLL_THRESHOLD) {
      setCollapsed(true);
      lastScrollY.current = currentY;
    } else if (delta < -SCROLL_THRESHOLD) {
      setCollapsed(false);
      lastScrollY.current = currentY;
    }
  }, [getScrollTop]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAB_POS_KEY);
      if (saved) setPos(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (pos) localStorage.setItem(FAB_POS_KEY, JSON.stringify(pos));
  }, [pos]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const isRtl = document.documentElement.dir === "rtl";
    dragState.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      originX: isRtl ? rect.left : window.innerWidth - rect.right,
      originY: window.innerHeight - rect.bottom,
      moved: false,
    };
  }, []);

  useEffect(() => {
    const el = fabRef.current;
    if (!el) return;
    const onMove = (e) => {
      const d = dragState.current;
      if (!d.active) return;
      const touch = e.touches[0];
      const dx = touch.clientX - d.startX;
      const dy = touch.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      setDragging(true);
      e.preventDefault();
      const isRtl = document.documentElement.dir === "rtl";
      const newX = d.originX + (isRtl ? dx : -dx);
      const newY = d.originY - dy;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - w - 8, newX)),
        y: Math.max(8, Math.min(window.innerHeight - h - 8, newY)),
      });
    };
    const onEnd = () => {
      if (dragState.current.moved) wasDraggedRef.current = true;
      dragState.current.active = false;
      dragState.current.moved = false;
      setDragging(false);
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  useEffect(() => {
    const scrollEl = findScrollParent(fabRef.current);
    scrollParentRef.current = scrollEl;
    lastScrollY.current =
      scrollEl === window ? window.scrollY : scrollEl.scrollTop;

    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    };

    const target = scrollEl === window ? window : scrollEl;
    target.addEventListener("scroll", handler, { passive: true });
    return () => target.removeEventListener("scroll", handler);
  }, [onScroll]);

  const handleClick = () => {
    if (wasDraggedRef.current) {
      wasDraggedRef.current = false;
      return;
    }
    if (children) {
      setSheetOpen(true);
    } else if (onClick) {
      onClick();
    }
  };

  return createPortal(
    <>
      <button
        ref={fabRef}
        className={`${classes.fab} ${collapsed ? classes.collapsed : ""} ${dragging ? classes.dragging : ""}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        style={
          pos
            ? { insetInlineEnd: `${pos.x}px`, bottom: `${pos.y}px` }
            : undefined
        }
        aria-label={label}
      >
        <span className={classes.fabIcon}>{icon}</span>
        {label && <span className={classes.fabLabel}>{label}</span>}
      </button>

      {children && (
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={sheetTitle || label}
        >
          <div onClick={() => setSheetOpen(false)}>{children}</div>
        </BottomSheet>
      )}
    </>,
    document.body,
  );
}

export default Fab;
