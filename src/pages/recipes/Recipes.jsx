import { useState, useCallback } from "react";
import { PiArrowFatLineUp } from "react-icons/pi";
import { CircleCheck } from "lucide-react";
import classes from "./recipes.module.css";
import pageClasses from "../page.module.css";
import {
  RecipesView,
  AddRecipeWizard,
  UpButton,
  Button,
  AddRecipeDropdown,
  ConfirmDialog,
} from "../../components";
import { Toast } from "../../components/controls";
import { useRecipeBook, useLanguage } from "../../context";

import { scrollToTop } from "../utils";

function Recipes() {
  const {
    recipes,
    categories,
    addRecipe,
    editRecipe,
    deleteRecipe,
    clearAllRecipes,
  } = useRecipeBook();
  const { t } = useLanguage();

  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [addMethod, setAddMethod] = useState("method");
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const handleSaveToastClose = useCallback(() => setSaveToastOpen(false), []);

  const handleClearAllClick = () => {
    setShowConfirmClear(true);
  };

  const handleConfirmClear = () => {
    clearAllRecipes();
    setShowConfirmClear(false);
  };

  const handleCancelClear = () => {
    setShowConfirmClear(false);
  };

  return (
    <div className={classes.recipesContainer}>
      <div className={classes.headerContainer}>
        <p className={pageClasses.title}>{t("recipesView", "recipesTab")}</p>
        <div className={classes.headerButtons}>
          <Button
            variant="danger"
            onClick={handleClearAllClick}
            disabled={recipes.length === 0}
            className={recipes.length === 0 ? classes.disabledButton : ""}
            title={t("recipes", "clearAll")}
          >
            {t("recipes", "clearAll")}
          </Button>
        </div>
      </div>

      <div className={pageClasses.actions}>
        <AddRecipeDropdown
          onSelect={(method) => {
            setAddMethod(method || "method");
            setShowAddRecipe(true);
          }}
        />
      </div>

      {showAddRecipe && (
        <AddRecipeWizard
          onAddRecipe={addRecipe}
          onCancel={(lastScreen) => {
            setShowAddRecipe(false);
            if (lastScreen) setAddMethod(lastScreen);
          }}
          onSaved={() => setSaveToastOpen(true)}
          groups={categories}
          initialScreen={addMethod}
        />
      )}

      {showConfirmClear && (
        <ConfirmDialog
          title={t("recipes", "clearAllRecipes")}
          message={t("recipes", "clearAllMsg")}
          onConfirm={handleConfirmClear}
          onCancel={handleCancelClear}
          confirmText={t("recipes", "clearAll")}
          cancelText={t("common", "cancel")}
        />
      )}

      <RecipesView
        recipes={recipes}
        groups={categories}
        onEditRecipe={editRecipe}
        onDeleteRecipe={deleteRecipe}
        sortStorageKey="myRecipesSortPreference"
        hideRating
      />

      <UpButton onClick={scrollToTop} title={t("common", "scrollToTop")}>
        <PiArrowFatLineUp />
      </UpButton>

      <Toast open={saveToastOpen} onClose={handleSaveToastClose} variant="success">
        <CircleCheck size={18} aria-hidden />
        <span>{t("recipes", "saved")}</span>
      </Toast>
    </div>
  );
}

export default Recipes;
