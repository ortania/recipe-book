import { useState } from "react";
import { PiArrowFatLineUp } from "react-icons/pi";
import classes from "./recipes.module.css";
import pageClasses from "../page.module.css";
import {
  RecipesView,
  AddRecipeWizard,
  UpButton,
  FavoritesButton,
  Button,
  AddRecipeDropdown,
  FavoritesPopup,
  ConfirmDialog,
} from "../../components";
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

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [addMethod, setAddMethod] = useState("method");
  const [showFavorites, setShowFavorites] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

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
          <FavoritesButton
            onClick={() => setShowFavorites(true)}
            title={t("recipes", "favorite")}
          >
            {t("recipes", "favorite")}
          </FavoritesButton>
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
            setShowAddPerson(true);
          }}
        />
      </div>

      {showAddPerson && (
        <AddRecipeWizard
          onAddPerson={addRecipe}
          onCancel={(lastScreen) => {
            setShowAddPerson(false);
            if (lastScreen) setAddMethod(lastScreen);
          }}
          groups={categories}
          initialScreen={addMethod}
        />
      )}

      {showFavorites && (
        <FavoritesPopup
          persons={recipes}
          groups={categories}
          onClose={() => setShowFavorites(false)}
          onEditPerson={editRecipe}
          onDeletePerson={deleteRecipe}
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
        persons={recipes}
        groups={categories}
        onEditPerson={editRecipe}
        onDeletePerson={deleteRecipe}
      />

      <UpButton onClick={scrollToTop} title={t("common", "scrollToTop")}>
        <PiArrowFatLineUp />
      </UpButton>
    </div>
  );
}

export default Recipes;
