import React from "react";
import classes from "./recipe-card-new.module.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Pencil,
  FilePenLine,
  Trash2,
  Copy,
  UserCheck,
  Bookmark,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "../controls/button";
import { ConfirmDialog } from "../forms/confirm-dialog";
import { formatDifficulty, formatTime } from "./utils";
import { useLanguage, useRecipeBook } from "../../context";
import useTranslatedText from "../../hooks/useTranslatedText";

function RecipeInfo({
  recipe,
  groups,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyRecipe,
  onSaveRecipe,
  isSaved = false,
  userRating = 0,
  onRate,
  onCardClick,
  followingList = [],
  linkState,
  hideRating = false,
}) {
  const { t } = useLanguage();
  const { currentUser } = useRecipeBook();
  const navigate = useNavigate();
  const translatedName = useTranslatedText(recipe.name);
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [touchActionsVisible, setTouchActionsVisible] = useState(false);
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const ignoreNextClickRef = useRef(false);
  const longPressShownThisGestureRef = useRef(false);

  const LONG_PRESS_MS = 500;
  const MOVE_CANCEL_PX = 12;

  const hasImage =
    recipe.image_src &&
    typeof recipe.image_src === "string" &&
    recipe.image_src.trim() !== "";

  // Update local state when recipe prop changes
  useEffect(() => {
    setIsFavorite(recipe.isFavorite || false);
  }, [recipe]);

  const showOwnerActionButtons =
    !onSaveRecipe && !onCopyRecipe && (onEdit || onDelete);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearLongPressTimer(), [clearLongPressTimer]);

  const handleCardTouchStart = (e) => {
    if (!showOwnerActionButtons) return;
    const el = e.target;
    if (el && typeof el.closest === "function") {
      if (el.closest("button") || el.closest("a")) return;
    }
    const t = e.touches[0];
    if (!t) return;
    touchStartPosRef.current = { x: t.clientX, y: t.clientY };
    longPressShownThisGestureRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressShownThisGestureRef.current = true;
      ignoreNextClickRef.current = true;
      setTouchActionsVisible(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, LONG_PRESS_MS);
  };

  const handleCardTouchMove = (e) => {
    if (!showOwnerActionButtons || !longPressTimerRef.current) return;
    const t = e.touches[0];
    if (!t) return;
    const dx = Math.abs(t.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(t.clientY - touchStartPosRef.current.y);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      clearLongPressTimer();
    }
  };

  const handleCardTouchEnd = (e) => {
    if (!showOwnerActionButtons) return;
    clearLongPressTimer();
    if (longPressShownThisGestureRef.current) {
      e.preventDefault();
      longPressShownThisGestureRef.current = false;
    }
  };

  const handleCardTouchCancel = () => {
    clearLongPressTimer();
    longPressShownThisGestureRef.current = false;
  };

  const handleCardClick = () => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }
    if (touchActionsVisible) {
      setTouchActionsVisible(false);
    }
    if (onCardClick) {
      onCardClick(recipe.id);
    } else {
      navigate(
        `/recipe/${recipe.id}`,
        linkState ? { state: linkState } : undefined,
      );
    }
  };

  const recipeGroups =
    recipe.categories && groups
      ? recipe.categories
          .map((groupId) => groups.find((g) => g.id === groupId))
          .filter(Boolean)
      : [];

  const handleFavoriteClick = () => {
    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);
    if (onToggleFavorite) {
      onToggleFavorite(recipe.id, newFavoriteStatus);
    }
  };

  const handleDeleteClick = () => {
    setTouchActionsVisible(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await onDelete(recipe.id);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteError(true);
      setTimeout(() => setDeleteError(false), 4000);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setTouchActionsVisible(false);
    if (onEdit) {
      onEdit(recipe);
    }
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (isCopying || !onCopyRecipe) return;
    setIsCopying(true);
    try {
      await onCopyRecipe(recipe.id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      console.error("Copy failed:", error);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <div
        className={`${classes.recipeCard} ${touchActionsVisible ? classes.touchActionsVisible : ""}`}
        onClick={handleCardClick}
        onTouchStart={handleCardTouchStart}
        onTouchMove={handleCardTouchMove}
        onTouchEnd={handleCardTouchEnd}
        onTouchCancel={handleCardTouchCancel}
        onContextMenu={
          showOwnerActionButtons ? (ev) => ev.preventDefault() : undefined
        }
      >
        <div className={classes.imageContainer}>
          <div className={classes.noImagePlaceholder}>
            <UtensilsCrossed size={40} />
          </div>
          {hasImage && (
            <img
              src={recipe.image_src}
              alt={recipe.name}
              className={classes.recipeImage}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          {onSaveRecipe ? (
            <button
              className={`${classes.favoriteButton} ${isSaved ? classes.active : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSaveRecipe(recipe.id);
              }}
              aria-label={isSaved ? "Unsave" : "Save"}
            >
              {isSaved ? (
                <Bookmark
                  size={16}
                  fill="var(--clr-primary-700)"
                  stroke="var(--clr-primary-700)"
                />
              ) : (
                <Bookmark size={16} color="#333" strokeWidth={2} />
              )}
            </button>
          ) : (
            !onCopyRecipe &&
            onToggleFavorite && (
              <button
                className={`${classes.favoriteButton} ${isFavorite ? classes.active : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavoriteClick();
                }}
                aria-label={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                {isFavorite ? (
                  <Heart size={16} fill="red" color="red" />
                ) : (
                  <Heart size={16} color="#333" strokeWidth={2} />
                )}
              </button>
            )
          )}

          {onCopyRecipe ? (
            <button
              onClick={handleCopy}
              className={`${classes.copyButton} ${copySuccess ? classes.copied : ""}`}
              disabled={isCopying || copySuccess}
              title={t("globalRecipes", "copyToMyRecipes")}
            >
              <Copy size={16} />
              <span>
                {copySuccess
                  ? t("globalRecipes", "copied")
                  : isCopying
                    ? "..."
                    : t("globalRecipes", "copyToMyRecipes")}
              </span>
            </button>
          ) : (
            !onSaveRecipe &&
            (onEdit || onDelete) && (
              <div className={classes.actionButtons}>
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className={classes.actionButton}
                    title="Edit recipe"
                  >
                    <FilePenLine size={16} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick();
                    }}
                    className={`${classes.actionButton} ${classes.danger}`}
                    title="Delete recipe"
                  >
                    <Trash2 size={16} color="red" />
                  </button>
                )}
              </div>
            )
          )}
        </div>

        <div className={classes.recipeInfo}>
          <h3 className={classes.recipeName}>{translatedName}</h3>
          {recipe.author && !onSaveRecipe && !onCopyRecipe && (
            <p className={classes.authorLabel}>{t("recipes", "source")}: {recipe.author}</p>
          )}
          {recipe.sharerName && recipe.sharerUserId !== currentUser?.uid && (
            <div
              className={classes.sharerName}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/sharer/${recipe.sharerUserId}`);
              }}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {followingList.includes(recipe.sharerUserId) && (
                <UserCheck
                  size={14}
                  style={{ marginInlineEnd: "0.2rem", verticalAlign: "middle" }}
                />
              )}
              {recipe.copiedFrom
                ? t("recipes", "copiedFrom")
                : t("recipes", "sharedBy")}{" "}
              {recipe.sharerName}
            </div>
          )}
          <div className={classes.recipeMetadata}>
            {recipe.prepTime && (
              <p className={classes.recipeTime}>
                {t("recipes", "prepTime")}:{" "}
                {formatTime(recipe.prepTime, t("recipes", "minutes"))}
              </p>
            )}
            {recipe.difficulty && recipe.difficulty !== "Unknown" && (
              <span className={classes.recipeDifficulty}>
                {recipe.prepTime && "• "}
                {t("difficulty", recipe.difficulty)}
              </span>
            )}
          </div>
          {/* Rating section – set hideRating=true to hide stars (e.g. sharer profile).
              To re-enable, pass hideRating={false} or remove the prop. */}
          {!hideRating && (
            <>
              {onRate ? (
                <div
                  className={classes.ratingSection}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <div className={classes.ratingRow}>
                    <span className={classes.ratingLabel}>
                      {t("globalRecipes", "myRating")}:
                    </span>
                    <div className={classes.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={classes.starClickable}
                          style={{
                            color:
                              star <= (hoverStar || userRating)
                                ? "#ffc107"
                                : "#e0e0e0",
                          }}
                          onMouseEnter={() => setHoverStar(star)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRate(recipe.id, star);
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {!recipe.copiedFrom && recipe.avgRating > 0 && (
                    <div className={classes.ratingAvgBlock}>
                      <div className={classes.ratingRow}>
                        <span className={classes.ratingLabel}>
                          {t("globalRecipes", "avgRating")}:
                        </span>
                      </div>
                      <span className={classes.ratingMeta}>
                        {Number(recipe.avgRating).toFixed(1)} ({" "}
                        {recipe.ratingCount})
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                (() => {
                  const effectiveRating = recipe.copiedFrom
                    ? recipe.rating
                    : recipe.avgRating || recipe.rating;
                  const showAvg = !recipe.copiedFrom && recipe.avgRating > 0;
                  return effectiveRating > 0 || recipe.rating > 0 ? (
                    <div
                      className={classes.starsRow}
                      style={{ margin: "0.3rem 0" }}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={classes.star}
                          style={{
                            color:
                              star <= Math.round(effectiveRating)
                                ? "#ffc107"
                                : "#e0e0e0",
                          }}
                        >
                          ★
                        </span>
                      ))}
                      {showAvg && (
                        <span className={classes.ratingMeta}>
                          ({Number(recipe.avgRating).toFixed(1)} ·{" "}
                          {recipe.ratingCount})
                        </span>
                      )}
                    </div>
                  ) : null;
                })()
              )}
            </>
          )}
        </div>

        {showDeleteConfirm && (
          <ConfirmDialog
            title={t("confirm", "deleteRecipe")}
            message={`${t("confirm", "deleteRecipeMsg")} "${recipe.name}"? ${t("confirm", "cannotUndo")}.`}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            confirmText={t("confirm", "yesDelete")}
            cancelText={t("common", "cancel")}
          />
        )}

        {showSuccessMessage && (
          <div className={classes.successNotification}>
            {t("confirm", "recipeDeleted")}
          </div>
        )}
        {copySuccess && (
          <div className={classes.successNotification}>
            {t("globalRecipes", "copied")}
          </div>
        )}
        {deleteError && (
          <div className={classes.errorNotification}>
            {t("confirm", "deleteFailed") || "Delete failed"}
          </div>
        )}
      </div>
    </>
  );
}

const MemoizedRecipeInfo = React.memo(RecipeInfo, (prev, next) => {
  return (
    prev.recipe === next.recipe &&
    prev.groups === next.groups &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onToggleFavorite === next.onToggleFavorite &&
    prev.onCopyRecipe === next.onCopyRecipe
  );
});

export { MemoizedRecipeInfo as RecipeInfo };
