import React from "react";
import { Check } from "lucide-react";
import { getCategoryIcon } from "../../utils/categoryIcons";
import classes from "./category-card.module.css";

function CategoryCard({
  category,
  name,
  selected,
  onClick,
  count,
  recipeImage,
}) {
  const imageSrc = category.image || recipeImage;
  const IconComp = getCategoryIcon(category.icon);

  return (
    <button
      type="button"
      className={`${classes.card} ${selected ? classes.cardSelected : ""}`}
      style={
        selected
          ? {
              borderColor: category.color,
              boxShadow: `0 0 0 2px ${category.color}`,
            }
          : undefined
      }
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={name}
          className={classes.cardImage}
          loading="lazy"
        />
      ) : (
        <div
          className={classes.cardPlaceholder}
          style={{ backgroundColor: "#fff" }}
        >
          <IconComp
            className={classes.placeholderIcon}
            style={{ color: category.color || "#888" }}
          />
        </div>
      )}
      {selected && (
        <div
          className={classes.selectedOverlay}
          style={{ backgroundColor: `${category.color || "#607D8B"}40` }}
        />
      )}
      <div className={classes.cardOverlay}>
        <span className={classes.cardName}>{name}</span>
        {count != null && <span className={classes.cardCount}>{count}</span>}
      </div>
      {selected && (
        <div
          className={classes.checkBadge}
          style={{
            backgroundColor: category.color || "var(--active-color-primary)",
          }}
        >
          <Check size={14} strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

export default CategoryCard;
