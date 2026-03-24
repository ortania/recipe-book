import classes from "./sort-controls.module.css";

export default function SortControls({ sortField, sortDirection, onSort }) {
  return (
    <div className={classes.sortControls}>
      {["Name", "Prep Time"].map((el, i) => (
        <button
          key={i}
          className={`${classes.sortButton} ${
            sortField === el.toLowerCase() ? classes.active : ""
          }`}
          onClick={() => onSort(el.toLowerCase())}
          title={`Sort by ${el} ${
            sortField === el.toLowerCase()
              ? sortDirection === "asc"
                ? "(ascending)"
                : "(descending)"
              : ""
          }`}
        >
          {el}{" "}
          {sortField === el.toLowerCase() &&
            (sortDirection === "asc" ? "↑" : "↓")}
        </button>
      ))}
    </div>
  );
}
