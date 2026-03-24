import React from "react";
import { useEditRecipe } from "../EditRecipeContext";

export default function DeleteTab() {
  const { classes, t } = useEditRecipe();

  return (
    <div className={classes.deleteSection}>
      <h3 className={classes.sectionTitle}>{t("confirm", "deleteRecipe")}</h3>
      <p style={{ color: "#888", marginBottom: "1.5rem" }}>
        {t("confirm", "deleteRecipeMsg")} {t("confirm", "cannotUndo")}
      </p>
    </div>
  );
}
