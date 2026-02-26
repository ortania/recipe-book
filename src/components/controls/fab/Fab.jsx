import { useState, useRef, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { BottomSheet } from "../bottom-sheet";
import classes from "./fab.module.css";

const SCROLL_THRESHOLD = 20;
const STROKE = 1.5;

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
  const fabRef = useRef(null);
  const lastScrollY = useRef(0);
  const scrollParentRef = useRef(null);

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
    if (children) {
      setSheetOpen(true);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <button
        ref={fabRef}
        className={`${classes.fab} ${collapsed ? classes.collapsed : ""}`}
        onClick={handleClick}
        aria-label={label}
      >
        <span className={classes.fabIcon}>{icon}</span>
        {label && (
          <span className={classes.fabLabel}>{label}</span>
        )}
      </button>

      {children && (
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={sheetTitle || label}
        >
          <div onClick={() => setSheetOpen(false)}>
            {children}
          </div>
        </BottomSheet>
      )}
    </>
  );
}

export default Fab;
