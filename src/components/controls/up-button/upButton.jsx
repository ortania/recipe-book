import React, { useState, useEffect } from "react";
import classes from "./up-button.module.css";

function UpButton({ onClick, title, children }) {
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const hasTouchScreen =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;


    if (isMobileDevice || hasTouchScreen) {
    // if (false) {
      setShowButton(false);
    }
  }, []);

  if (!showButton) {
    return null;
  }

  return (
    <button
      className={classes.upButton}
      onClick={onClick}
      type="button"
      title={title}
    >
      {children}
    </button>
  );
}

export default UpButton;
