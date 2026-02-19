import { useState } from "react";
import { useLanguage } from "../../../context";
import classes from "./view-toggle.module.css";

function ViewToggle({ activeView, onViewChange, recipesLabel }) {
  const { t } = useLanguage();
  return (
    <div className={classes.toggleContainer}>
      <button
        className={`${classes.toggleButton} ${activeView === "chat" ? classes.active : ""}`}
        onClick={() => onViewChange("chat")}
      >
        {t("recipesView", "chat")}
      </button>
      <button
        className={`${classes.toggleButton} ${activeView === "recipes" ? classes.active : ""}`}
        onClick={() => onViewChange("recipes")}
      >
        {recipesLabel || t("recipesView", "recipesTab")}
      </button>
    </div>
  );
}

export default ViewToggle;
