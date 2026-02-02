import { FaSearch } from "react-icons/fa";

import { IoSearch } from "react-icons/io5";
import classes from "./search-box.module.css";

function SearchBox({ searchTerm, onSearchChange, placeholder = "Search..." }) {
  return (
    <div className={classes.searchBox}>
      <IoSearch className={classes.searchIcon} />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={classes.searchInput}
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
