import { useState, useRef, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { FiLink } from "react-icons/fi";
import { BsClipboardData } from "react-icons/bs";
import { PiPencilSimpleLineLight, PiMicrophoneLight } from "react-icons/pi";
import { useLanguage } from "../../../context";
import { GalleryIcon } from "../../icons/GalleryIcon";
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

function Fab({ onSelect }) {
  const { t } = useLanguage();
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
    lastScrollY.current = scrollEl === window ? window.scrollY : scrollEl.scrollTop;

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

  const handleSelect = (method) => {
    setSheetOpen(false);
    onSelect(method);
  };

  return (
    <>
      <button
        ref={fabRef}
        className={`${classes.fab} ${collapsed ? classes.collapsed : ""}`}
        onClick={() => setSheetOpen(true)}
        aria-label={t("recipesView", "addNewRecipe")}
      >
        <span className={classes.fabIcon}>
          <Plus size="1em" strokeWidth={STROKE} />
        </span>
        <span className={classes.fabLabel}>
          {t("recipesView", "addNewRecipe")}
        </span>
      </button>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("recipesView", "addNewRecipe")}
      >
        <div className={classes.menu}>
          <button
            className={classes.menuItem}
            onClick={() => handleSelect("photo")}
          >
            <span className={classes.menuLabel}>
              {t("addWizard", "fromPhoto")}
            </span>
            <span className={classes.menuIcon}>
              <GalleryIcon width={20} height={20} />
            </span>
          </button>
          <button
            className={classes.menuItem}
            onClick={() => handleSelect("url")}
          >
            <span className={classes.menuLabel}>
              {t("addWizard", "fromUrl")}
            </span>
            <span className={classes.menuIcon}>
              <FiLink />
            </span>
          </button>
          <button
            className={classes.menuItem}
            onClick={() => handleSelect("text")}
          >
            <span className={classes.menuLabel}>
              {t("addWizard", "fromText")}
            </span>
            <span className={classes.menuIcon}>
              <BsClipboardData />
            </span>
          </button>
          <button
            className={classes.menuItem}
            onClick={() => handleSelect("recording")}
          >
            <span className={classes.menuLabel}>
              {t("addWizard", "fromRecording")}
            </span>
            <span className={classes.menuIcon}>
              <PiMicrophoneLight size="1.2em" />
            </span>
          </button>
          <button
            className={classes.menuItem}
            onClick={() => handleSelect("manual")}
          >
            <span className={classes.menuLabel}>
              {t("addWizard", "manual")}
            </span>
            <span className={classes.menuIcon}>
              <PiPencilSimpleLineLight />
            </span>
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

export default Fab;
