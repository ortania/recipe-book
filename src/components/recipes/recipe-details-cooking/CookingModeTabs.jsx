import { List, ListOrdered, Users } from "lucide-react";
import { useCookingMode } from "./CookingModeContext";

export default function CookingModeTabs() {
  const {
    activeTab, switchTab, servings, voiceEnabled,
    currentStep, cookingIngredients, classes, t,
  } = useCookingMode();

  return (
    <div className={classes.subHeader}>
      <div className={classes.tabs}>
        <button
          className={`${classes.tab} ${activeTab === "ingredients" ? classes.activeTab : ""}`}
          onClick={() => switchTab("ingredients")}
        >
          <List className={classes.tabIcon} size={18} />
          {t("recipes", "ingredients")}
          {servings && (
            <span className={classes.headerServings}>
              (<Users size={14} />
              <span className={classes.headerServingsCount}>{servings}</span>)
            </span>
          )}
          {activeTab === "ingredients" &&
            voiceEnabled &&
            currentStep >= cookingIngredients.length - 1 && (
              <span className={classes.voiceHint}> (Say "Start" to begin cooking)</span>
            )}
        </button>
        <button
          className={`${classes.tab} ${activeTab === "instructions" ? classes.activeTab : ""}`}
          onClick={() => switchTab("instructions")}
        >
          <ListOrdered className={classes.tabIcon} size={18} />
          {t("recipes", "instructions")}
        </button>
      </div>
    </div>
  );
}
