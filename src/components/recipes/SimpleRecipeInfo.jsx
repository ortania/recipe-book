import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import classes from "./simple-recipe-info.module.css";
import { Button } from "../controls/button";

function SimpleRecipeInfo({
  recipe,
  groups,
  onEdit,
  onDelete,
  onToggleFavorite,
}) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite || false);

  // Update local state when recipe prop changes
  useEffect(() => {
    setIsFavorite(recipe.isFavorite || false);
  }, [recipe]);

  const handleFavoriteClick = () => {
    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);
    if (onToggleFavorite) {
      onToggleFavorite(recipe.id, newFavoriteStatus);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${recipe.name}"?`)) {
      await onDelete(recipe.id);
    }
  };

  return (
    <>
      <div className={classes.simpleCard}>
        <div className={classes.recipeInfo}>
          <Button
            onClick={handleFavoriteClick}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            variant="favorite"
          >
            {isFavorite ? "★" : "☆"}
          </Button>
          {(recipe.image || recipe.image_src) ? (
            <img src={recipe.image || recipe.image_src} alt="" className={classes.thumb} />
          ) : (
            <span className={classes.thumbPlaceholder}>
              <UtensilsCrossed size={16} />
            </span>
          )}
          <span className={classes.name}>{recipe.name}</span>
          <span className={classes.phone}>
            {recipe.servings ? `${recipe.servings} servings` : ""}
          </span>
        </div>

        <div className={classes.actions}>
          <Button
            onClick={() => navigate(`/recipe/${recipe.id}`)}
            title="View recipe details"
          >
            View
          </Button>
          <Button onClick={() => onEdit(recipe)} title="Edit recipe">
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            className={classes.deleteButton}
            title="Delete recipe"
          >
            Delete
          </Button>
        </div>
      </div>
    </>
  );
}

const MemoizedSimpleRecipeInfo = React.memo(SimpleRecipeInfo, (prev, next) => {
  return (
    prev.recipe === next.recipe &&
    prev.groups === next.groups &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onToggleFavorite === next.onToggleFavorite
  );
});

export { MemoizedSimpleRecipeInfo as SimpleRecipeInfo };
