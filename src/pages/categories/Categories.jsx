import { useState, useMemo } from "react";

import {
  RecipesView,
  AddRecipeWizard,
  UpButton,
  FavoritesPopup,
  ConfirmDialog,
  ChatWindow,
} from "../../components";
import { PiArrowFatLineUp } from "react-icons/pi";
import { useRecipeBook, useLanguage } from "../../context";

import { scrollToTop } from "../utils";

import classes from "./categories.module.css";

function Categories() {
  const {
    categories,
    recipes,
    selectedCategories,
    addRecipe,
    editRecipe,
    deleteRecipe,
    clearCategoryRecipes,
  } = useRecipeBook();
  const { t } = useLanguage();

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [addMethod, setAddMethod] = useState("method");
  const [showFavorites, setShowFavorites] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const isAllSelected = selectedCategories.includes("all");

  const filteredRecipes = useMemo(() => {
    if (isAllSelected) return recipes;
    return recipes.filter(
      (recipe) =>
        recipe.categories &&
        recipe.categories.some((catId) => selectedCategories.includes(catId)),
    );
  }, [recipes, selectedCategories, isAllSelected]);

  const defaultGroup = isAllSelected ? null : selectedCategories[0];

  return (
    <div className={classes.groupContent} dir="auto">
      {showAddPerson && (
        <AddRecipeWizard
          onAddPerson={addRecipe}
          onCancel={() => setShowAddPerson(false)}
          defaultGroup={defaultGroup}
          groups={categories}
          initialScreen={addMethod}
        />
      )}

      <RecipesView
        persons={filteredRecipes}
        groups={categories}
        onEditPerson={editRecipe}
        onDeletePerson={deleteRecipe}
        onAddPerson={(method) => {
          setAddMethod(method || "method");
          setShowAddPerson(true);
        }}
        onShowFavorites={() => setShowFavorites(true)}
        selectedGroup={isAllSelected ? "all" : selectedCategories}
        showGreeting
      />

      {showFavorites && (
        <FavoritesPopup
          persons={filteredRecipes}
          groups={categories}
          onClose={() => setShowFavorites(false)}
          onEditPerson={editRecipe}
          onDeletePerson={deleteRecipe}
          groupName={t("categories", "allRecipes")}
        />
      )}

      {showChat && <ChatWindow recipeContext={filteredRecipes} />}

      <UpButton onClick={scrollToTop} title="Scroll to top">
        <PiArrowFatLineUp />
      </UpButton>
    </div>
  );
}

export default Categories;
