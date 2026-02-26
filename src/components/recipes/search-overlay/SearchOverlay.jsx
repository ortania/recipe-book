import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  ChevronDown,
  Filter,
  History,
  Search,
  RotateCcw,
} from "lucide-react";
import { useLanguage } from "../../../context";
import { SearchBox } from "../../controls/search";
import { BottomSheet } from "../../controls/bottom-sheet";
import { CloseButton } from "../../controls/close-button";
import { SortDropdown } from "../../controls/sort-dropdown";
import { RecipeInfo } from "../RecipeInfo";
import { search } from "../utils";
import parentClasses from "../recipes-view-new.module.css";
import classes from "./search-overlay.module.css";

const MOBILE_BREAKPOINT = 768;
const RECENT_SEARCHES_KEY = "recentSearchTerms";
const SEARCH_STATE_KEY = "searchOverlayState";
const LAST_SEARCH_RESULTS_KEY = "lastSearchResultIds";

const SORT_OPTIONS = [
  { field: "name", defaultDir: "asc" },
  { field: "newest", defaultDir: "desc", lockedDir: "desc" },
  { field: "prepTime", defaultDir: "asc" },
  { field: "difficulty", defaultDir: "asc" },
  { field: "rating", defaultDir: "desc" },
  { field: "favorites", defaultDir: "desc" },
];

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(term) {
  if (!term.trim()) return;
  const list = getRecentSearches().filter((t) => t !== term.trim());
  list.unshift(term.trim());
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, 8)));
}

