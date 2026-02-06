import React, { useState } from "react";
import { generateRecipeImage } from "../generateRecipeImage";
import classes from "./export-image-button.module.css";

function ExportImageButton({ recipe }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await generateRecipeImage(recipe);
    } catch (err) {
      console.error("Failed to generate recipe image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      className={classes.exportButton}
      onClick={handleExport}
      disabled={isGenerating}
      title="Export as image"
    >
      {isGenerating ? (
        <span className={classes.spinner} />
      ) : (
        <span className={classes.icon}>📸</span>
      )}
      <span className={classes.label}>
        {isGenerating ? "Generating..." : "Export Image"}
      </span>
    </button>
  );
}

export default ExportImageButton;
