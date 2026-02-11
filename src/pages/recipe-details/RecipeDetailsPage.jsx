import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import RecipeDetailsFull from "../../components/recipes/RecipeDetailsFull";
import RecipeDetailsCookingMode from "../../components/recipes/RecipeDetailsCookingMode";
import { EditRecipe } from "../../components/forms/edit-recipe";
import { useRecipeBook } from "../../context/RecipesBookContext";
import { useLanguage } from "../../context";
import useTranslatedRecipe from "../../hooks/useTranslatedRecipe";
import useTranslatedList from "../../hooks/useTranslatedList";
import classes from "./recipe-details-page.module.css";

function RecipeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const {
    recipes,
    categories,
    editRecipe,
    deleteRecipe,
    copyRecipeToUser,
    currentUser,
  } = useRecipeBook();

  const recipe = recipes.find((r) => r.id === id);
  const { translated: translatedRecipe, isTranslating } =
    useTranslatedRecipe(recipe);
  const { getTranslated: getTranslatedGroup } = useTranslatedList(
    categories,
    "name",
  );

  const [cookingMode, setCookingMode] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  // Refs for cooking mode
  const handleNextStepRef = React.useRef();
  const handlePrevStepRef = React.useRef();
  const wakeLockRef = React.useRef(null);
  const cookingModeActiveTabRef = React.useRef("ingredients");
  const cookingModeSetActiveTabRef = React.useRef(null);
  const cookingModeCurrentStepRef = React.useRef(0);
  const cookingModeIngredientsLengthRef = React.useRef(0);
  const cookingModeSetCurrentStepRef = React.useRef(null);
  const cookingModeSetShowCompletionRef = React.useRef(null);
  const cookingModeShowCompletionRef = React.useRef(false);

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const toggleVoiceRecognition = () => {
    setVoiceEnabled((prev) => !prev);
  };

  // Wake Lock for cooking mode
  React.useEffect(() => {
    if (!cookingMode) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
      return;
    }

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch (err) {
        console.error("Wake lock error:", err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
    };
  }, [cookingMode]);

  if (!recipe) {
    return (
      <div className={classes.pageContainer}>
        <div className={classes.notFound}>
          <p>{t("common", "notFound") || "Recipe not found"}</p>
          <button
            className={classes.backButton}
            onClick={() => navigate("/categories")}
          >
            <IoArrowBack />
            {t("common", "back") || "Back"}
          </button>
        </div>
      </div>
    );
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find((g) => g.id === categoryId);
    return category ? getTranslatedGroup(category) : null;
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleEdit = (recipeToEdit) => {
    setEditingRecipe(recipeToEdit || recipe);
  };

  const handleDelete = async (recipeId) => {
    await deleteRecipe(recipeId);
    navigate("/categories");
  };

  const handleSaveEdit = (updatedPerson) => {
    editRecipe(updatedPerson);
    setEditingRecipe(null);
  };

  const handleCookingModeToggle = () => {
    setCookingMode((prev) => !prev);
  };

  if (cookingMode) {
    return (
      <RecipeDetailsCookingMode
        recipe={translatedRecipe}
        onClose={handleCookingModeToggle}
        onExitCookingMode={handleCookingModeToggle}
        isListening={isListening}
        voiceEnabled={voiceEnabled}
        onToggleVoice={toggleVoiceRecognition}
        onStepHandlersReady={(
          nextRef,
          prevRef,
          activeTabValue,
          setActiveTabFunc,
          currentStepValue,
          ingredientsLength,
          setCurrentStepFunc,
          setShowCompletionFunc,
          showCompletionValue,
        ) => {
          handleNextStepRef.current = nextRef.current;
          handlePrevStepRef.current = prevRef.current;
          cookingModeActiveTabRef.current = activeTabValue;
          cookingModeSetActiveTabRef.current = setActiveTabFunc;
          cookingModeCurrentStepRef.current = currentStepValue;
          cookingModeIngredientsLengthRef.current = ingredientsLength;
          cookingModeSetCurrentStepRef.current = setCurrentStepFunc;
          cookingModeSetShowCompletionRef.current = setShowCompletionFunc;
          cookingModeShowCompletionRef.current = showCompletionValue;
        }}
      />
    );
  }

  return (
    <div className={classes.pageContainer}>
      {/* <button className={classes.backButton} onClick={handleClose}>
        <IoArrowBack />
        {t("common", "back") || "Back"}
      </button> */}

      <RecipeDetailsFull
        recipe={translatedRecipe}
        originalRecipe={recipe}
        isTranslating={isTranslating}
        onClose={handleClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getCategoryName={getCategoryName}
        onEnterCookingMode={handleCookingModeToggle}
        onCopyRecipe={copyRecipeToUser}
        currentUserId={currentUser?.uid}
      />

      {editingRecipe && (
        <EditRecipe
          person={editingRecipe}
          onSave={handleSaveEdit}
          onCancel={() => setEditingRecipe(null)}
          groups={categories}
        />
      )}
    </div>
  );
}

export default RecipeDetailsPage;
