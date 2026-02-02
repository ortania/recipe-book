import { useState } from "react";
import { RecipeInfo } from "./RecipeInfo";
import classes from "./draggable-recipe.module.css";

function DraggableRecipe({
  person,
  groups,
  onEdit,
  onDelete,
  isAdmin,
  onToggleFavorite,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    onDragStart(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
    onDragOver(index);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onDrop(index);
  };

  return (
    <div
      className={`${classes.draggableWrapper} ${isDragging ? classes.dragging : ""} ${dragOver ? classes.dragOver : ""}`}
      draggable={isAdmin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <RecipeInfo
        person={person}
        groups={groups}
        onEdit={onEdit}
        onDelete={onDelete}
        isAdmin={isAdmin}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
}

export default DraggableRecipe;
