import { useState, useEffect } from "react";
import { IoSearch } from "react-icons/io5";
import classes from "./search-box.module.css";

function SearchBox({
  searchTerm,
  onSearchChange,
  placeholder = "Search...",
  examples = [],
  size = "medium",
  className = "",
  autoFocus = false,
}) {
  const [currentExample, setCurrentExample] = useState(0);

  useEffect(() => {
    if (!examples.length || searchTerm) return;
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % examples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [examples, searchTerm]);

  const displayPlaceholder =
    !searchTerm && examples.length ? examples[currentExample] : placeholder;

  const sizeClass = size !== "medium" ? classes[size] || "" : "";

  return (
    <div className={`${classes.searchBox} ${sizeClass} ${className}`.trim()}>
      <IoSearch className={classes.searchIcon} />
      <input
        type="text"
        placeholder={displayPlaceholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={classes.searchInput}
        autoFocus={autoFocus}
      />
      {searchTerm && (
        <button
          className={classes.clearSearch}
          onClick={() => onSearchChange("")}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default SearchBox;
