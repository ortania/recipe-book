import { useState, useRef, useEffect } from "react";
import { Link, ClipboardList, FilePenLine, Mic, ImagePlus } from "lucide-react";
import { useLanguage } from "../../../context";
import { AddButton } from "../add-button";
import classes from "./add-recipe-dropdown.module.css";

function AddRecipeDropdown({
  onSelect,
  buttonType = "circlePrimary",
  children,
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);
  const isTouchRef = useRef(false);

  const handleMouseEnter = () => {
    if (isTouchRef.current) return;
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (isTouchRef.current) return;
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  const handleClick = (method) => {
    setOpen(false);
    onSelect(method);
  };

  const toggleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    const markTouch = () => {
      isTouchRef.current = true;
    };
    const markMouse = (e) => {
      if (e.pointerType === "mouse") isTouchRef.current = false;
    };
    window.addEventListener("touchstart", markTouch, { passive: true });
    window.addEventListener("pointerdown", markMouse);
    return () => {
      window.removeEventListener("touchstart", markTouch);
      window.removeEventListener("pointerdown", markMouse);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={classes.wrapper}
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children ? (
        <button
          type="button"
          className={classes.triggerBtn}
          onClick={toggleOpen}
        >
          {children}
        </button>
      ) : (
        <AddButton
          type={buttonType}
          sign="+"
          onClick={toggleOpen}
          title={t("recipesView", "addNewRecipe")}
        />
      )}
      {open && (
        <div className={classes.dropdown}>
          <button
            className={classes.dropdownItem}
            onClick={() => handleClick("photo")}
          >
            <span className={classes.dropdownLabel}>
              {t("addWizard", "fromPhoto")}
            </span>
            <span className={classes.dropdownIcon}>
              <ImagePlus size={20} />
            </span>
          </button>
          <button
            className={classes.dropdownItem}
            onClick={() => handleClick("url")}
          >
            <span className={classes.dropdownLabel}>
              {t("addWizard", "fromUrl")}
            </span>
            <span className={classes.dropdownIcon}>
              <Link size={20} />
            </span>
          </button>
          <button
            className={classes.dropdownItem}
            onClick={() => handleClick("text")}
          >
            <span className={classes.dropdownLabel}>
              {t("addWizard", "fromText")}
            </span>
            <span className={classes.dropdownIcon}>
              <ClipboardList size={20} />
            </span>
          </button>
          <button
            className={classes.dropdownItem}
            onClick={() => handleClick("recording")}
          >
            <span className={classes.dropdownLabel}>
              {t("addWizard", "fromRecording")}
            </span>
            <span className={classes.dropdownIcon}>
              <Mic size={20} />
            </span>
          </button>
          <button
            className={classes.dropdownItem}
            onClick={() => handleClick("manual")}
          >
            <span className={classes.dropdownLabel}>
              {t("addWizard", "manual")}
            </span>
            <span className={classes.dropdownIcon}>
              <FilePenLine size={20} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AddRecipeDropdown;
