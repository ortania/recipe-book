import { useState, useEffect, useRef } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { useLanguage } from "../../../context";
import { SortDropdown } from "../sort-dropdown";
import { BottomSheet } from "../bottom-sheet";
import { CloseButton } from "../close-button";
import classes from "./sort-button.module.css";

const MOBILE_BREAKPOINT = 768;

function SortButton({ sortField, sortDirection, onSortChange, options }) {
  const { t } = useLanguage();
  const sortRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) return;
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calcDropdownPos = () => {
    if (!sortRef.current) return {};
    if (window.innerWidth <= MOBILE_BREAKPOINT) return {};
    const rect = sortRef.current.getBoundingClientRect();
    const isRtl = document.documentElement.dir === "rtl";
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuWidth = 260;
    const pad = 8;
    const style = { top: rect.bottom + 4 };

    if (isRtl) {
      let right = vw - rect.right;
      if (right < pad) right = pad;
      if (right + menuWidth > vw - pad) right = vw - menuWidth - pad;
      style.right = right;
    } else {
      let left = rect.left;
      if (left < pad) left = pad;
      if (left + menuWidth > vw - pad) left = vw - menuWidth - pad;
      style.left = left;
    }

    const spaceBelow = vh - rect.bottom - 16;
    style.maxHeight = Math.min(spaceBelow, vh * 0.7);
    return style;
  };

  const toggleMenu = () => {
    setShowMenu((prev) => {
      if (!prev) setMenuStyle(calcDropdownPos());
      return !prev;
    });
  };

  return (
    <div className={classes.container} ref={sortRef}>
      <button className={classes.trigger} onClick={toggleMenu}>
        <ArrowUpDown size={16} />
        <span className={classes.hideOnMobile}>
          {t("recipesView", "sorting")}
        </span>
        <span className={classes.arrow}>
          <ChevronDown size={16} />
        </span>
      </button>

      {!isMobile && showMenu && (
        <>
          <div
            className={classes.dropdownOverlay}
            onClick={() => setShowMenu(false)}
          />
          <div className={classes.dropdownMenu} style={menuStyle}>
            <div className={classes.dropdownClose}>
              <CloseButton onClick={() => setShowMenu(false)} />
            </div>
            <SortDropdown
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
              options={options}
            />
          </div>
        </>
      )}

      {isMobile && (
        <BottomSheet
          open={showMenu}
          onClose={() => setShowMenu(false)}
          title={t("recipesView", "sorting")}
        >
          <SortDropdown
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            options={options}
          />
        </BottomSheet>
      )}
    </div>
  );
}

export default SortButton;
