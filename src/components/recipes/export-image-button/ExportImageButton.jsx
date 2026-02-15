import React, { useState } from "react";
import { generateRecipeImage } from "../generateRecipeImage";
import classes from "./export-image-button.module.css";
import { useLanguage } from "../../../context";
import { FiCamera } from "react-icons/fi";

function ExportImageButton({ recipe, asMenuItem = false }) {
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await generateRecipeImage(recipe, t);
    } catch (err) {
      console.error("Failed to generate recipe image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (asMenuItem) {
    return (
      <button
        className={classes.menuItem}
        onClick={handleExport}
        disabled={isGenerating}
      >
        <span className={classes.menuItemLabel}>
          {isGenerating
            ? t("recipes", "generating")
            : t("recipes", "exportToImage")}
        </span>
        <span className={classes.menuItemIcon}>
          {isGenerating ? <span className={classes.spinner} /> : <FiCamera />}
        </span>
      </button>
    );
  }

  return (
    <button
      className={classes.exportButton}
      onClick={handleExport}
      disabled={isGenerating}
      title={t("recipes", "exportAsImage")}
    >
      {isGenerating ? (
        <span className={classes.spinner} />
      ) : (
        <FiCamera size={18} />
      )}
      <span className={classes.label}>
        {isGenerating
          ? t("recipes", "generating")
          : t("recipes", "exportToImage")}
      </span>
    </button>
  );
}

export default ExportImageButton;
