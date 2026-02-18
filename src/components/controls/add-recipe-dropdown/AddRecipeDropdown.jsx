import { useState, useRef, useEffect } from "react";
import { FiLink, FiCamera } from "react-icons/fi";
import { BsClipboardData } from "react-icons/bs";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { PiPencilSimpleLineLight } from "react-icons/pi";
import { PiMicrophoneLight } from "react-icons/pi";
import { useLanguage } from "../../../context";
import { AddButton } from "../add-button";
import { GalleryIcon } from "../../icons/GalleryIcon";
import classes from "./add-recipe-dropdown.module.css";

function AddRecipeDropdown({ onSelect, buttonType = "circle", children }) {
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
              {/* <FiCamera /> */}

              <GalleryIcon width={20} height={20} />
              {/* <img src={photo} alt="" /> */}
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
              <FiLink />
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
              <BsClipboardData />
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
              <PiMicrophoneLight size="1.2em" />
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
              <PiPencilSimpleLineLight />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AddRecipeDropdown;
