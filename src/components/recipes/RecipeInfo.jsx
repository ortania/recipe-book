import React from "react";
import classes from "./recipe-card-new.module.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaEdit,
  FaTrash,
  FaRegEdit,
} from "react-icons/fa";
import { GoHeart, GoHeartFill, GoTrash } from "react-icons/go";
import { HiOutlineTrash } from "react-icons/hi2";
import { BsTrash3 } from "react-icons/bs";
import { Button } from "../controls/button";
import { ConfirmDialog } from "../forms/confirm-dialog";
import { formatDifficulty, formatTime } from "./utils";
import { useLanguage } from "../../context";
import useTranslatedText from "../../hooks/useTranslatedText";

const DEFAULT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='320'%3E%3Crect width='400' height='320' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%23666'%3ENo Image%3C/text%3E%3C/svg%3E";

function RecipeInfo({ person, groups, onEdit, onDelete, onToggleFavorite }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const translatedName = useTranslatedText(person.name);
  const [isFavorite, setIsFavorite] = useState(person.isFavorite || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

  return (
    <>
      <div
        className={classes.recipeCard}
        onClick={() => navigate(`/recipe/${person.id}`)}
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
            {isFavorite ? <GoHeartFill color="red" /> : <GoHeart />}
          </button>

          <div className={classes.actionButtons}>
            <button
              onClick={handleEdit}
              className={classes.actionButton}
              title="Edit recipe"
            >
              <FaRegEdit />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
              className={`${classes.actionButton} ${classes.danger}`}
              title="Delete recipe"
            >
              {/* <BsTrash3  /> */}
              {/* <FaTrash /> */}
              <GoTrash color="red" />
            </button>
          </div>
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
          {person.avgRating > 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                margin: "0.3rem 0",
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    color: star <= Math.round(person.avgRating) ? "#ffc107" : "#e0e0e0",
                    fontSize: "1.2rem",
                  }}
                >
                  ★
                </span>
              ))}
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                ({person.avgRating} · {person.ratingCount})
              </span>
            </div>
          ) : person.rating > 0 && (
            <div
              style={{
                display: "flex",
                gap: "0.2rem",
                margin: "0.3rem 0",
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    color: star <= person.rating ? "#ffc107" : "#e0e0e0",
                    fontSize: "1.2rem",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
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
    prev.onToggleFavorite === next.onToggleFavorite
  );
});

export { MemoizedRecipeInfo as RecipeInfo };
