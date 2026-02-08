import { useState } from "react";
import { PiArrowFatLineUp } from "react-icons/pi";
import classes from "./recipes.module.css";
import pageClasses from "../page.module.css";
import {
  RecipesView,
  AddRecipe,
  UpButton,
  FavoritesButton,
  Button,
  AddButton,
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
            title="View favorite recipes"
          >
            {t("recipes", "favorite")}
          </FavoritesButton>
          <Button
            variant="danger"
            onClick={handleClearAllClick}
            disabled={recipes.length === 0}
            className={recipes.length === 0 ? classes.disabledButton : ""}
            title="Remove all recipes"
          >
            {t("recipes", "clearAll")}
          </Button>
        </div>
      </div>

      <div className={pageClasses.actions}>
        <AddButton
          onClick={() => setShowAddPerson(true)}
          title="Add New Recipe"
        >
          +
        </AddButton>
      </div>

      {showAddPerson && (
        <AddRecipe
          onAddPerson={addRecipe}
          onCancel={() => setShowAddPerson(false)}
          onEditPerson={editRecipe}
          groups={categories}
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

      <UpButton onClick={scrollToTop} title="Scroll to top">
        <PiArrowFatLineUp />
      </UpButton>
    </div>
  );
}

export default Recipes;