function SearchOverlay({
  open,
  persons,
  groups,
  onEditPerson,
  onDeletePerson,
  onCopyRecipe,
  onRate,
  userRatings = {},
  onToggleFavorite,
  isSimpleView,
  onClose,
  showCategories = false,
  selectedCategories = [],
  toggleCategory,
  clearCategorySelection,
  getTranslatedGroup,
  selectedCategoryObjects = [],
  isAllSelected = true,
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [restoredState] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SEARCH_STATE_KEY));
      if (saved) sessionStorage.removeItem(SEARCH_STATE_KEY);
      return saved || null;
    } catch {
      return null;
    }
  });

  const [searchTerm, setSearchTerm] = useState(restoredState?.searchTerm || "");
  const [debouncedSearch, setDebouncedSearch] = useState(restoredState?.searchTerm || "");
  const [isMobile, setIsMobile] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  const [sortField, setSortField] = useState(restoredState?.sortField || "name");
  const [sortDirection, setSortDirection] = useState(restoredState?.sortDirection || "asc");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedPrepTime, setSelectedPrepTime] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedIngredientCount, setSelectedIngredientCount] = useState("all");
  const [selectedStepCount, setSelectedStepCount] = useState("all");
  const [filterIngredients, setFilterIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [searchViewedIds, setSearchViewedIds] = useState(restoredState?.searchViewedIds || []);

  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const suggestionsRef = useRef(null);
  const [filterMenuStyle, setFilterMenuStyle] = useState({});
  const [sortMenuStyle, setSortMenuStyle] = useState({});

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchRecentlyViewed = useMemo(() => {
    if (searchViewedIds.length === 0) return [];
    return searchViewedIds
      .map((id) => (persons || []).find((p) => p.id === id))
      .filter(Boolean);
  }, [searchViewedIds, persons]);

  const handleRecipeClick = useCallback((personId) => {
    const newViewedIds = [personId, ...searchViewedIds.filter((id) => id !== personId)].slice(0, 8);
    setSearchViewedIds(newViewedIds);
    sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify({
      searchTerm,
      sortField,
      sortDirection,
      searchViewedIds: newViewedIds,
    }));
    if (searchTerm.trim()) saveRecentSearch(searchTerm);
    navigate(`/recipe/${personId}`);
  }, [searchTerm, sortField, sortDirection, searchViewedIds, navigate]);

  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 1) return [];
    const term = searchTerm.toLowerCase();
    return (persons || [])
      .filter((p) => p.name?.toLowerCase().includes(term))
      .slice(0, 6);
  }, [searchTerm, persons]);

  useEffect(() => {
    setShowSuggestions(searchTerm.length > 0 && suggestions.length > 0);
  }, [searchTerm, suggestions]);

  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setShowRecentSearches(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSuggestionClick = (person) => {
    setSearchTerm(person.name);
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
    setShowRecentSearches(false);
    setShowSuggestions(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
      setShowRecentSearches(false);
      if (searchTerm.trim()) saveRecentSearch(searchTerm);
      setRecentSearches(getRecentSearches());
    }
  };

  const handleSearchFocus = () => {
    if (!searchTerm && recentSearches.length > 0) {
      setShowRecentSearches(true);
    }
  };

  const handleSortChange = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const calcDropdownPos = (ref) => {
    if (!ref.current) return {};
    if (window.innerWidth <= MOBILE_BREAKPOINT) return {};
    const rect = ref.current.getBoundingClientRect();
    const docIsRtl = document.documentElement.dir === "rtl";
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuWidth = 280;
    const pad = 8;
    const style = { top: rect.bottom + 4 };

    if (docIsRtl) {
      let right = vw - rect.right;
      if (right < pad) right = pad;
      if (right + menuWidth > vw - pad) right = vw - menuWidth - pad;
      style.right = right;
    } else {
      let left = rect.left;
      if (left < pad) left = pad;
      if (left + menuWidth > vw - pad) left = vw - menuWidth - pad;
      style.left = left;
    }

    const spaceBelow = vh - rect.bottom - 16;
    style.maxHeight = Math.min(spaceBelow, vh * 0.7);
    return style;
  };

  const toggleFilterMenu = () => {
    setShowFilterMenu((prev) => {
      if (!prev) setFilterMenuStyle(calcDropdownPos(filterRef));
      return !prev;
    });
  };

  const toggleSortMenu = () => {
    setShowSortMenu((prev) => {
      if (!prev) setSortMenuStyle(calcDropdownPos(sortRef));
      return !prev;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) return;
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters =
    selectedRating !== "all" ||
    selectedPrepTime !== "all" ||
    selectedDifficulty !== "all" ||
    selectedIngredientCount !== "all" ||
    selectedStepCount !== "all" ||
    filterIngredients.length > 0;

  const clearAllFilters = () => {
    setSelectedRating("all");
    setSelectedPrepTime("all");
    setSelectedDifficulty("all");
    setSelectedIngredientCount("all");
    setSelectedStepCount("all");
    setFilterIngredients([]);
    setIngredientInput("");
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    clearAllFilters();
    setSortField("name");
    setSortDirection("asc");
    setShowSuggestions(false);
    setShowRecentSearches(false);
    if (clearCategorySelection) clearCategorySelection();
  };

  const hasAnythingActive = searchTerm || hasActiveFilters || sortField !== "name" || (!isAllSelected && selectedCategoryObjects.length > 0);

  const addFilterIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !filterIngredients.includes(trimmed)) {
      setFilterIngredients((prev) => [...prev, trimmed]);
    }
    setIngredientInput("");
  };

  const removeFilterIngredient = (ing) => {
    setFilterIngredients((prev) => prev.filter((i) => i !== ing));
  };

  const filteredResults = useMemo(() => {
    let filtered = persons || [];

    if (selectedRating !== "all") {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter((p) => (parseFloat(p.rating) || 0) >= minRating);
    }
    if (selectedPrepTime !== "all") {
      filtered = filtered.filter((p) => {
        const m = p.prepTime?.match(/\d+/);
        const pt = m ? parseInt(m[0]) : 0;
        if (selectedPrepTime === "quick") return pt <= 15;
        if (selectedPrepTime === "medium") return pt > 15 && pt <= 30;
        if (selectedPrepTime === "long") return pt > 30;
        return true;
      });
    }
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(
        (p) => p.difficulty && p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase(),
      );
    }
    if (selectedIngredientCount !== "all") {
      filtered = filtered.filter((p) => {
        const c = Array.isArray(p.ingredients) ? p.ingredients.filter(Boolean).length : 0;
        if (selectedIngredientCount === "few") return c <= 5;
        if (selectedIngredientCount === "medium") return c > 5 && c <= 10;
        if (selectedIngredientCount === "many") return c > 10;
        return true;
      });
    }
    if (selectedStepCount !== "all") {
      filtered = filtered.filter((p) => {
        const c = Array.isArray(p.instructions) ? p.instructions.filter(Boolean).length : 0;
        if (selectedStepCount === "few") return c <= 3;
        if (selectedStepCount === "medium") return c > 3 && c <= 7;
        if (selectedStepCount === "many") return c > 7;
        return true;
      });
    }
    if (filterIngredients.length > 0) {
      filtered = filtered.filter((p) => {
        if (!Array.isArray(p.ingredients)) return false;
        const ings = p.ingredients
          .filter(Boolean)
          .map((i) => (typeof i === "string" ? i : i.name || "").toLowerCase());
        return filterIngredients.every((fi) => ings.some((ri) => ri.includes(fi.toLowerCase())));
      });
    }

    return search(filtered, debouncedSearch, sortField, sortDirection);
  }, [
    persons,
    debouncedSearch,
    sortField,
    sortDirection,
    selectedRating,
    selectedPrepTime,
    selectedDifficulty,
    selectedIngredientCount,
    selectedStepCount,
    filterIngredients,
  ]);

  useEffect(() => {
    if (filteredResults.length > 0 && (debouncedSearch || hasActiveFilters)) {
      try {
        localStorage.setItem(LAST_SEARCH_RESULTS_KEY, JSON.stringify({
          term: debouncedSearch || "",
          ids: filteredResults.slice(0, 10).map((p) => p.id),
        }));
      } catch {}
    }
  }, [filteredResults, debouncedSearch, hasActiveFilters]);

  const lastFoundData = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(LAST_SEARCH_RESULTS_KEY) || "{}");
      const ids = Array.isArray(raw.ids) ? raw.ids : (Array.isArray(raw) ? raw : []);
      const term = raw.term || "";
      if (ids.length === 0) return { term: "", recipes: [] };
      return {
        term,
        recipes: ids.map((id) => (persons || []).find((p) => p.id === id)).filter(Boolean),
      };
    } catch {
      return { term: "", recipes: [] };
    }
  }, [persons]);

  const showResults = debouncedSearch || hasActiveFilters;

  const filterContent = (
    <div className={parentClasses.dropdownScrollable}>
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>{t("recipesView", "sortByRating")}:</label>
        {["all", "3", "4", "5"].map((v) => (
          <button key={v} className={selectedRating === v ? parentClasses.active : ""} onClick={() => setSelectedRating(v)}>
            {v === "all" ? t("categories", "all") : `★${v}${v !== "5" ? "+" : ""}`}
          </button>
        ))}
      </div>
      <div className={parentClasses.filterDivider} />
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>{t("recipes", "prepTime")}:</label>
        <button className={selectedPrepTime === "all" ? parentClasses.active : ""} onClick={() => setSelectedPrepTime("all")}>{t("categories", "all")}</button>
        <button className={selectedPrepTime === "quick" ? parentClasses.active : ""} onClick={() => setSelectedPrepTime("quick")}>≤15 {t("recipes", "minutes")}</button>
        <button className={selectedPrepTime === "medium" ? parentClasses.active : ""} onClick={() => setSelectedPrepTime("medium")}>15-30 {t("recipes", "minutes")}</button>
        <button className={selectedPrepTime === "long" ? parentClasses.active : ""} onClick={() => setSelectedPrepTime("long")}>30+ {t("recipes", "minutes")}</button>
      </div>
      <div className={parentClasses.filterDivider} />
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>{t("recipes", "difficulty")}:</label>
        {["all", "VeryEasy", "Easy", "Medium", "Hard"].map((v) => (
          <button key={v} className={selectedDifficulty === v ? parentClasses.active : ""} onClick={() => setSelectedDifficulty(v)}>
            {v === "all" ? t("categories", "all") : t("difficulty", v)}
          </button>
        ))}
      </div>
      <div className={parentClasses.filterDivider} />
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>{t("recipesView", "ingredientCount")}:</label>
        <button className={selectedIngredientCount === "all" ? parentClasses.active : ""} onClick={() => setSelectedIngredientCount("all")}>{t("categories", "all")}</button>
        <button className={selectedIngredientCount === "few" ? parentClasses.active : ""} onClick={() => setSelectedIngredientCount("few")}>≤5</button>
        <button className={selectedIngredientCount === "medium" ? parentClasses.active : ""} onClick={() => setSelectedIngredientCount("medium")}>6-10</button>
        <button className={selectedIngredientCount === "many" ? parentClasses.active : ""} onClick={() => setSelectedIngredientCount("many")}>10+</button>
      </div>
      <div className={parentClasses.filterDivider} />
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>{t("recipesView", "stepCount")}:</label>
        <button className={selectedStepCount === "all" ? parentClasses.active : ""} onClick={() => setSelectedStepCount("all")}>{t("categories", "all")}</button>
        <button className={selectedStepCount === "few" ? parentClasses.active : ""} onClick={() => setSelectedStepCount("few")}>≤3</button>
        <button className={selectedStepCount === "medium" ? parentClasses.active : ""} onClick={() => setSelectedStepCount("medium")}>4-7</button>
        <button className={selectedStepCount === "many" ? parentClasses.active : ""} onClick={() => setSelectedStepCount("many")}>7+</button>
      </div>
      <div className={parentClasses.filterDivider} />
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>{t("recipesView", "byIngredients")}:</label>
        <div className={parentClasses.ingredientInputRow}>
          <input type="text" className={parentClasses.ingredientInput} value={ingredientInput} onChange={(e) => setIngredientInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFilterIngredient(); } }} placeholder={t("recipesView", "addIngredient")} />
          <button className={parentClasses.ingredientAddBtn} onClick={addFilterIngredient} type="button">+</button>
        </div>
        {filterIngredients.length > 0 && (
          <div className={parentClasses.ingredientChips}>
            {filterIngredients.map((ing) => (
              <span key={ing} className={parentClasses.ingredientChip}>{ing}<button className={parentClasses.ingredientChipRemove} onClick={() => removeFilterIngredient(ing)}>✕</button></span>
            ))}
          </div>
        )}
      </div>
      {hasActiveFilters && (
        <>
          <div className={parentClasses.filterDivider} />
          <div className={parentClasses.filterSection}>
            <button className={parentClasses.clearFiltersBtn} onClick={clearAllFilters}>{t("recipesView", "clearFilters")}</button>
          </div>
        </>
      )}
    </div>
  );

  if (!open) return null;

  return (
    <>
      {/* Search header */}
      <div className={parentClasses.searchHeader}>
        <div className={`${parentClasses.searchBoxWrapper} ${classes.searchBoxRelative}`} ref={suggestionsRef}>
          <SearchBox
            searchTerm={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              if (val) {
                setShowSuggestions(true);
                setShowRecentSearches(false);
              } else {
                setShowSuggestions(false);
                if (recentSearches.length > 0) setShowRecentSearches(true);
              }
            }}
            onKeyDown={handleSearchKeyDown}
            onFocus={handleSearchFocus}
            placeholder={t("common", "search")}
            examples={[
              t("recipesView", "searchExample1"),
              t("recipesView", "searchExample2"),
              t("recipesView", "searchExample3"),
              t("recipesView", "searchExample4"),
            ]}
            autoFocus
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className={classes.suggestions}>
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  className={classes.suggestionItem}
                  onClick={() => handleSuggestionClick(p)}
                >
                  {p.image_src && (
                    <img src={p.image_src} alt="" className={classes.suggestionImg} />
                  )}
                  <span className={classes.suggestionName}>{p.name}</span>
                </button>
              ))}
            </div>
          )}
          {showRecentSearches && !searchTerm && recentSearches.length > 0 && (
            <div className={classes.suggestions}>
              <div className={classes.recentHeader}>
                <Search size={14} />
                <span>{t("recipesView", "recentSearches") || "חיפושים אחרונים"}</span>
              </div>
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  className={classes.suggestionItem}
                  onClick={() => handleRecentSearchClick(term)}
                >
                  <History size={14} className={classes.recentIcon} />
                  <span className={classes.suggestionName}>{term}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={parentClasses.headerControls}>
          <div className={parentClasses.dropdownContainer} ref={filterRef}>
            <button className={parentClasses.filterButton} onClick={toggleFilterMenu}>
              <Filter size={16} />
              <span className={parentClasses.hideOnMobile}>{t("recipesView", "filter")}</span>
              <ChevronDown size={16} />
            </button>
            {!isMobile && showFilterMenu && (
              <>
                <div className={parentClasses.dropdownOverlay} onClick={() => setShowFilterMenu(false)} />
                <div className={parentClasses.dropdownMenu} style={filterMenuStyle} onClick={(e) => e.stopPropagation()}>
                  <div className={parentClasses.dropdownClose}>
                    {hasActiveFilters && (
                      <button className={parentClasses.clearFiltersBtn} onClick={clearAllFilters}>{t("recipesView", "clearFilters")}</button>
                    )}
                    <CloseButton onClick={() => setShowFilterMenu(false)} />
                  </div>
                  {filterContent}
                </div>
              </>
            )}
            {isMobile && (
              <BottomSheet open={showFilterMenu} onClose={() => setShowFilterMenu(false)} title={t("recipesView", "filter")}>
                {filterContent}
              </BottomSheet>
            )}
          </div>

          <div className={parentClasses.dropdownContainer} ref={sortRef}>
            <button className={parentClasses.sortingButton} onClick={toggleSortMenu}>
              <ArrowUpDown size={16} />
              <span className={parentClasses.hideOnMobile}>{t("recipesView", "sorting")}</span>
              <ChevronDown size={16} />
            </button>
            {!isMobile && showSortMenu && (
              <>
                <div className={parentClasses.dropdownOverlay} onClick={() => setShowSortMenu(false)} />
                <div className={parentClasses.dropdownMenu} style={sortMenuStyle}>
                  <div className={parentClasses.dropdownClose}>
                    <CloseButton onClick={() => setShowSortMenu(false)} />
                  </div>
                  <SortDropdown
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    options={SORT_OPTIONS}
                  />
                </div>
              </>
            )}
            {isMobile && (
              <BottomSheet open={showSortMenu} onClose={() => setShowSortMenu(false)} title={t("recipesView", "sorting")}>
                <SortDropdown
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  options={SORT_OPTIONS}
                />
              </BottomSheet>
            )}
          </div>

          {hasAnythingActive && (
            <button className={classes.clearAllButton} onClick={clearSearch}>
              <RotateCcw size={16} />
              <span className={parentClasses.hideOnMobile}>{t("categories", "clearAllFilters") || "נקה הכל"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      {showCategories && !isAllSelected && selectedCategoryObjects.length > 0 && (
        <div className={parentClasses.filterChips}>
          {selectedCategoryObjects.map((cat) => (
            <button
              key={cat.id}
              className={parentClasses.filterChip}
              style={{ borderColor: cat.color, color: cat.color }}
              onClick={() => toggleCategory?.(cat.id)}
            >
              {getTranslatedGroup?.(cat)} ✕
            </button>
          ))}
          <button
            className={parentClasses.clearChips}
            onClick={clearCategorySelection}
          >
            {t("categories", "clearAllFilters")}
          </button>
        </div>
      )}

      {/* Content */}
      <div>
        {showResults ? (
          <>
            <div className={classes.resultsCount}>
              {filteredResults.length} {t("recipesView", "results") || "תוצאות"}
            </div>
            {filteredResults.length === 0 ? (
              <div className={classes.noResultsBlock}>
                <p className={classes.noResultsTitle}>
                  {t("recipesView", "noResults")}
                </p>
                <p className={classes.noResultsHint}>
                  {t("recipesView", "noResultsHint") || "נסי מילה אחרת או הסירי סינון"}
                </p>
              </div>
            ) : isSimpleView ? (
              <div className={parentClasses.compactList}>
                {filteredResults.map((person) => (
                  <div key={person.id} className={parentClasses.compactItem} onClick={() => handleRecipeClick(person.id)}>
                    <span className={parentClasses.compactName}>{person.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={parentClasses.recipeGrid}>
                {filteredResults.map((person) => (
                  <RecipeInfo
                    key={person.id}
                    person={person}
                    groups={groups}
                    onEdit={onEditPerson}
                    onDelete={onDeletePerson}
                    onToggleFavorite={onToggleFavorite}
                    onCopyRecipe={onCopyRecipe}
                    userRating={userRatings[person.id] || 0}
                    onRate={onRate}
                    onCardClick={handleRecipeClick}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Recent search terms */}
            {recentSearches.length > 0 && (
              <div className={classes.previousSearchesSection}>
                <h3 className={classes.previousSearchesTitle}>
                  <History size={16} />
                  {t("recipesView", "recentSearches") || "חיפושים אחרונים"}
                </h3>
                <div className={classes.previousSearchesList}>
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      className={classes.previousSearchChip}
                      onClick={() => handleRecentSearchClick(term)}
                    >
                      <Search size={14} />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* "Found recently" - last search results */}
            {lastFoundData.recipes.length > 0 && (
              <div className={parentClasses.recentlyViewedSection}>
                <div className={parentClasses.sectionHeader}>
                  <h2 className={parentClasses.sectionTitle}>
                    <Search size={16} style={{ marginInlineEnd: "0.4rem" }} />
                    {t("recipesView", "foundRecently") || "נמצאו לאחרונה"}
                    {lastFoundData.term && (
                      <span className={classes.foundTermLabel}> "{lastFoundData.term}"</span>
                    )}
                  </h2>
                </div>
                <div className={parentClasses.recentlyViewedScroll}>
                  {lastFoundData.recipes.map((person) => (
                    <div key={person.id} className={parentClasses.recentlyViewedCard} onClick={() => handleRecipeClick(person.id)}>
                      {person.image_src && (
                        <img src={person.image_src} alt={person.name} className={parentClasses.recentlyViewedImage} loading="lazy" />
                      )}
                      <span className={parentClasses.recentlyViewedName}>{person.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentSearches.length === 0 && lastFoundData.recipes.length === 0 && (
              <div className={classes.emptyState}>
                <p className={classes.emptyHint}>
                  {t("recipesView", "searchHint") || "חפש מתכון לפי שם, מרכיב או קטגוריה"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default SearchOverlay;
