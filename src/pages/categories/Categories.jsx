import { useState, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

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
  const [showChat, setShowChat] = useState(false);
  const [showGreetingOnce, setShowGreetingOnce] = useState(() => {
    return sessionStorage.getItem("justLoggedIn") === "true";
  });
  const [showTour, setShowTour] = useState(() => {
    return !localStorage.getItem("tourCompleted");
  });

  useEffect(() => {
    if (showGreetingOnce) {
      sessionStorage.removeItem("justLoggedIn");
      const timer = setTimeout(() => setShowGreetingOnce(false), 20000);
      return () => clearTimeout(timer);
    }
  }, [showGreetingOnce]);

  const handleCloseTour = () => {
    setShowTour(false);
    localStorage.setItem("tourCompleted", "true");
  };

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
      <AnimatePresence>
        {showTour && <ProductTour onClose={handleCloseTour} />}
      </AnimatePresence>

      {showAddPerson && (
        <AddRecipeWizard
          onAddPerson={addRecipe}
          onCancel={(lastScreen) => {
            setShowAddPerson(false);
            if (lastScreen) setAddMethod(lastScreen);
          }}
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
        selectedGroup={isAllSelected ? "all" : selectedCategories}
        showGreeting={showGreetingOnce}
      />

      {showChat && (
        <ChatWindow recipeContext={filteredRecipes} showImageButton />
      )}

      <UpButton onClick={scrollToTop} title={t("common", "scrollToTop")}>
        <PiArrowFatLineUp />
      </UpButton>
    </div>
  );
}

export default Categories;
