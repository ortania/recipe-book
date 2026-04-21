import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import buttonClasses from "../../styles/shared/buttons.module.css";
import _headerClasses from "./recipe-details-full/details-header.module.css";
import _imageClasses from "./recipe-details-full/details-image.module.css";
import _bodyClasses from "./recipe-details-full/details-body.module.css";
const classes = Object.assign({}, _bodyClasses, _headerClasses, _imageClasses);
import { Share } from "@capacitor/share";
import { useLanguage } from "../../context";
import { parseIngredients, scaleIngredient } from "../../utils/ingredientUtils";
import { Menu } from "lucide-react";
import { ConfirmDialog } from "../forms/confirm-dialog";
import { CopyRecipeDialog } from "../forms/copy-recipe-dialog";
import { BackButton } from "../controls/back-button";
import { useComments } from "../../hooks/useComments";

import { RecipeDetailsContext } from "./RecipeDetailsContext";
import RecipeImageSection from "./recipe-details-full/RecipeImageSection";
import RecipeActionBar from "./recipe-details-full/RecipeActionBar";
import RecipeInfoSection from "./recipe-details-full/RecipeInfoSection";
import RecipeTabsSection from "./recipe-details-full/RecipeTabsSection";
import { RecipeVariationsList } from "./recipe-variations";

