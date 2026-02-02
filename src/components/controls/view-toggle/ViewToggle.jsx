import { useState } from "react";
import classes from "./view-toggle.module.css";

function ViewToggle({ activeView, onViewChange }) {
  return (
    <div className={classes.toggleContainer}>
      <button
        className={`${classes.toggleButton} ${activeView === "chat" ? classes.active : ""}`}
        onClick={() => onViewChange("chat")}
      >
        Chat
      </button>
      <button
        className={`${classes.toggleButton} ${activeView === "recipes" ? classes.active : ""}`}
        onClick={() => onViewChange("recipes")}
      >
        Recipes
      </button>
    </div>
  );
}

export default ViewToggle;
