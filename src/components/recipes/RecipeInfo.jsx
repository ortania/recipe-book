import React from "react";
import classes from "./recipe-card-new.module.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Pencil, FilePenLine, Trash2, Copy } from "lucide-react";
import { Button } from "../controls/button";
import { ConfirmDialog } from "../forms/confirm-dialog";
import { formatDifficulty, formatTime } from "./utils";
import { useLanguage } from "../../context";
import useTranslatedText from "../../hooks/useTranslatedText";

const DEFAULT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='320'%3E%3Crect width='400' height='320' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%23666'%3ENo Image%3C/text%3E%3C/svg%3E";

function RecipeInfo({
  person,
  groups,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyRecipe,
  userRating = 0,
  onRate,
  onCardClick,
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const translatedName = useTranslatedText(person.name);
  const [isFavorite, setIsFavorite] = useState(person.isFavorite || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

  const getImageSrc = () => {
    if (
      !person.image_src ||
      typeof person.image_src !== "string" ||
      person.image_src.trim() === ""
    ) {
      return DEFAULT_IMAGE;
    }
    return person.image_src;
  };

  // Update local state when person prop changes
  useEffect(() => {
    setIsFavorite(person.isFavorite || false);
  }, [person]);

  const personGroups =
    person.categories && groups
      ? person.categories
          .map((groupId) => groups.find((g) => g.id === groupId))
          .filter(Boolean)
      : [];

  const handleFavoriteClick = () => {
    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);
    if (onToggleFavorite) {
      onToggleFavorite(person.id, newFavoriteStatus);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await onDelete(person.id);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(person);
    }
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (isCopying || !onCopyRecipe) return;
    setIsCopying(true);
    try {
      await onCopyRecipe(person.id);
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
        className={classes.recipeCard}
        onClick={() =>
          onCardClick
            ? onCardClick(person.id)
            : navigate(`/recipe/${person.id}`)
        }
      >
        <div className={classes.imageContainer}>
          <img
            src={getImageSrc()}
            alt={person.name}
            className={classes.recipeImage}
            loading="lazy"
            onError={(e) => {
              e.target.src = DEFAULT_IMAGE;
            }}
          />
          {!onCopyRecipe && (
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
                <Heart size={18} fill="red" color="red" />
              ) : (
                <Heart size={18} />
              )}
            </button>
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
            <div className={classes.actionButtons}>
              <button
                onClick={handleEdit}
                className={classes.actionButton}
                title="Edit recipe"
              >
                <FilePenLine size={16} />
              </button>
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
            </div>
          )}
        </div>

        <div className={classes.recipeInfo}>
          <h3 className={classes.recipeName}>{translatedName}</h3>
          <div className={classes.recipeMetadata}>
            {person.prepTime && (
              <p className={classes.recipeTime}>
                {formatTime(person.prepTime, t("recipes", "minutes"))}
              </p>
            )}
            {person.difficulty && person.difficulty !== "Unknown" && (
              <span className={classes.recipeDifficulty}>
                {person.prepTime && "• "}
                {t("difficulty", person.difficulty)}
              </span>
            )}
          </div>
          {onRate ? (
            <div className={classes.ratingSection}>
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
                        onRate(person.id, star);
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              {person.avgRating > 0 && (
                <div className={classes.ratingAvgBlock}>
                  <div className={classes.ratingRow}>
                    <span className={classes.ratingLabel}>
                      {t("globalRecipes", "avgRating")}:
                    </span>
                    <div className={classes.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={classes.star}
                          style={{
                            color:
                              star <= Math.round(person.avgRating)
                                ? "#ffc107"
                                : "#e0e0e0",
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={classes.ratingMeta}>
                    ({Number(person.avgRating).toFixed(1)} ·{" "}
                    {person.ratingCount})
                  </span>
                </div>
              )}
            </div>
          ) : (
            (person.avgRating > 0 || person.rating > 0) && (
              <div className={classes.starsRow} style={{ margin: "0.3rem 0" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={classes.star}
                    style={{
                      color:
                        star <= Math.round(person.avgRating || person.rating)
                          ? "#ffc107"
                          : "#e0e0e0",
                    }}
                  >
                    ★
                  </span>
                ))}
                {person.avgRating > 0 && (
                  <span className={classes.ratingMeta}>
                    ({Number(person.avgRating).toFixed(1)} ·{" "}
                    {person.ratingCount})
                  </span>
                )}
              </div>
            )
          )}
        </div>

        {showDeleteConfirm && (
          <ConfirmDialog
            title={t("confirm", "deleteRecipe")}
            message={`${t("confirm", "deleteRecipeMsg")} "${person.name}"? ${t("confirm", "cannotUndo")}.`}
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
      </div>
    </>
  );
}

const MemoizedRecipeInfo = React.memo(RecipeInfo, (prev, next) => {
  return (
    prev.person === next.person &&
    prev.groups === next.groups &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onToggleFavorite === next.onToggleFavorite &&
    prev.onCopyRecipe === next.onCopyRecipe
  );
});

export { MemoizedRecipeInfo as RecipeInfo };
