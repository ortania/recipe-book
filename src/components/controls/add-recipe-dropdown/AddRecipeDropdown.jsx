import { useState, useRef, useEffect } from "react";
import { FiLink, FiCamera } from "react-icons/fi";
import { BsClipboardData } from "react-icons/bs";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { useLanguage } from "../../../context";
import { AddButton } from "../add-button";
import classes from "./add-recipe-dropdown.module.css";

function AddRecipeDropdown({ onSelect, buttonType = "circle", children }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
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
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
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
          title="Add New Recipe"
        />
      )}
      {open && (
        <div className={classes.dropdown}>
          <button
            className={classes.dropdownItem}
            onClick={() => handleClick("url")}
          >
            <span className={classes.dropdownIcon}>
              <FiLink />
            </span>
            {t("addWizard", "fromUrl")}
          </button>
          <button
            className={classes.dropdownItem}
            onClick={() => handleClick("text")}
          >
            <span className={classes.dropdownIcon}>
              <BsClipboardData />
            </span>
            {t("addWizard", "fromText")}
          </button>
          <button
            className={classes.dropdownItem}
            onClick={() => handleClick("photo")}
          >
            <span className={classes.dropdownIcon}>
              <FiCamera />
            </span>
            {t("addWizard", "fromPhoto")}
          </button>
          <button
            className={classes.dropdownItem}
            onClick={() => handleClick("manual")}
          >
            <span className={classes.dropdownIcon}>
              <HiOutlinePencilSquare />
            </span>
            {t("addWizard", "manual")}
          </button>
        </div>
      )}
    </div>
  );
}

export default AddRecipeDropdown;
