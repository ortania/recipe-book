import { useState, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { CircleCheck } from "lucide-react";
import { Toast } from "../../components/controls";

import {
  RecipesView,
  AddRecipeWizard,
  UpButton,
  ConfirmDialog,
  ChatWindow,
  ProductTour,
} from "../../components";
import { PiArrowFatLineUp } from "react-icons/pi";
import { useRecipeBook, useLanguage } from "../../context";
import useScrollRestore from "../../hooks/useScrollRestore";

import { scrollToTop } from "../utils";

import classes from "./categories.module.css";

function Categories() {
  useScrollRestore("categories");
  const {
    categories,
    recipes,
    recipesLoaded,
    selectedCategories,
    addRecipe,
    editRecipe,
    deleteRecipe,
    clearCategoryRecipes,
  } = useRecipeBook();
  const { t } = useLanguage();

  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [addMethod, setAddMethod] = useState("method");
  const [showChat, setShowChat] = useState(false);
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const handleSaveToastClose = useCallback(() => {
    setSaveToastOpen(false);
    setShowAddRecipe(false);
  }, []);
  const [showTour, setShowTour] = useState(() => {
    return !localStorage.getItem("tourCompleted");
  });

  const handleCloseTour = () => {
    setShowTour(false);
    localStorage.setItem("tourCompleted", "true");
  };

  const isAllSelected = selectedCategories.includes("all");

  const filteredRecipes = useMemo(() => {
    if (isAllSelected) return recipes;
    const includesGeneral = selectedCategories.includes("general");
    return recipes.filter((recipe) => {
      if (includesGeneral) {
        const uncategorized =
          !recipe.categories || recipe.categories.length === 0;
        const inGeneral =
          recipe.categories && recipe.categories.includes("general");
        if (uncategorized || inGeneral) return true;
      }
      return (
        recipe.categories &&
        recipe.categories.some((catId) => selectedCategories.includes(catId))
      );
    });
  }, [recipes, selectedCategories, isAllSelected]);

  const defaultGroup = isAllSelected ? null : selectedCategories[0];

  return (
    <div className={classes.groupContent} dir="auto">
      <AnimatePresence>
        {showTour && <ProductTour onClose={handleCloseTour} />}
      </AnimatePresence>

      {showAddRecipe && (
        <AddRecipeWizard
          onAddRecipe={addRecipe}
          onCancel={(lastScreen) => {
            setShowAddRecipe(false);
            if (lastScreen) setAddMethod(lastScreen);
          }}
          onSaved={() => setSaveToastOpen(true)}
          defaultGroup={defaultGroup}
          groups={categories}
          initialScreen={addMethod}
        />
      )}

      <RecipesView
        recipes={filteredRecipes}
        groups={categories}
        onEditRecipe={editRecipe}
        onDeleteRecipe={deleteRecipe}
        onAddRecipe={(method) => {
          setAddMethod(method || "method");
          setShowAddRecipe(true);
        }}
        selectedGroup={isAllSelected ? "all" : selectedCategories}
        showGreeting={true}
        sortStorageKey="categoriesSortPreference"
        hideRating
        loading={!recipesLoaded}
      />

      {showChat && (
        <ChatWindow recipeContext={filteredRecipes} showImageButton />
      )}

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

export default Categories;
