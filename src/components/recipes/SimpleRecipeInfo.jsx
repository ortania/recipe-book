import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./simple-recipe-info.module.css";
import { Button } from "../controls/button";

function SimpleRecipeInfo({
  person,
  groups,
  onEdit,
  onDelete,
  onToggleFavorite,
}) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(person.isFavorite || false);

  // Update local state when person prop changes
  useEffect(() => {
    setIsFavorite(person.isFavorite || false);
  }, [person]);

  const handleFavoriteClick = () => {
    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);
    if (onToggleFavorite) {
      onToggleFavorite(person.id, newFavoriteStatus);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${person.name}"?`)) {
      await onDelete(person.id);
    }
  };

  return (
    <>
      <div className={classes.simpleCard}>
        <div className={classes.personInfo}>
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
          <span className={classes.name}>{person.name}</span>
          <span className={classes.phone}>
            {person.servings ? `${person.servings} servings` : ""}
          </span>
        </div>

        <div className={classes.actions}>
          <Button
            onClick={() => navigate(`/recipe/${person.id}`)}
            title="View recipe details"
          >
            View
          </Button>
          <Button onClick={() => onEdit(person)} title="Edit recipe">
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
    prev.person === next.person &&
    prev.groups === next.groups &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onToggleFavorite === next.onToggleFavorite
  );
});

export { MemoizedSimpleRecipeInfo as SimpleRecipeInfo };
