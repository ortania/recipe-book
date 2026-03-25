import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import buttonClasses from "../../styles/shared/buttons.module.css";
import _headerClasses from "./recipe-details-full/details-header.module.css";
import _imageClasses from "./recipe-details-full/details-image.module.css";
import _bodyClasses from "./recipe-details-full/details-body.module.css";
const classes = Object.assign({}, _bodyClasses, _headerClasses, _imageClasses);
import { useLanguage } from "../../context";
import {
  parseIngredients,
  scaleIngredient,
} from "../../utils/ingredientUtils";
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

function RecipeDetailsFull({
  recipe,
  originalRecipe,
  isTranslating,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onSaveRecipe,
  getCategoryName,
  onEnterCookingMode,
  onCopyRecipe,
  onCopyToMyRecipes,
  currentUserId,
  onToggleFavorite,
  onRate,
  userRating = 0,
  onActiveTabChange,
  hideRating = false,
  servings,
  setServings,
}) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { commentCount } = useComments(recipe.id);

  const [activeTab, setActiveTabRaw] = useState("ingredients");
  const activeTabRef = useRef("ingredients");
  const tabScrollPositions = useRef({});
  const tabsRef = useRef(null);

  const getScrollTop = () => {
    const main = document.querySelector("main");
    return main ? main.scrollTop : window.scrollY;
  };
  const setScrollTop = (y) => {
    const main = document.querySelector("main");
    if (main) main.scrollTop = y;
    else window.scrollTo(0, y);
  };

  const setActiveTab = useCallback(
    (tab) => {
      tabScrollPositions.current[activeTabRef.current] = getScrollTop();
      activeTabRef.current = tab;
      setActiveTabRaw(tab);
      onActiveTabChange?.(tab);
    },
    [onActiveTabChange],
  );

  useEffect(() => {
    const saved = tabScrollPositions.current[activeTab];
    if (saved !== undefined) {
      requestAnimationFrame(() => setScrollTop(saved));
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
  const actionBarSentinelRef = useRef(null);
  const actionBarRef = useRef(null);
  const [actionBarFixed, setActionBarFixed] = useState(false);
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

  useEffect(() => {
    const computeTabsTop = () => {
      if (!tabsRef.current) return;
      const headerH = stickyHeaderRef.current?.offsetHeight || 0;
      let actionBarH = 0;
      if (actionBarRef.current) {
        const pos = getComputedStyle(actionBarRef.current).position;
        if (pos === "sticky" || pos === "fixed") {
          actionBarH = actionBarRef.current.offsetHeight;
        }
      }
      tabsRef.current.style.top = `${headerH + actionBarH}px`;
    };

    computeTabsTop();
    const ro = new ResizeObserver(computeTabsTop);
    if (stickyHeaderRef.current) ro.observe(stickyHeaderRef.current);
    if (actionBarRef.current) ro.observe(actionBarRef.current);
    window.addEventListener("resize", computeTabsTop);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeTabsTop);
    };
  }, []);

  useEffect(() => {
    const sentinel = actionBarSentinelRef.current;
    if (!sentinel) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) return;
    const scrollRoot = sentinel.closest("main");
    const handleScroll = () => {
      const headerH = stickyHeaderRef.current?.offsetHeight || 56;
      const rect = sentinel.getBoundingClientRect();
      setActionBarFixed(rect.top < headerH);
    };
    if (scrollRoot) {
      scrollRoot.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      if (scrollRoot) scrollRoot.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: recipe.name,
      text: `${recipe.name}\n\n${t("recipes", "ingredients")}:\n${(recipe.ingredients || []).join("\n")}\n\n${t("recipes", "instructions")}:\n${(recipe.instructions || []).join("\n")}`,
    };
    if (recipe.sourceUrl) {
      shareData.url = recipe.sourceUrl;
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
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
    recipe, originalRecipe, isTranslating, onClose, onEdit, onDelete,
    onDuplicate, onSaveRecipe, getCategoryName, onEnterCookingMode,
    onCopyRecipe, onCopyToMyRecipes, currentUserId, onToggleFavorite,
    onRate, userRating, hideRating, servings, setServings,
    // state
    activeTab, setActiveTab, hoverStar, setHoverStar, touchRef,
    checkedIngredients, checkedInstructions,
    showDeleteConfirm, setShowDeleteConfirm,
    showNutrition, setShowNutrition, showCopyDialog, setShowCopyDialog,
    chatMessages, setChatMessages, chatAppliedFields, setChatAppliedFields,
    showMoreMenu, setShowMoreMenu, copyToMySuccess, setCopyToMySuccess,
    showImageLightbox, setShowImageLightbox,
    activeImageIndex, setActiveImageIndex,
    // refs
    allImages, imageTouchRef, moreMenuRef, stickyHeaderRef,
    actionBarSentinelRef, actionBarRef, wakeLockWrapperRef, tabsRef,
    // computed/state
    actionBarFixed, wakeLockActive, wakeLockToast,
    // computed values
    ingredientsArray, instructionsArray, commentCount,
    // handlers
    handleCopyClick, toggleWakeLock, handleShare, handleDeleteClick,
    handleTabSwipe, toggleIngredient, toggleInstruction, scale, scaleNutrition,
    // css + i18n
    classes, buttonClasses, t, language,
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
