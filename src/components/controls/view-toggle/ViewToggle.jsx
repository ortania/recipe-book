import { useRef, useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../../context";
import classes from "./view-toggle.module.css";

function ViewToggle({ activeView, onViewChange, recipesLabel, chatLabel }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const chatRef = useRef(null);
  const recipesRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const btn = activeView === "chat" ? chatRef.current : recipesRef.current;
    const container = containerRef.current;
    if (!btn || !container) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setIndicator({
      left: bRect.left - cRect.left,
      width: bRect.width,
    });
  }, [activeView]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  return (
    <div className={classes.toggleContainer} ref={containerRef}>
      <div
        className={classes.indicator}
        style={{
          left: indicator.left,
          width: indicator.width,
        }}
      />
      <button
        ref={chatRef}
        className={`${classes.toggleButton} ${activeView === "chat" ? classes.active : ""}`}
        onClick={() => onViewChange("chat")}
      >
        {chatLabel || t("recipesView", "chat")}
      </button>
      <button
        ref={recipesRef}
        className={`${classes.toggleButton} ${activeView === "recipes" ? classes.active : ""}`}
        onClick={() => onViewChange("recipes")}
      >
        {recipesLabel || t("recipesView", "recipesTab")}
      </button>
    </div>
  );
}

export default ViewToggle;