function RecipeDetailsFull({
  recipe,
  originalRecipe,
  isTranslating,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onCreateVariation,
  onSaveRecipe,
  getCategoryName,
  onCategoryClick,
  onEnterCookingMode,
  onCopyRecipe,
  onCopyToMyRecipes,
  onReport,
  onBlockUser,
  currentUserId,
  onToggleFavorite,
  onRate,
  userRating = 0,
  onActiveTabChange,
  hideRating = false,
  servings,
  setServings,
  variations = [],
  showVariations = false,
  onShowVariations,
  onHideVariations,
}) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { commentCount } = useComments(recipe.id);

  const [activeTab, setActiveTabRaw] = useState("ingredients");
  const activeTabRef = useRef("ingredients");
  const tabScrollMap = useRef({});
  const switchingRef = useRef(false);
  const tabsRef = useRef(null);

  const getMain = () => document.querySelector("main");

  const setActiveTab = useCallback(
    (tab) => {
      const main = getMain();
      if (main) tabScrollMap.current[activeTabRef.current] = main.scrollTop;
      switchingRef.current = true;
      activeTabRef.current = tab;
      setActiveTabRaw(tab);
      onActiveTabChange?.(tab);
    },
    [onActiveTabChange],
  );

  useLayoutEffect(() => {
    if (!switchingRef.current) return;
    switchingRef.current = false;

    const main = getMain();
    const tabsEl = tabsRef.current;
    if (!main || !tabsEl) return;

    const stickyTop = parseInt(tabsEl.style.top, 10) || 0;
    const mainPad = parseInt(getComputedStyle(main).paddingTop, 10) || 0;
    const prevScroll = main.scrollTop;
    main.scrollTop = 0;
    const tabsNatural = tabsEl.getBoundingClientRect().top - main.getBoundingClientRect().top - mainPad;
    main.scrollTop = prevScroll;

    const minScroll = Math.max(0, tabsNatural - stickyTop);

    const saved = tabScrollMap.current[activeTab];
    if (saved != null && saved > minScroll) {
      main.scrollTop = saved;
    } else {
      main.scrollTop = minScroll;
    }
  }, [activeTab]);
  const [hoverStar, setHoverStar] = useState(0);
  const touchRef = useRef({ startX: 0, startY: 0 });

  const tabOrder = useMemo(() => {
    const tabs = ["ingredients", "instructions"];
    if (recipe.notes) tabs.push("tips");
    tabs.push("chat");
    return tabs;
  }, [recipe.notes]);

  const handleTabSwipe = (e) => {
    const diffX = e.changedTouches[0].clientX - touchRef.current.startX;
    const diffY = Math.abs(
      e.changedTouches[0].clientY - touchRef.current.startY,
    );
    if (diffY > Math.abs(diffX) || Math.abs(diffX) < 50) return;
    const isRTL = document.documentElement.dir === "rtl";
    const direction = isRTL ? -diffX : diffX;
    const currentIndex = tabOrder.indexOf(activeTab);
    if (direction < 0 && currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    } else if (direction > 0 && currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [checkedInstructions, setCheckedInstructions] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatAppliedFields, setChatAppliedFields] = useState({});
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copyToMySuccess, setCopyToMySuccess] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const allImages = useMemo(() => {
    if (recipe.images?.length > 0) return recipe.images;
    if (recipe.image_src) return [recipe.image_src];
    return [];
  }, [recipe.images, recipe.image_src]);

  const imageTouchRef = useRef({ startX: 0, startY: 0, swiping: false });
  const moreMenuRef = useRef(null);
  const stickyHeaderRef = useRef(null);
  const actionBarRef = useRef(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockToast, setWakeLockToast] = useState("");
  const wakeLockRef = useRef(null);
  const wakeLockToastTimer = useRef(null);
  const wakeLockWrapperRef = useRef(null);

  const handleCopyClick = () => {
    setShowCopyDialog(true);
  };

  const showWakeLockToast = useCallback((msg) => {
    clearTimeout(wakeLockToastTimer.current);
    setWakeLockToast(msg);
    wakeLockToastTimer.current = setTimeout(() => setWakeLockToast(""), 2500);
  }, []);

  const toggleWakeLock = useCallback(async () => {
    if (wakeLockActive) {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      setWakeLockActive(false);
      showWakeLockToast(t("recipes", "screenAutoOff"));
    } else {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          wakeLockRef.current.addEventListener("release", () => {
            wakeLockRef.current = null;
            setWakeLockActive(false);
          });
          setWakeLockActive(true);
          showWakeLockToast(t("recipes", "screenStaysOn"));
        }
      } catch (err) {
        console.error("Wake lock error:", err);
      }
    }
  }, [wakeLockActive, showWakeLockToast, t]);

  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!wakeLockToast) return;
    const handler = (e) => {
      if (
        wakeLockWrapperRef.current &&
        !wakeLockWrapperRef.current.contains(e.target)
      ) {
        clearTimeout(wakeLockToastTimer.current);
        setWakeLockToast("");
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [wakeLockToast]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    const computeStickyOffsets = () => {
      const headerEl = stickyHeaderRef.current;
      const barEl = actionBarRef.current;
      const tabsEl = tabsRef.current;
      if (!headerEl) return;

      const headerRect = headerEl.getBoundingClientRect();
      const mainEl = barEl?.closest("main");
      const mainRect = mainEl ? mainEl.getBoundingClientRect() : { top: 0 };
      const mainPad = mainEl
        ? parseInt(getComputedStyle(mainEl).paddingTop, 10) || 0
        : 0;

      const stickyTop = headerRect.bottom - mainRect.top - mainPad;

      if (barEl) barEl.style.top = `${stickyTop}px`;
      const barH = barEl ? barEl.offsetHeight : 0;
      if (tabsEl) tabsEl.style.top = `${stickyTop + barH}px`;
    };

    computeStickyOffsets();
    requestAnimationFrame(computeStickyOffsets);

    const ro = new ResizeObserver(computeStickyOffsets);
    if (stickyHeaderRef.current) ro.observe(stickyHeaderRef.current);
    if (actionBarRef.current) ro.observe(actionBarRef.current);
    if (tabsRef.current) ro.observe(tabsRef.current);
    window.addEventListener("resize", computeStickyOffsets);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeStickyOffsets);
    };
  }, []);

  const handleShare = async () => {
    const title = recipe.name;
    const text = `${recipe.name}\n\n${t("recipes", "ingredients")}:\n${(recipe.ingredients || []).join("\n")}\n\n${t("recipes", "instructions")}:\n${(recipe.instructions || []).join("\n")}`;
    const url = recipe.sourceUrl || undefined;
    try {
      if (window.Capacitor?.isNativePlatform?.()) {
        await Share.share({ title, text, url });
      } else if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  const originalServings = recipe.servings || 4;

  const ingredientsArray = useMemo(() => parseIngredients(recipe), [recipe]);

  const instructionsArray = useMemo(() => {
    return Array.isArray(recipe.instructions)
      ? recipe.instructions
      : recipe.instructions
          ?.split(".")
          .map((item) => item.trim())
          .filter((item) => item && item.length > 10) || [];
  }, [recipe.instructions]);

  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleInstruction = (index) => {
    setCheckedInstructions((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const scale = (ingredient) =>
    scaleIngredient(ingredient, servings, originalServings);

  const scaleNutrition = (value) => value;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      navigate("/categories", { replace: true });
      await onDelete(recipe.id);
    }
  };

  const contextValue = {
    // props
    recipe,
    originalRecipe,
    isTranslating,
    onClose,
    onEdit,
    onDelete,
    onDuplicate,
    onCreateVariation,
    onSaveRecipe,
    getCategoryName,
    onCategoryClick,
    onEnterCookingMode,
    onCopyRecipe,
    onCopyToMyRecipes,
    onReport,
    onBlockUser,
    currentUserId,
    onToggleFavorite,
    onRate,
    userRating,
    hideRating,
    servings,
    setServings,
    // state
    activeTab,
    setActiveTab,
    hoverStar,
    setHoverStar,
    touchRef,
    checkedIngredients,
    checkedInstructions,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showNutrition,
    setShowNutrition,
    showCopyDialog,
    setShowCopyDialog,
    chatMessages,
    setChatMessages,
    chatAppliedFields,
    setChatAppliedFields,
    showMoreMenu,
    setShowMoreMenu,
    copyToMySuccess,
    setCopyToMySuccess,
    showImageLightbox,
    setShowImageLightbox,
    activeImageIndex,
    setActiveImageIndex,
    // refs
    allImages,
    imageTouchRef,
    moreMenuRef,
    stickyHeaderRef,
    actionBarRef,
    wakeLockWrapperRef,
    tabsRef,
    // computed/state
    wakeLockActive,
    wakeLockToast,
    // computed values
    ingredientsArray,
    instructionsArray,
    commentCount,
    // handlers
    handleCopyClick,
    toggleWakeLock,
    handleShare,
    handleDeleteClick,
    handleTabSwipe,
    toggleIngredient,
    toggleInstruction,
    scale,
    scaleNutrition,
    // variations
    variations,
    showVariations,
    onShowVariations,
    onHideVariations,
    // css + i18n
    classes,
    buttonClasses,
    t,
    language,
  };

  return (
    <RecipeDetailsContext.Provider value={contextValue}>
      <div className={classes.recipeCard}>
        {showCopyDialog && (
          <CopyRecipeDialog
            recipeName={recipe.name}
            currentUserId={currentUserId}
            onCopy={(targetUserId) => onCopyRecipe(recipe, targetUserId)}
            onCancel={() => setShowCopyDialog(false)}
          />
        )}

        {showVariations && (
          <RecipeVariationsList
            variations={variations}
            recipeName={recipe.name}
            onClose={onHideVariations}
          />
        )}

        {showDeleteConfirm && (
          <ConfirmDialog
            title={t("confirm", "deleteRecipe")}
            message={`${t("confirm", "deleteRecipeMsg")} "${recipe.name}"? ${t("confirm", "cannotUndo")}.`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            confirmText={t("confirm", "yesDelete")}
            cancelText={t("common", "cancel")}
          />
        )}

        <div ref={stickyHeaderRef} className={classes.stickyHeader}>
          <BackButton onClick={onClose} />
          <h2 className={classes.headerTitle}>{recipe.name}</h2>
          <button
            className={classes.headerHamburger}
            onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
          >
            <Menu size={22} />
          </button>
        </div>

        <RecipeImageSection />
        <RecipeActionBar />

        <div className={classes.recipeContent}>
          <RecipeInfoSection />
          <RecipeTabsSection />
        </div>
      </div>
    </RecipeDetailsContext.Provider>
  );
}

export default RecipeDetailsFull;
