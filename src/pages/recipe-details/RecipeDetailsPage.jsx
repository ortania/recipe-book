import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import RecipeDetailsFull from "../../components/recipes/RecipeDetailsFull";
import RecipeDetailsCookingMode from "../../components/recipes/RecipeDetailsCookingMode";
import { EditRecipe } from "../../components/forms/edit-recipe";
import { BackButton } from "../../components/controls/back-button";
import { Toast } from "../../components/controls";
import { CircleCheck } from "lucide-react";
import { useRecipeBook } from "../../context/RecipesBookContext";
import { useLanguage } from "../../context";
import { FEATURES } from "../../config/entitlements";
import useEntitlements from "../../hooks/useEntitlements";
import { PremiumFeaturePopup } from "../../components/premium-popup";
import { getRecipeById } from "../../firebase/recipeService";
import { copyRecipeToUser as copyRecipeToUserGlobal } from "../../firebase/globalRecipeService";
import { getUserRating, setUserRating } from "../../firebase/ratingService";
import useTranslatedRecipe from "../../hooks/useTranslatedRecipe";
import useTranslatedList from "../../hooks/useTranslatedList";
import classes from "./recipe-details-page.module.css";

function RecipeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromSharerProfile = location.state?.fromSharerProfile;
  const { language, t } = useLanguage();
  const { canUse, incrementUsage } = useEntitlements();
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

  const handleCategoryClick = (catId) => {
    try {
      sessionStorage.setItem("pendingCategorySelect", catId);
    } catch {}
    navigate("/categories");
  };

  useEffect(() => {
    document.body.classList.add("hide-footer");
    return () => document.body.classList.remove("hide-footer");
  }, []);

  const contextRecipe = recipes.find((r) => r.id === id);
  const [localRecipe, setLocalRecipe] = useState(null);
  const [fetchedRecipe, setFetchedRecipe] = useState(null);
  const [fetchingRemote, setFetchingRemote] = useState(false);

  const recipe = localRecipe || contextRecipe || fetchedRecipe;

  const isOwner = recipe && currentUser && recipe.userId === currentUser.uid;
  const isGlobalRecipe = recipe && !isOwner;

  const [globalUserRating, setGlobalUserRating] = useState(0);

  // Load user rating for global recipes
  useEffect(() => {
    if (!isGlobalRecipe || !currentUser || !id) return;
    getUserRating(id, currentUser.uid).then((r) => setGlobalUserRating(r));
  }, [isGlobalRecipe, currentUser, id]);

  const handleGlobalRate = async (recipeId, rating) => {
    if (!currentUser) return;
    setGlobalUserRating(rating);
    try {
      await setUserRating(recipeId, currentUser.uid, rating);
    } catch (err) {
      console.error("Failed to save rating:", err);
    }
  };

  // Fetch from Firebase if not found in context (e.g. global recipes)
  useEffect(() => {
    if (contextRecipe || !id) return;
    let cancelled = false;
    setFetchingRemote(true);
    getRecipeById(id).then((r) => {
      if (!cancelled) {
        if (r) setFetchedRecipe(r);
        setFetchingRemote(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, contextRecipe]);

  // Clear local override when context catches up with all changes
  useEffect(() => {
    if (
      localRecipe &&
      contextRecipe &&
      JSON.stringify(contextRecipe.nutrition) ===
        JSON.stringify(localRecipe.nutrition) &&
      contextRecipe.image_src === localRecipe.image_src &&
      JSON.stringify(contextRecipe.images || []) ===
        JSON.stringify(localRecipe.images || [])
    ) {
      setLocalRecipe(null);
    }
  }, [contextRecipe, localRecipe]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector("main");
    if (main) main.scrollTo(0, 0);
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

  const variations = useMemo(
    () => recipe ? recipes.filter((r) => r.parentRecipeId === recipe.id && r.id !== recipe.id) : [],
    [recipes, recipe],
  );
  const [showVariations, setShowVariations] = useState(false);

  const [cookingMode, setCookingMode] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const handleSaveToastClose = useCallback(() => {
    setSaveToastOpen(false);
    setEditingRecipe(null);
  }, []);
  const [premiumPopup, setPremiumPopup] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState("ingredients");
  const [servings, setServings] = useState(recipe?.servings || 4);

  useEffect(() => {
    setServings(recipe?.servings || 4);
  }, [recipe?.id, recipe?.servings]);

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

  const notFoundTimerRef = React.useRef(null);
  React.useEffect(() => {
    if (!recipe && !fetchingRemote) {
      notFoundTimerRef.current = setTimeout(() => navigate(-1), 2000);
    }
    return () => {
      if (notFoundTimerRef.current) clearTimeout(notFoundTimerRef.current);
    };
  }, [recipe, fetchingRemote, navigate]);

  if (!recipe) {
    if (fetchingRemote) {
      return (
        <div className={classes.pageContainer}>
          <div className={classes.notFound}>
            <p>{t("common", "loading") || "Loading..."}</p>
          </div>
        </div>
      );
    }
    return (
      <div className={classes.pageContainer}>
        <div className={classes.notFound}>
          <p>{t("common", "notFound") || "Recipe not found"}</p>
          <BackButton onClick={() => navigate(-1)} />
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

  const handleSaveEdit = async (updatedRecipe) => {
    // Set local override immediately so view updates right away
    setLocalRecipe({ ...updatedRecipe });
    try {
      await editRecipe(updatedRecipe);
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
      images: recipe.images ? [...recipe.images] : [],
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

  const handleCreateVariation = async () => {
    if (!recipe) return;
    const variationCheck = canUse(FEATURES.CREATE_VARIATION);
    if (!variationCheck.allowed) {
      setPremiumPopup(true);
      return;
    }
    const draft = {
      name: `${recipe.name} – ${t("recipes", "variationCustom")}`,
      ingredients: [...(recipe.ingredients || [])],
      instructions: [...(recipe.instructions || [])],
      prepTime: recipe.prepTime || "",
      cookTime: recipe.cookTime || "",
      servings: recipe.servings || "",
      difficulty: recipe.difficulty || "Unknown",
      sourceUrl: recipe.sourceUrl || "",
      author: recipe.author || "",
      image_src: recipe.image_src || "",
      images: recipe.images ? [...recipe.images] : [],
      categories: [...(recipe.categories || [])],
      isFavorite: false,
      notes: recipe.notes || "",
      rating: 0,
      nutrition: recipe.nutrition ? { ...recipe.nutrition } : null,
      parentRecipeId: recipe.id,
      parentRecipeName: recipe.name,
      variationType: "custom",
    };
    try {
      sessionStorage.setItem("chatRecipeDraft", JSON.stringify(draft));
    } catch (e) {
      console.error("Failed to save variation draft:", e);
    }
    await incrementUsage(FEATURES.CREATE_VARIATION);
    sessionStorage.setItem("openAddRecipe", "manual");
    navigate("/categories");
  };

  const handleCookingModeToggle = () => {
    setCookingMode((prev) => !prev);
  };

  if (cookingMode) {
    return (
      <RecipeDetailsCookingMode
        recipe={translatedRecipe}
        servings={servings}
        setServings={setServings}
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
        onEdit={isOwner ? handleEdit : undefined}
        onDelete={isOwner ? handleDelete : undefined}
        onDuplicate={isOwner ? handleDuplicate : undefined}
        onCreateVariation={isOwner ? handleCreateVariation : undefined}
        onSaveRecipe={isOwner ? editRecipe : undefined}
        getCategoryName={getCategoryName}
        onCategoryClick={handleCategoryClick}
        onEnterCookingMode={handleCookingModeToggle}
        servings={servings}
        setServings={setServings}
        onCopyRecipe={
          isOwner
            ? (recipe, targetUserId) =>
                copyRecipeToUser(recipe, targetUserId, language)
            : undefined
        }
        onCopyToMyRecipes={
          !isOwner && currentUser
            ? async (recipeId) => {
                const copied = await copyRecipeToUserGlobal(
                  recipeId,
                  currentUser.uid,
                  language,
                );
                setRecipes((prev) =>
                  prev.some((r) => r.id === copied.id)
                    ? prev
                    : [...prev, copied],
                );
              }
            : undefined
        }
        currentUserId={currentUser?.uid}
        onToggleFavorite={isOwner ? handleToggleFavorite : undefined}
        onRate={
          isGlobalRecipe && !fromSharerProfile ? handleGlobalRate : undefined
        }
        userRating={
          isGlobalRecipe && !fromSharerProfile ? globalUserRating : undefined
        }
        onActiveTabChange={setDetailActiveTab}
        hideRating={isOwner || !!fromSharerProfile}
        variations={variations}
        showVariations={showVariations}
        onShowVariations={() => setShowVariations(true)}
        onHideVariations={() => setShowVariations(false)}
      />

      {editingRecipe && (
        <EditRecipe
          recipe={editingRecipe}
          onSave={handleSaveEdit}
          onCancel={() => setEditingRecipe(null)}
          onSaved={() => setSaveToastOpen(true)}
          onDelete={isOwner ? handleDelete : undefined}
          groups={categories}
        />
      )}

      <Toast
        open={saveToastOpen}
        onClose={handleSaveToastClose}
        variant="success"
      >
        <CircleCheck size={18} aria-hidden />
        <span>{t("recipes", "saved")}</span>
      </Toast>
      <PremiumFeaturePopup
        open={premiumPopup}
        onClose={() => setPremiumPopup(false)}
        type="limit"
      />
    </div>
  );
}

export default RecipeDetailsPage;
