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
import { useRecipeBook } from "../../context";

import { scrollToTop } from "../utils";

function Recipes() {
  const {
    recipes,
    categories,
    addRecipe,
    editRecipe,
    deleteRecipe,
    clearAllRecipes,
    isAdmin,
  } = useRecipeBook();

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
    <div className={classes.contactsContainer}>
      <div className={classes.headerContainer}>
        <p className={pageClasses.title}>Recipes</p>
        <div className={classes.headerButtons}>
          <FavoritesButton
            onClick={() => setShowFavorites(true)}
            title="View favorite recipes"
          >
            ★ Favorites
          </FavoritesButton>
          {isAdmin && (
            <Button
              variant="danger"
              onClick={handleClearAllClick}
              disabled={recipes.length === 0}
              className={recipes.length === 0 ? classes.disabledButton : ""}
              title="Remove all recipes"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className={pageClasses.actions}>
          <AddButton
            onClick={() => setShowAddPerson(true)}
            title="Add New Recipe"
          >
            +
          </AddButton>
        </div>
      )}

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
          isAdmin={isAdmin}
        />
      )}

      {showConfirmClear && (
        <ConfirmDialog
          title="Clear All Recipes"
          message="Are you sure you want to delete all recipes? This action cannot be undone."
          onConfirm={handleConfirmClear}
          onCancel={handleCancelClear}
          confirmText="Clear All"
          cancelText="Cancel"
        />
      )}

      <RecipesView
        persons={recipes}
        groups={categories}
        onEditPerson={editRecipe}
        onDeletePerson={deleteRecipe}
        isAdmin={isAdmin}
      />

      <UpButton onClick={scrollToTop} title="Scroll to top">
        <PiArrowFatLineUp />
      </UpButton>
    </div>
  );
}

export default Recipes;
