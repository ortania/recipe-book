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
    saved: t("recipesView", "sortBySaved"),
    recentlyViewed: t("recipesView", "sortByRecentlyViewed"),
  };

  const hintMap = {
    name: { asc: "א ← ת", desc: "ת ← א" },
    newest: { asc: "ישן ← חדש", desc: "חדש ← ישן" },
    prepTime: { asc: "קצר ← ארוך", desc: "ארוך ← קצר" },
    difficulty: { asc: "קל ← קשה", desc: "קשה ← קל" },
    rating: { asc: "נמוך ← גבוה", desc: "גבוה ← נמוך" },
    favorites: { asc: "רגיל ← מועדף", desc: "מועדף ← רגיל" },
    saved: { asc: "רגיל ← שמור", desc: "שמור ← רגיל" },
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
        const dir = isActive ? sortDirection : lockedDir || defaultDir || "asc";
        return (
          <button
            key={field}
            className={`${classes.option} ${isActive ? classes.active : ""}`}
            onClick={() => handleSelect(field)}
          >
            <span className={classes.label}>{labelMap[field] || field}</span>
            {hintMap[field] && (
              <span className={classes.hint}>{hintMap[field][dir]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

SortDropdown.DEFAULT_OPTIONS = DEFAULT_SORT_OPTIONS;

export default SortDropdown;
