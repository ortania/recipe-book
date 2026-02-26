import { MoveUp, MoveDown } from "lucide-react";
import { useLanguage } from "../../../context";
import classes from "./sort-dropdown.module.css";

const DEFAULT_SORT_OPTIONS = [
  { field: "name", defaultDir: "asc" },
  { field: "newest", defaultDir: "desc", lockedDir: "desc" },
  { field: "prepTime", defaultDir: "asc" },
  { field: "difficulty", defaultDir: "asc" },
  { field: "rating", defaultDir: "desc" },
  { field: "favorites", defaultDir: "desc" },
];

function SortDropdown({
  sortField,
  sortDirection,
  onSortChange,
  options = DEFAULT_SORT_OPTIONS,
  closeMobileOnSelect,
}) {
  const { t } = useLanguage();

  const labelMap = {
    name: t("recipesView", "sortByName"),
    newest: t("recipesView", "sortByNewest") || "חדש ביותר",
    prepTime: t("recipesView", "sortByPrepTime"),
    difficulty: t("recipesView", "sortByDifficulty"),
    rating: t("recipesView", "sortByRating"),
    favorites: t("recipesView", "sortByFavorites"),
    recentlyViewed: t("recipesView", "sortByRecentlyViewed"),
  };

  const handleSelect = (field) => {
    const opt = options.find((o) => o.field === field);
    if (sortField === field && !opt?.lockedDir) {
      onSortChange(field, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(field, opt?.lockedDir || opt?.defaultDir || "asc");
    }
  };

  return (
    <div className={classes.list}>
      {options.map(({ field, lockedDir, defaultDir }) => {
        const isActive = sortField === field;
        const dir = isActive ? sortDirection : (lockedDir || defaultDir || "asc");
        return (
          <button
            key={field}
            className={`${classes.option} ${isActive ? classes.active : ""}`}
            onClick={() => handleSelect(field)}
          >
            <span className={classes.label}>{labelMap[field] || field}</span>
            <span className={classes.arrow}>
              {lockedDir ? (
                <MoveDown size={16} />
              ) : dir === "asc" ? (
                <MoveUp size={16} />
              ) : (
                <MoveDown size={16} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

SortDropdown.DEFAULT_OPTIONS = DEFAULT_SORT_OPTIONS;

export default SortDropdown;
