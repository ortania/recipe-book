import React, { useState, useEffect } from "react";
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
    addRecipe,
    editRecipe,
    deleteRecipe,
    copyRecipeToUser,
    currentUser,
    setRecipes,
  } = useRecipeBook();

  const contextRecipe = recipes.find((r) => r.id === id);
  const [localRecipe, setLocalRecipe] = useState(null);

  // Use localRecipe override if set, otherwise use context recipe
  const recipe = localRecipe || contextRecipe;

  // Clear local override when context catches up
  useEffect(() => {
    if (
      localRecipe &&
      contextRecipe &&
      JSON.stringify(contextRecipe.nutrition) ===
        JSON.stringify(localRecipe.nutrition)
    ) {
      setLocalRecipe(null);
    }
  }, [contextRecipe, localRecipe]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Track recently viewed recipes
  React.useEffect(() => {
    if (!recipe || !recipe.id) return;
    try {
      const key = "recentlyViewedRecipes";
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = stored.filter((rid) => rid !== recipe.id);
      filtered.unshift(recipe.id);
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, 10)));
    } catch (e) {
      /* ignore */
    }
  }, [recipe?.id]);

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
  };

  const handleSaveEdit = async (updatedPerson) => {
    // Set local override immediately so view updates right away
    setLocalRecipe({ ...updatedPerson });
    setEditingRecipe(null);
    try {
      await editRecipe(updatedPerson);
    } catch (err) {
      console.error("Failed to save recipe:", err);
    }
  };

  const handleToggleFavorite = (rec) => {
    editRecipe({ ...rec, isFavorite: !rec.isFavorite });
  };

  const handleDuplicate = async () => {
    if (!recipe) return;
    const duplicated = {
      name: `${recipe.name} (${t("recipes", "copy")})`,
      ingredients: [...(recipe.ingredients || [])],
      instructions: [...(recipe.instructions || [])],
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      sourceUrl: recipe.sourceUrl,
      image_src: recipe.image_src,
      categories: [...(recipe.categories || [])],
      isFavorite: false,
      notes: recipe.notes,
      rating: recipe.rating || 0,
      nutrition: recipe.nutrition ? { ...recipe.nutrition } : null,
    };
    try {
      const added = await addRecipe(duplicated);
      if (added && added.id) {
        navigate(`/recipe/${added.id}`);
      }
    } catch (err) {
      console.error("Failed to duplicate recipe:", err);
    }
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
      <RecipeDetailsFull
        recipe={
          language === "he" || language === "mixed" ? recipe : translatedRecipe
        }
        originalRecipe={recipe}
        isTranslating={isTranslating}
        onClose={handleClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onSaveRecipe={editRecipe}
        getCategoryName={getCategoryName}
        onEnterCookingMode={handleCookingModeToggle}
        onCopyRecipe={(recipe, targetUserId) =>
          copyRecipeToUser(recipe, targetUserId, language)
        }
        currentUserId={currentUser?.uid}
        onToggleFavorite={handleToggleFavorite}
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
