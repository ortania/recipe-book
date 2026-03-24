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
import { formatDifficulty, formatTime, hasTime } from "./utils";
import { useLanguage } from "../../context";
import {
  isGroupHeader,
  getGroupName,
  parseIngredients,
  scaleIngredient,
} from "../../utils/ingredientUtils";
import {
  Share2,
  Link,
  Heart,
  EllipsisVertical,
  FilePenLine,
  Copy,
  Forward,
  Printer,
  Trash2,
  Clock,
  ChefHat,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  List,
  ListOrdered,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Apple,
  Files,
  Info,
  Menu,
  MonitorSmartphone,
  Video,
  Flame,
  Drumstick,
  Droplet,
  Wheat,
  Candy,
  Leaf,
  Droplets,
  Pill,
  Sparkles,
  Bone,
  Atom,
} from "lucide-react";
import { ConfirmDialog } from "../forms/confirm-dialog";
import { CopyRecipeDialog } from "../forms/copy-recipe-dialog";
import { CloseButton } from "../controls/close-button";
import { BackButton } from "../controls/back-button";
import { AddButton } from "../controls/add-button";
import { ExportImageButton } from "./export-image-button";
import ChatWindow from "../chat/ChatWindow";
import { CommentsSection } from "../comments-section";
import { useComments } from "../../hooks/useComments";

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
  // State management
  const [activeTab, setActiveTabRaw] = useState("ingredients");
  const setActiveTab = useCallback(
    (tab) => {
      setActiveTabRaw(tab);
      onActiveTabChange?.(tab);
    },
    [onActiveTabChange],
  );
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
  const [notesExpanded, setNotesExpanded] = useState(false);
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

  // Parse ingredients and instructions
  const ingredientsArray = useMemo(() => parseIngredients(recipe), [recipe]);

  const instructionsArray = useMemo(() => {
    return Array.isArray(recipe.instructions)
      ? recipe.instructions
      : recipe.instructions
          ?.split(".")
          .map((item) => item.trim())
          .filter((item) => item && item.length > 10) || [];
  }, [recipe.instructions]);

  // Toggle functions
  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleInstruction = (index) => {
    setCheckedInstructions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Scale ingredient based on servings
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

  return (
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
      {allImages.length > 0 ? (
        <div
          className={`${classes.imageContainer} ${classes.imageContainerWithFallback}`}
          onTouchStart={(e) => {
            if (allImages.length <= 1) return;
            const tag = e.target.closest("button, a, [role='button']");
            if (tag) {
              imageTouchRef.current.swiping = false;
              imageTouchRef.current.ignore = true;
              return;
            }
            imageTouchRef.current.ignore = false;
            imageTouchRef.current.startX = e.touches[0].clientX;
            imageTouchRef.current.startY = e.touches[0].clientY;
            imageTouchRef.current.swiping = false;
          }}
          onTouchMove={(e) => {
            if (allImages.length <= 1 || imageTouchRef.current.ignore) return;
            const dx = Math.abs(
              e.touches[0].clientX - imageTouchRef.current.startX,
            );
            const dy = Math.abs(
              e.touches[0].clientY - imageTouchRef.current.startY,
            );
            if (dx > 10 && dx > dy) {
              imageTouchRef.current.swiping = true;
              e.preventDefault();
            }
          }}
          onTouchEnd={(e) => {
            if (
              allImages.length <= 1 ||
              imageTouchRef.current.ignore ||
              !imageTouchRef.current.swiping
            )
              return;
            const dx =
              e.changedTouches[0].clientX - imageTouchRef.current.startX;
            if (Math.abs(dx) > 40) {
              if (dx < 0 && activeImageIndex < allImages.length - 1) {
                setActiveImageIndex((i) => i + 1);
              } else if (dx > 0 && activeImageIndex > 0) {
                setActiveImageIndex((i) => i - 1);
              }
            }
          }}
        >
          <div className={classes.noImagePlaceholder}>
            {t("recipes", "noImage")}
          </div>
          <img
            src={allImages[activeImageIndex]}
            alt={recipe.name}
            className={classes.recipeImage}
            loading="lazy"
            onClick={() => setShowImageLightbox(true)}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          {allImages.length > 1 && (
            <>
              <button
                className={`${classes.imageNav} ${classes.imageNavPrev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) => i - 1);
                }}
                disabled={activeImageIndex === 0}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                className={`${classes.imageNav} ${classes.imageNavNext}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) => i + 1);
                }}
                disabled={activeImageIndex === allImages.length - 1}
              >
                <ChevronRight size={22} />
              </button>
              <div className={classes.imageDots}>
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    className={`${classes.imageDot} ${i === activeImageIndex ? classes.imageDotActive : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }}
                  />
                ))}
              </div>
              <span className={classes.imageCounter}>
                {activeImageIndex + 1}/{allImages.length}
              </span>
            </>
          )}
        </div>
      ) : (
        <div className={classes.noImageStandalone}>
          {t("recipes", "noImage")}
        </div>
      )}

      {showImageLightbox && allImages.length > 0 && (
        <div
          className={classes.lightboxOverlay}
          onClick={() => setShowImageLightbox(false)}
          onTouchStart={(e) => {
            const tag = e.target.closest("button, a, [role='button']");
            if (tag) {
              imageTouchRef.current.swiping = false;
              imageTouchRef.current.ignore = true;
              return;
            }
            imageTouchRef.current.ignore = false;
            imageTouchRef.current.startX = e.touches[0].clientX;
            imageTouchRef.current.startY = e.touches[0].clientY;
            imageTouchRef.current.swiping = false;
          }}
          onTouchMove={(e) => {
            if (allImages.length <= 1 || imageTouchRef.current.ignore) return;
            const dx = Math.abs(
              e.touches[0].clientX - imageTouchRef.current.startX,
            );
            const dy = Math.abs(
              e.touches[0].clientY - imageTouchRef.current.startY,
            );
            if (dx > 10 && dx > dy) {
              imageTouchRef.current.swiping = true;
            }
          }}
          onTouchEnd={(e) => {
            if (
              allImages.length <= 1 ||
              imageTouchRef.current.ignore ||
              !imageTouchRef.current.swiping
            )
              return;
            e.stopPropagation();
            const dx =
              e.changedTouches[0].clientX - imageTouchRef.current.startX;
            if (Math.abs(dx) > 40) {
              if (dx < 0 && activeImageIndex < allImages.length - 1) {
                setActiveImageIndex((i) => i + 1);
              } else if (dx > 0 && activeImageIndex > 0) {
                setActiveImageIndex((i) => i - 1);
              }
            }
          }}
        >
          <CloseButton
            className={classes.lightboxClose}
            onClick={() => setShowImageLightbox(false)}
            title={t("common", "close")}
          />
          <img
            src={allImages[activeImageIndex]}
            alt={recipe.name}
            className={classes.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
          {allImages.length > 1 && (
            <>
              <button
                className={`${classes.lightboxNav} ${classes.lightboxPrev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) => Math.max(0, i - 1));
                }}
                disabled={activeImageIndex === 0}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                className={`${classes.lightboxNav} ${classes.lightboxNext}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) =>
                    Math.min(allImages.length - 1, i + 1),
                  );
                }}
                disabled={activeImageIndex === allImages.length - 1}
              >
                <ChevronRight size={28} />
              </button>
              <div className={classes.lightboxDots}>
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    className={`${classes.imageDot} ${i === activeImageIndex ? classes.imageDotActive : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }}
                  />
                ))}
              </div>
              <span className={classes.lightboxCounter}>
                {activeImageIndex + 1} / {allImages.length}
              </span>
            </>
          )}
        </div>
      )}

      <div
        ref={actionBarSentinelRef}
        className={classes.actionBarSentinel}
        style={
          actionBarFixed && actionBarRef.current
            ? { height: actionBarRef.current.offsetHeight }
            : undefined
        }
      />
      <div
        ref={actionBarRef}
        className={classes.actionBar}
        style={
          actionBarFixed
            ? {
                position: "fixed",
                top: stickyHeaderRef.current
                  ? `${stickyHeaderRef.current.offsetHeight}px`
                  : "3.5rem",
                left: 0,
                right: 0,
                zIndex: 99,
                background: "var(--clr-bg-primary)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                paddingInline: "1rem",
              }
            : undefined
        }
      >
        <div className={classes.actionBarStart}>
          <div className={classes.moreMenuWrapper} ref={moreMenuRef}>
            <button
              className={classes.actionIcon}
              onClick={() => setShowMoreMenu((prev) => !prev)}
              title={t("common", "more")}
            >
              <EllipsisVertical size={20} />
            </button>
            {showMoreMenu && (
              <div className={classes.moreMenu}>
                {onEdit && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={() => {
                      setShowMoreMenu(false);
                      onEdit(recipe);
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "edit")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <FilePenLine size={18} />
                    </span>
                  </button>
                )}
                {recipe.sourceUrl && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={() => {
                      setShowMoreMenu(false);
                      window.open(
                        recipe.sourceUrl,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "sourceUrl")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <Link size={18} />
                    </span>
                  </button>
                )}
                {onDuplicate && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={() => {
                      setShowMoreMenu(false);
                      onDuplicate();
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "duplicate")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <Files size={18} />
                    </span>
                  </button>
                )}
                {onCopyRecipe && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleCopyClick();
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "copyToAnotherUser")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <Forward size={18} />
                    </span>
                  </button>
                )}
                {onCopyToMyRecipes && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={async () => {
                      setShowMoreMenu(false);
                      try {
                        await onCopyToMyRecipes(recipe.id);
                        setCopyToMySuccess(true);
                        setTimeout(() => setCopyToMySuccess(false), 3000);
                      } catch (err) {
                        console.error("Copy failed:", err);
                      }
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "copyToMyRecipes")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <Forward size={18} />
                    </span>
                  </button>
                )}
                <ExportImageButton recipe={recipe} asMenuItem />
                <button
                  className={classes.moreMenuItem}
                  onClick={() => {
                    setShowMoreMenu(false);
                    window.print();
                  }}
                >
                  <span className={classes.moreMenuLabel}>
                    {t("mealPlanner", "print")}
                  </span>
                  <span className={classes.moreMenuIcon}>
                    <Printer size={18} />
                  </span>
                </button>
                {onDelete && (
                  <button
                    className={`${classes.moreMenuItem} ${classes.moreMenuItemDanger}`}
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleDeleteClick();
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "delete")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <Trash2 size={18} />
                    </span>
                  </button>
                )}
              </div>
            )}
            {copyToMySuccess && (
              <div className={classes.copyToast}>
                ✓ {t("globalRecipes", "copied")}
              </div>
            )}
          </div>

          {onToggleFavorite && (
            <button
              className={`${classes.actionIcon} ${recipe.isFavorite ? classes.actionIconActive : ""}`}
              onClick={() => onToggleFavorite(recipe)}
              title={t("recipes", "favorite")}
            >
              {recipe.isFavorite ? (
                <Heart size={22} fill="red" color="red" />
              ) : (
                <Heart size={22} />
              )}
            </button>
          )}

          <button
            className={classes.actionIcon}
            onClick={handleShare}
            title={t("recipes", "share")}
          >
            <Share2 size={20} />
          </button>

          <div ref={wakeLockWrapperRef} style={{ position: "relative" }}>
            <button
              className={`${classes.wakeLockBtn} ${wakeLockActive ? classes.wakeLockBtnActive : ""}`}
              onClick={toggleWakeLock}
              title={t("recipes", "keepScreenOn")}
            >
              <MonitorSmartphone size={22} />
            </button>
            {wakeLockToast && (
              <div className={classes.wakeLockToast}>{wakeLockToast}</div>
            )}
          </div>
        </div>

        <div className={classes.actionBarEnd}>
          {onEnterCookingMode && (
            <button className={classes.cookingBtn} onClick={onEnterCookingMode}>
              <ChefHat size={18} />
              <span>{t("recipes", "cookingMode")}</span>
            </button>
          )}
        </div>
      </div>

      <div className={classes.recipeContent}>
        {/* Rating section – hideRating=true hides all stars (e.g. from sharer profile).
            To re-enable, pass hideRating={false} or remove the prop. */}
        {!hideRating && (
          <>
            {onRate ? (
              <div className={classes.ratingSection}>
                <div className={classes.ratingRow}>
                  <span className={classes.ratingLabel}>
                    {t("globalRecipes", "myRating")}:
                  </span>
                  <div className={classes.rating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={classes.ratingStar}
                        role="button"
                        tabIndex={0}
                        style={{
                          color:
                            star <= (hoverStar || userRating)
                              ? "#ffc107"
                              : "#e0e0e0",
                        }}
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() =>
                          onRate(recipe.id, star === userRating ? 0 : star)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            onRate(recipe.id, star === userRating ? 0 : star);
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {recipe.avgRating > 0 && (
                  <div className={classes.ratingRow}>
                    <span className={classes.ratingLabel}>
                      {t("globalRecipes", "avgRating")}:
                    </span>
                    <div className={classes.rating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={classes.ratingStar}
                          style={{
                            color:
                              star <= Math.round(recipe.avgRating)
                                ? "#ffc107"
                                : "#e0e0e0",
                            cursor: "default",
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className={classes.ratingMeta}>
                      ({Number(recipe.avgRating).toFixed(1)} ·{" "}
                      {recipe.ratingCount})
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className={classes.rating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={classes.ratingStar}
                    role="button"
                    tabIndex={0}
                    style={{
                      color:
                        star <= (hoverStar || recipe.rating || 0)
                          ? "#ffc107"
                          : "#e0e0e0",
                    }}
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => {
                      if (!onSaveRecipe) return;
                      const newRating = star === recipe.rating ? 0 : star;
                      onSaveRecipe({ ...recipe, rating: newRating });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (!onSaveRecipe) return;
                        const newRating = star === recipe.rating ? 0 : star;
                        onSaveRecipe({ ...recipe, rating: newRating });
                      }
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {commentCount > 0 && (
          <div className={classes.commentCountRow}>
            <MessageSquare size={14} />
            <span>
              {commentCount} {t("comments", "commentsCount")}
            </span>
          </div>
        )}

        {((recipe.difficulty && recipe.difficulty !== "Unknown") ||
          hasTime(recipe.prepTime) ||
          hasTime(recipe.cookTime)) && (
          <div className={classes.recipeInfo}>
            {recipe.difficulty && recipe.difficulty !== "Unknown" && (
              <span className={classes.infoItem}>
                <ChefHat className={classes.infoIcon} size={16} />
                {t("difficulty", recipe.difficulty)}
              </span>
            )}
            {recipe.difficulty &&
              recipe.difficulty !== "Unknown" &&
              hasTime(recipe.prepTime) && (
                <span className={classes.infoDot}>•</span>
              )}
            {hasTime(recipe.prepTime) && (
              <span className={classes.infoItem}>
                <Clock className={classes.infoIcon} size={16} />
                {language === "he" || language === "mixed"
                  ? "הכנה"
                  : "Prep"}{" "}
                {formatTime(recipe.prepTime, t("recipes", "minutes"))}
              </span>
            )}
            {hasTime(recipe.cookTime) && hasTime(recipe.prepTime) && (
              <span className={classes.infoDot}>•</span>
            )}
            {hasTime(recipe.cookTime) &&
              !hasTime(recipe.prepTime) &&
              recipe.difficulty &&
              recipe.difficulty !== "Unknown" && (
                <span className={classes.infoDot}>•</span>
              )}
            {hasTime(recipe.cookTime) && (
              <span className={classes.infoItem}>
                <Clock className={classes.infoIcon} size={16} />
                {language === "he" || language === "mixed"
                  ? "בישול"
                  : "Cook"}{" "}
                {formatTime(recipe.cookTime, t("recipes", "minutes"))}
              </span>
            )}
          </div>
        )}

        {recipe.categories && recipe.categories.length > 0 && (
          <div className={classes.categoryTags}>
            {recipe.categories
              .filter((cat) => getCategoryName(cat))
              .map((cat, idx) => (
                <span key={idx} className={classes.categoryTag}>
                  {getCategoryName(cat)}
                </span>
              ))}
          </div>
        )}

        <div className={classes.servingSelector}>
          <div className={classes.servingControls}>
            <AddButton
              type="circle"
              sign="+"
              className={classes.servingButton}
              onClick={() => setServings(servings + 1)}
            />
            <span>{servings}</span>
            <AddButton
              type="circle"
              sign="-"
              className={classes.servingButton}
              onClick={() => setServings(Math.max(1, servings - 1))}
            />
          </div>
          <span className={classes.servingLabel}>
            <Users className={classes.servingLabelIcon} size={16} />
            {t("recipes", "servings")} ({servings})
          </span>
        </div>

        {recipe.nutrition &&
          Object.entries(recipe.nutrition).some(
            ([k, v]) => v && k !== "note",
          ) && (
            <div className={classes.nutritionSection}>
              <button
                className={classes.nutritionToggle}
                onClick={() => setShowNutrition(!showNutrition)}
                title={t("recipeDetails", "nutritionTitle")}
              >
                <div className={classes.nutritionTitleWrapper}>
                  <Apple className={classes.nutritionIcon} size={16} />
                  <span>{t("recipes", "nutrition")}</span>
                </div>
                <span className={classes.expandIcon}>
                  {showNutrition ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </span>
              </button>
              {showNutrition && (
                <div className={classes.nutritionContent}>
                  <p className={classes.nutritionTitle}>
                    למנה אחת של {recipe.name} (מתוך {servings} מנות
                    {recipe.nutrition.note ? `, ${recipe.nutrition.note}` : ""}
                    ):
                  </p>

                  <ul className={classes.nutritionList}>
                    {recipe.nutrition.calories && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Flame size={16} />
                        </span>{" "}
                        {t("recipes", "calories")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.calories)} kcal
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.protein && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Drumstick size={16} />
                        </span>{" "}
                        {t("recipes", "protein")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.protein)} g
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.fat && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Droplet size={16} />
                        </span>{" "}
                        {t("recipes", "fat")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.fat)} g
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.carbs && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Wheat size={16} />
                        </span>{" "}
                        {t("recipes", "carbs")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.carbs)} g
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.sugars && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Candy size={16} />
                        </span>{" "}
                        {t("recipes", "sugars")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.sugars)} g
                        </span>{" "}
                        ({(parseFloat(recipe.nutrition.sugars) / 4).toFixed(1)}{" "}
                        {t("recipes", "teaspoons")})
                      </li>
                    )}
                    {recipe.nutrition.fiber && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Leaf size={16} />
                        </span>{" "}
                        {t("recipes", "fiber")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.fiber)} g
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.saturatedFat && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Droplets size={16} />
                        </span>{" "}
                        {t("recipes", "saturatedFat")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.saturatedFat)} g
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.cholesterol && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Pill size={16} />
                        </span>{" "}
                        {t("recipes", "cholesterol")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.cholesterol)} mg
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.sodium && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Sparkles size={16} />
                        </span>{" "}
                        {t("recipes", "sodium")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.sodium)} mg
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.calcium && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Bone size={16} />
                        </span>{" "}
                        {t("recipes", "calcium")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.calcium)} mg
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.iron && (
                      <li>
                        <span className={classes.nutritionEmoji}>
                          <Atom size={16} />
                        </span>{" "}
                        {t("recipes", "iron")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.iron)} mg
                        </span>
                      </li>
                    )}
                  </ul>
                  <p className={classes.nutritionDisclaimer}>
                    <Info size={14} className={classes.disclaimerIcon} />
                    {t("recipeDetails", "nutritionDisclaimer")}
                  </p>
                </div>
              )}
            </div>
          )}

        <div className={classes.tabs}>
          <button
            className={`${classes.tab} ${activeTab === "ingredients" ? classes.activeTab : ""}`}
            onClick={() => setActiveTab("ingredients")}
          >
            <List className={classes.tabIcon} size={18} />
            {t("recipes", "ingredients")}
          </button>
          <button
            className={`${classes.tab} ${activeTab === "instructions" ? classes.activeTab : ""}`}
            onClick={() => setActiveTab("instructions")}
          >
            <ListOrdered className={classes.tabIcon} size={18} />
            {t("recipes", "instructions")}
          </button>
          {recipe.notes && (
            <button
              className={`${classes.tab} ${activeTab === "tips" ? classes.activeTab : ""}`}
              onClick={() => setActiveTab("tips")}
            >
              <Lightbulb className={classes.tabIcon} size={18} />
              {t("recipes", "notes")}
            </button>
          )}
          <button
            className={`${classes.tab} ${activeTab === "chat" ? classes.activeTab : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageCircle className={classes.tabIcon} size={18} />
            {t("recipeChat", "tabLabel")}
          </button>
        </div>

        <div
          className={classes.tabContent}
          onTouchStart={(e) => {
            touchRef.current.startX = e.touches[0].clientX;
            touchRef.current.startY = e.touches[0].clientY;
          }}
          onTouchEnd={handleTabSwipe}
        >
          {activeTab === "ingredients" && (
            <ul className={classes.ingredientsList}>
              {ingredientsArray.length > 0 ? (
                ingredientsArray.map((ingredient, index) =>
                  isGroupHeader(ingredient) ? (
                    <li key={index} className={classes.ingredientGroupHeader}>
                      {getGroupName(ingredient)}
                    </li>
                  ) : (
                    <li key={index} className={classes.ingredientItem}>
                      <label className={classes.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={checkedIngredients[index] || false}
                          onChange={() => toggleIngredient(index)}
                          className={
                            classes.checkbox + " " + buttonClasses.checkBox
                          }
                        />
                        <span
                          className={
                            checkedIngredients[index] ? classes.checkedText : ""
                          }
                        >
                          {scale(ingredient)}
                        </span>
                      </label>
                    </li>
                  ),
                )
              ) : (
                <p>{t("recipes", "noIngredientsListed")}</p>
              )}
            </ul>
          )}

          {activeTab === "instructions" && (
            <>
              <ol className={classes.instructionsList}>
                {instructionsArray.length > 0 ? (
                  instructionsArray.map((instruction, index) => (
                    <li key={index} className={classes.instructionItem}>
                      <label className={classes.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={checkedInstructions[index] || false}
                          onChange={() => toggleInstruction(index)}
                          className={
                            classes.checkbox + " " + buttonClasses.checkBox
                          }
                        />
                        <span
                          className={
                            checkedInstructions[index]
                              ? classes.checkedText
                              : ""
                          }
                        >
                          {instruction}
                        </span>
                      </label>
                    </li>
                  ))
                ) : (
                  <p>{t("recipes", "noInstructionsListed")}</p>
                )}
              </ol>
              {recipe.videoUrl && (
                <a
                  href={recipe.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.videoLink}
                >
                  <Video size={18} />
                  {t("recipes", "watchVideo")}
                </a>
              )}
            </>
          )}

          {activeTab === "tips" && recipe.notes && (
            <div className={classes.notesContent}>
              <p className={classes.notesText}>{recipe.notes}</p>
            </div>
          )}

          {activeTab === "chat" && (
            <ChatWindow
              recipe={recipe}
              servings={servings}
              messages={chatMessages}
              onMessagesChange={setChatMessages}
              appliedFields={chatAppliedFields}
              onAppliedFieldsChange={setChatAppliedFields}
              onUpdateRecipe={
                onSaveRecipe
                  ? (changes) => {
                      const base = originalRecipe || recipe;
                      const updated = { ...base, ...changes };
                      onSaveRecipe(updated);
                    }
                  : undefined
              }
            />
          )}
        </div>

        {activeTab !== "chat" && <CommentsSection recipeId={recipe.id} />}
      </div>
    </div>
  );
}

export default RecipeDetailsFull;
