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
        <div className={classes.cardPlaceholder}>
          <IconComp className={classes.placeholderIcon} />
        </div>
      )}
      {selected && <div className={classes.selectedOverlay} />}
      <div className={classes.cardOverlay}>
        <span className={classes.cardName}>{name}</span>
        {count != null && <span className={classes.cardCount}>{count}</span>}
      </div>
      {selected && (
        <div className={classes.checkBadge}>
          <Check size={14} strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

export default CategoryCard;
