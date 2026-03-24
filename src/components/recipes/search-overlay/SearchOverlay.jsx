import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../context";
import { search } from "../utils";
import parentClasses from "../recipes-view-new.module.css";
import classes from "./search-overlay.module.css";

import { SearchOverlayContext } from "./SearchOverlayContext";
import SearchHeader from "./SearchHeader";
import SearchContent from "./SearchContent";

const MOBILE_BREAKPOINT = 768;
const RECENT_SEARCHES_KEY = "recentSearchTerms";
const SEARCH_STATE_KEY = "searchOverlayState";
const LAST_SEARCH_RESULTS_KEY = "lastSearchResultIds";

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
  onToggleView,
  onClose,
  onRecipeNavigate,
  showCategories = false,
  selectedCategories = [],
  toggleCategory,
  clearCategorySelection,
  getTranslatedGroup,
  selectedCategoryObjects = [],
  isAllSelected = true,
  hideRating = false,
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
  const [debouncedSearch, setDebouncedSearch] = useState(
    restoredState?.searchTerm || "",
  );
  const [isMobile, setIsMobile] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  const [sortField, setSortField] = useState(
    restoredState?.sortField || "name",
  );
  const [sortDirection, setSortDirection] = useState(
    restoredState?.sortDirection || "asc",
  );
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedPrepTime, setSelectedPrepTime] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedIngredientCount, setSelectedIngredientCount] = useState("all");
  const [selectedStepCount, setSelectedStepCount] = useState("all");
  const [filterIngredients, setFilterIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [searchViewedIds, setSearchViewedIds] = useState(
    restoredState?.searchViewedIds || [],
  );

  const filterRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchInputRef = useRef(null);
  const [filterMenuStyle, setFilterMenuStyle] = useState({});

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus({ preventScroll: true });
    }
  }, [open]);

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

  const handleRecipeClick = useCallback(
    (personId) => {
      const newViewedIds = [
        personId,
        ...searchViewedIds.filter((id) => id !== personId),
      ].slice(0, 8);
      setSearchViewedIds(newViewedIds);
      sessionStorage.setItem(
        SEARCH_STATE_KEY,
        JSON.stringify({
          searchTerm,
          sortField,
          sortDirection,
          searchViewedIds: newViewedIds,
        }),
      );
      if (searchTerm.trim()) saveRecentSearch(searchTerm);
      if (onRecipeNavigate) {
        onRecipeNavigate(personId);
      } else {
        navigate(`/recipe/${personId}`);
      }
    },
    [searchTerm, sortField, sortDirection, searchViewedIds, navigate, onRecipeNavigate],
  );

  useEffect(() => {
    const handleClick = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowRecentSearches(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
    setShowRecentSearches(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) return;
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterMenu(false);
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
    setShowRecentSearches(false);
    if (clearCategorySelection) clearCategorySelection();
  };

  const hasAnythingActive =
    searchTerm ||
    hasActiveFilters ||
    sortField !== "name" ||
    (!isAllSelected && selectedCategoryObjects.length > 0);

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
      filtered = filtered.filter(
        (p) => (parseFloat(p.rating) || 0) >= minRating,
      );
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
        (p) =>
          p.difficulty &&
          p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase(),
      );
    }
    if (selectedIngredientCount !== "all") {
      filtered = filtered.filter((p) => {
        const c = Array.isArray(p.ingredients)
          ? p.ingredients.filter(Boolean).length
          : 0;
        if (selectedIngredientCount === "few") return c <= 5;
        if (selectedIngredientCount === "medium") return c > 5 && c <= 10;
        if (selectedIngredientCount === "many") return c > 10;
        return true;
      });
    }
    if (selectedStepCount !== "all") {
      filtered = filtered.filter((p) => {
        const c = Array.isArray(p.instructions)
          ? p.instructions.filter(Boolean).length
          : 0;
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
        return filterIngredients.every((fi) =>
          ings.some((ri) => ri.includes(fi.toLowerCase())),
        );
      });
    }

    return search(filtered, debouncedSearch, sortField, sortDirection);
  }, [
    persons, debouncedSearch, sortField, sortDirection,
    selectedRating, selectedPrepTime, selectedDifficulty,
    selectedIngredientCount, selectedStepCount, filterIngredients,
  ]);

  useEffect(() => {
    if (filteredResults.length > 0 && (debouncedSearch || hasActiveFilters)) {
      try {
        localStorage.setItem(
          LAST_SEARCH_RESULTS_KEY,
          JSON.stringify({
            term: debouncedSearch || "",
            ids: filteredResults.slice(0, 10).map((p) => p.id),
          }),
        );
      } catch {}
    }
  }, [filteredResults, debouncedSearch, hasActiveFilters]);

  const lastFoundData = useMemo(() => {
    try {
      const raw = JSON.parse(
        localStorage.getItem(LAST_SEARCH_RESULTS_KEY) || "{}",
      );
      const ids = Array.isArray(raw.ids)
        ? raw.ids
        : Array.isArray(raw)
          ? raw
          : [];
      const term = raw.term || "";
      if (ids.length === 0) return { term: "", recipes: [] };
      return {
        term,
        recipes: ids
          .map((id) => (persons || []).find((p) => p.id === id))
          .filter(Boolean),
      };
    } catch {
      return { term: "", recipes: [] };
    }
  }, [persons]);

  const showResults = debouncedSearch || hasActiveFilters;

  const contextValue = {
    // props
    persons, groups, onEditPerson, onDeletePerson, onCopyRecipe, onRate,
    userRatings, onToggleFavorite, isSimpleView, onToggleView, onClose,
    onRecipeNavigate, showCategories, selectedCategories, toggleCategory,
    clearCategorySelection, getTranslatedGroup, selectedCategoryObjects,
    isAllSelected, hideRating,
    // state
    searchTerm, setSearchTerm, debouncedSearch, isMobile,
    recentSearches, setRecentSearches, showRecentSearches, setShowRecentSearches,
    sortField, sortDirection, showFilterMenu, setShowFilterMenu,
    selectedRating, setSelectedRating, selectedPrepTime, setSelectedPrepTime,
    selectedDifficulty, setSelectedDifficulty,
    selectedIngredientCount, setSelectedIngredientCount,
    selectedStepCount, setSelectedStepCount,
    filterIngredients, ingredientInput, setIngredientInput,
    searchViewedIds,
    // refs
    filterRef, suggestionsRef, searchInputRef, filterMenuStyle,
    // computed
    filteredResults, lastFoundData, showResults,
    hasActiveFilters, hasAnythingActive, searchRecentlyViewed,
    // handlers
    handleRecipeClick, handleRecentSearchClick, handleSearchKeyDown,
    handleSearchFocus, handleSortChange, toggleFilterMenu,
    clearAllFilters, clearSearch, addFilterIngredient, removeFilterIngredient,
    // css + i18n
    classes, parentClasses, t,
  };

  if (!open) return null;

  return (
    <SearchOverlayContext.Provider value={contextValue}>
      <SearchHeader />
      <SearchContent />
    </SearchOverlayContext.Provider>
  );
}

export default SearchOverlay;
