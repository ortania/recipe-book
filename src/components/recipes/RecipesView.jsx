import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  ChevronDown,
  Search,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
  ScrollText,
  List as ListIcon,
  History,
  Filter,
  Link,
  ClipboardList,
  Mic,
  ImagePlus,
  Copy,
  Trash2,
  Pencil,
  FilePenLine,
  Settings2,
  UtensilsCrossed,
  ChevronUp,
  Tags,
  SquareMenu,
  Rows4,
  X,
} from "lucide-react";
import RecipeBookIcon from "../icons/RecipeBookIcon/RecipeBookIcon";
import { useRecipeBook, useLanguage } from "../../context";
import useTranslatedList from "../../hooks/useTranslatedList";

import classes from "./recipes-view-new.module.css";

import { RecipeInfo } from "./RecipeInfo";
import { SimpleRecipeInfo } from "./SimpleRecipeInfo";
import { EditRecipe } from "../forms/edit-recipe";
import { SortControls } from "../controls/sort-controls";
import ViewToggle from "../controls/view-toggle";
import ChatWindow from "../chat/ChatWindow";

import { Greeting } from "../greeting";
import { search } from "./utils";
import { AddRecipeDropdown } from "../controls";
import { Fab } from "../controls/fab";
import fabClasses from "../controls/fab/fab.module.css";
import { BottomSheet } from "../controls/bottom-sheet";
import { CloseButton } from "../controls/close-button";
import { BackButton } from "../controls/back-button";
import { SortDropdown } from "../controls/sort-dropdown";
import { SearchBox } from "../controls/search";
import { SearchOverlay } from "./search-overlay";
import { CategoriesManagement } from "../categories-management";
import { getCategoryIcon } from "../../utils/categoryIcons";

const MOBILE_BREAKPOINT = 768;

function RecipesView({
  persons,
  onAddPerson,
  groups = [],
  onEditPerson,
  onDeletePerson,
  selectedGroup,
  onSelectGroup,
  showGreeting = false,
  showAddAndFavorites = true,
  showCategories = true,
  recipesTabLabel,
  emptyTitle,
  hasMoreRecipes: hasMoreRecipesProp,
  onLoadMore,
  onCopyRecipe,
  onRate,
  userRatings = {},
  helpTitle: helpTitleProp,
  helpDescription: helpDescriptionProp,
  helpItems: helpItemsProp,
  defaultSortField = "name",
  defaultSortDirection = "asc",
  sortStorageKey,
  loading = false,
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortField, setSortField] = useState(() => {
    if (sortStorageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(sortStorageKey));
        if (saved?.field) return saved.field;
      } catch {}
    }
    return defaultSortField;
  });
  const [sortDirection, setSortDirection] = useState(() => {
    if (sortStorageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(sortStorageKey));
        if (saved?.direction) return saved.direction;
      } catch {}
    }
    return defaultSortDirection;
  });
  const [editingPerson, setEditingPerson] = useState(null);
  const [localPersons, setLocalPersons] = useState(persons);
  const [isSimpleView, setIsSimpleView] = useState(() => {
    try {
      return localStorage.getItem("recipesSimpleView") === "true";
    } catch {
      return false;
    }
  });
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedPrepTime, setSelectedPrepTime] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedIngredientCount, setSelectedIngredientCount] = useState("all");
  const [selectedStepCount, setSelectedStepCount] = useState("all");
  const [filterIngredients, setFilterIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [activeView, setActiveView] = useState("recipes");
  const [showChat, setShowChat] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSearch, setShowSearch] = useState(() => {
    try {
      if (sessionStorage.getItem("searchOverlayState")) return true;
    } catch {}
    return false;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTabsEl, setMobileTabsEl] = useState(null);
  const [mobileActionsEl, setMobileActionsEl] = useState(null);
  const [showCategoriesSheet, setShowCategoriesSheet] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const [filterMenuStyle, setFilterMenuStyle] = useState({});
  const [sortMenuStyle, setSortMenuStyle] = useState({});
  const {
    hasMoreRecipes: hasMoreRecipesCtx,
    loadMoreRecipes: loadMoreRecipesCtx,
    selectedCategories,
    toggleCategory,
    clearCategorySelection,
    setIsSearchActive,
    categories,
    recipes,
    addCategory,
    editCategory,
    deleteCategory,
    reorderCategories,
    sortCategoriesAlphabetically,
  } = useRecipeBook();

  const hasMoreRecipes = hasMoreRecipesProp ?? hasMoreRecipesCtx;
  const loadMoreRecipes = onLoadMore || loadMoreRecipesCtx;

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    try {
      sessionStorage.removeItem("searchOverlayState");
    } catch {}
  }, []);

  useEffect(() => {
    setIsSearchActive(showSearch);
    return () => setIsSearchActive(false);
  }, [showSearch, setIsSearchActive]);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => {
      setIsMobile(mql.matches);
      setMobileTabsEl(
        mql.matches ? document.getElementById("mobile-tabs-portal") : null,
      );
      setMobileActionsEl(
        mql.matches
          ? document.getElementById("mobile-header-actions-portal")
          : null,
      );
    };
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (sortStorageKey) {
      localStorage.setItem(
        sortStorageKey,
        JSON.stringify({ field: sortField, direction: sortDirection }),
      );
    }
  }, [sortField, sortDirection, sortStorageKey]);

  // Filtered persons based on favorites toggle
  const displayPersons = useMemo(() => {
    if (!showFavoritesOnly) return localPersons;
    return localPersons.filter((p) => p.isFavorite);
  }, [localPersons, showFavoritesOnly]);

  // Recently viewed recipes – placeholder, computed after filters are applied
  const recentlyViewedStoredIds = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("recentlyViewedRecipes") || "[]");
    } catch {
      return [];
    }
  }, [localPersons]);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === "chat") {
      setShowChat(true);
    } else {
      setShowChat(false);
    }
  };

  useEffect(() => {
    if (showChat) {
      document.body.classList.add("chat-open");
      window.scrollTo({ top: 0 });
      document.querySelector("main")?.scrollTo({ top: 0 });
    } else {
      document.body.classList.remove("chat-open");
    }
    return () => document.body.classList.remove("chat-open");
  }, [showChat]);

  // Update local persons when the prop changes
  useEffect(() => {
    setLocalPersons(persons);
  }, [persons]);

  const calcDropdownPos = (ref) => {
    if (!ref.current) return {};
    if (window.innerWidth <= 700) return {};
    const rect = ref.current.getBoundingClientRect();
    const isRtl = document.documentElement.dir === "rtl";
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuWidth = 260;
    const pad = 8;
    const style = { top: rect.bottom + 4 };

    if (isRtl) {
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

  // Lock body scroll only on desktop when dropdown is open.
  // On mobile we rely on the bottom-sheet styles and let the page scroll normally
  // so that the filter window itself יהיה ניתן לגלילה.
  useEffect(() => {
    const isDesktop = window.innerWidth > 700;

    if (isDesktop && (showFilterMenu || showSortMenu)) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow || "";
      };
    }

    if (isDesktop) {
      document.body.style.overflow = "";
    }
  }, [showFilterMenu, showSortMenu]);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // search, filter and sort
  const filteredAndSortedPersons = useMemo(() => {
    let filtered = displayPersons;

    // Filter by rating
    if (selectedRating !== "all") {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter((person) => {
        const rating = parseFloat(person.rating) || 0;
        return rating >= minRating;
      });
    }

    // Filter by prep time
    if (selectedPrepTime !== "all") {
      filtered = filtered.filter((person) => {
        // Extract number from text like "15 min" or "15 דקות"
        const prepTimeMatch = person.prepTime?.match(/\d+/);
        const prepTime = prepTimeMatch ? parseInt(prepTimeMatch[0]) : 0;
        switch (selectedPrepTime) {
          case "quick":
            return prepTime <= 15;
          case "medium":
            return prepTime > 15 && prepTime <= 30;
          case "long":
            return prepTime > 30;
          default:
            return true;
        }
      });
    }

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((person) => {
        if (!person.difficulty) return false;
        return (
          person.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
        );
      });
    }

    // Filter by ingredient count
    if (selectedIngredientCount !== "all") {
      filtered = filtered.filter((person) => {
        const count = Array.isArray(person.ingredients)
          ? person.ingredients.filter(Boolean).length
          : 0;
        switch (selectedIngredientCount) {
          case "few":
            return count <= 5;
          case "medium":
            return count > 5 && count <= 10;
          case "many":
            return count > 10;
          default:
            return true;
        }
      });
    }

    // Filter by step count
    if (selectedStepCount !== "all") {
      filtered = filtered.filter((person) => {
        const count = Array.isArray(person.instructions)
          ? person.instructions.filter(Boolean).length
          : 0;
        switch (selectedStepCount) {
          case "few":
            return count <= 3;
          case "medium":
            return count > 3 && count <= 7;
          case "many":
            return count > 7;
          default:
            return true;
        }
      });
    }

    // Filter by ingredients
    if (filterIngredients.length > 0) {
      filtered = filtered.filter((person) => {
        if (!Array.isArray(person.ingredients)) return false;
        const recipeIngs = person.ingredients
          .filter(Boolean)
          .map((i) => (typeof i === "string" ? i : i.name || "").toLowerCase());
        return filterIngredients.every((fi) =>
          recipeIngs.some((ri) => ri.includes(fi.toLowerCase())),
        );
      });
    }

    // Search and sort
    let result = search(filtered, debouncedSearch, sortField, sortDirection);

    // Sort by favorites
    if (sortField === "favorites") {
      result = [...result].sort((a, b) => {
        const aFav = a.isFavorite ? 1 : 0;
        const bFav = b.isFavorite ? 1 : 0;
        return sortDirection === "asc" ? bFav - aFav : aFav - bFav;
      });
    }

    // Sort by recently viewed
    if (sortField === "recentlyViewed") {
      try {
        const stored = JSON.parse(
          localStorage.getItem("recentlyViewedRecipes") || "[]",
        );
        result = [...result].sort((a, b) => {
          const aIdx = stored.indexOf(a.id);
          const bIdx = stored.indexOf(b.id);
          const aVal = aIdx === -1 ? 9999 : aIdx;
          const bVal = bIdx === -1 ? 9999 : bIdx;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        });
      } catch {}
    }

    return result;
  }, [
    displayPersons,
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

  const recentlyViewed = useMemo(() => {
    const filteredIds = new Set(filteredAndSortedPersons.map((p) => p.id));
    return recentlyViewedStoredIds
      .filter((id) => filteredIds.has(id))
      .map((id) => filteredAndSortedPersons.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 6);
  }, [filteredAndSortedPersons, recentlyViewedStoredIds]);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

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

  const handleSaveEdit = (updatedPerson) => {
    // Pass the updated person directly to the parent component
    onEditPerson(updatedPerson);

    // Also update the local state to reflect changes immediately
    setLocalPersons((prev) =>
      prev.map((person) =>
        person.id === updatedPerson.id ? updatedPerson : person,
      ),
    );

    // Update editingPerson with saved data so further edits start from saved state
    setEditingPerson(updatedPerson);
  };

  const handleToggleFavorite = useCallback(
    (personId, isFavorite) => {
      setLocalPersons((prev) => {
        const personToUpdate = prev.find((p) => p.id === personId);
        if (!personToUpdate) return prev;
        const updatedPerson = { ...personToUpdate, isFavorite };
        onEditPerson(updatedPerson);
        return prev.map((p) => (p.id === personId ? updatedPerson : p));
      });
    },
    [onEditPerson],
  );

  const handleEditClick = useCallback((person) => {
    setEditingPerson(person);
  }, []);

  const toggleView = () => {
    setIsSimpleView((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("recipesSimpleView", String(next));
      } catch {}
      return next;
    });
  };

  const { getTranslated: getTranslatedGroup } = useTranslatedList(
    groups,
    "name",
  );
  /* ── Shared filter/sort content for dropdown (desktop) + BottomSheet (mobile) ── */
  const filterContent = (
    <div className={classes.dropdownScrollable}>
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>
          {t("recipesView", "sortByRating")}:
        </label>
        {["all", "3", "4", "5"].map((v) => (
          <button
            key={v}
            className={selectedRating === v ? classes.active : ""}
            onClick={() => setSelectedRating(v)}
          >
            {v === "all"
              ? t("categories", "all")
              : `★${v}${v !== "5" ? "+" : ""}`}
          </button>
        ))}
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>
          {t("recipes", "prepTime")}:
        </label>
        <button
          className={selectedPrepTime === "all" ? classes.active : ""}
          onClick={() => setSelectedPrepTime("all")}
        >
          {t("categories", "all")}
        </button>
        <button
          className={selectedPrepTime === "quick" ? classes.active : ""}
          onClick={() => setSelectedPrepTime("quick")}
        >
          ≤15 {t("recipes", "minutes")}
        </button>
        <button
          className={selectedPrepTime === "medium" ? classes.active : ""}
          onClick={() => setSelectedPrepTime("medium")}
        >
          15-30 {t("recipes", "minutes")}
        </button>
        <button
          className={selectedPrepTime === "long" ? classes.active : ""}
          onClick={() => setSelectedPrepTime("long")}
        >
          30+ {t("recipes", "minutes")}
        </button>
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>
          {t("recipes", "difficulty")}:
        </label>
        {["all", "VeryEasy", "Easy", "Medium", "Hard"].map((v) => (
          <button
            key={v}
            className={selectedDifficulty === v ? classes.active : ""}
            onClick={() => setSelectedDifficulty(v)}
          >
            {v === "all" ? t("categories", "all") : t("difficulty", v)}
          </button>
        ))}
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>
          {t("recipesView", "ingredientCount")}:
        </label>
        <button
          className={selectedIngredientCount === "all" ? classes.active : ""}
          onClick={() => setSelectedIngredientCount("all")}
        >
          {t("categories", "all")}
        </button>
        <button
          className={selectedIngredientCount === "few" ? classes.active : ""}
          onClick={() => setSelectedIngredientCount("few")}
        >
          ≤5
        </button>
        <button
          className={selectedIngredientCount === "medium" ? classes.active : ""}
          onClick={() => setSelectedIngredientCount("medium")}
        >
          6-10
        </button>
        <button
          className={selectedIngredientCount === "many" ? classes.active : ""}
          onClick={() => setSelectedIngredientCount("many")}
        >
          10+
        </button>
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>
          {t("recipesView", "stepCount")}:
        </label>
        <button
          className={selectedStepCount === "all" ? classes.active : ""}
          onClick={() => setSelectedStepCount("all")}
        >
          {t("categories", "all")}
        </button>
        <button
          className={selectedStepCount === "few" ? classes.active : ""}
          onClick={() => setSelectedStepCount("few")}
        >
          ≤3
        </button>
        <button
          className={selectedStepCount === "medium" ? classes.active : ""}
          onClick={() => setSelectedStepCount("medium")}
        >
          4-7
        </button>
        <button
          className={selectedStepCount === "many" ? classes.active : ""}
          onClick={() => setSelectedStepCount("many")}
        >
          7+
        </button>
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>
          {t("recipesView", "byIngredients")}:
        </label>
        <div className={classes.ingredientInputRow}>
          <input
            type="text"
            className={classes.ingredientInput}
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFilterIngredient();
              }
            }}
            placeholder={t("recipesView", "addIngredient")}
          />
          <button
            className={classes.ingredientAddBtn}
            onClick={addFilterIngredient}
            type="button"
          >
            +
          </button>
        </div>
        {filterIngredients.length > 0 && (
          <div className={classes.ingredientChips}>
            {filterIngredients.map((ing) => (
              <span key={ing} className={classes.ingredientChip}>
                {ing}
                <button
                  className={classes.ingredientChipRemove}
                  onClick={() => removeFilterIngredient(ing)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      {hasActiveFilters && (
        <>
          <div className={classes.filterDivider} />
          <div className={classes.filterSection}>
            <button
              className={classes.clearFiltersBtn}
              onClick={clearAllFilters}
            >
              {t("recipesView", "clearFilters")}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const recipeSortOptions = [
    { field: "name", defaultDir: "asc" },
    { field: "newest", defaultDir: "desc", lockedDir: "desc" },
    { field: "prepTime", defaultDir: "asc" },
    { field: "difficulty", defaultDir: "asc" },
    { field: "rating", defaultDir: "desc" },
    { field: "favorites", defaultDir: "desc" },
    { field: "recentlyViewed", defaultDir: "desc", lockedDir: "desc" },
  ];

  const handleRecipeSortChange = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const viewToggleElement = (
    <ViewToggle
      activeView={activeView}
      onViewChange={handleViewChange}
      recipesLabel={recipesTabLabel}
    />
  );

  const isAllSelected = selectedCategories.includes("all");
  const selectedCount = isAllSelected ? 0 : selectedCategories.length;

  const getGroupContacts = (groupId) => {
    if (groupId === "all") return recipes;
    if (groupId === "general") {
      return recipes.filter((r) => !r.categories || r.categories.length === 0);
    }
    return recipes.filter(
      (r) => r.categories && r.categories.includes(groupId),
    );
  };

  const mobileHeaderActions = (
    <>
      <button
        className={classes.mobileHeaderBtn}
        onClick={() => setShowCategoriesSheet(true)}
        title={t("nav", "categories")}
      >
        <Tags size={20} />

        {/* {!isAllSelected && selectedCount > 0 && (
          <span className={classes.mobileHeaderBadge}>{selectedCount}</span>
        )} */}
      </button>
      <button
        className={classes.mobileHeaderBtn}
        onClick={toggleView}
        title={
          isSimpleView
            ? t("recipesView", "gridView")
            : t("recipesView", "listView")
        }
      >
        {isSimpleView ? <LayoutGrid size={20} /> : <Rows4 size={20} />}
      </button>
    </>
  );

  const selectedCategoryObjects = isAllSelected
    ? []
    : selectedCategories
        .map((id) => groups.find((g) => g.id === id))
        .filter(Boolean);

  const hasSelectedCategories = !isAllSelected && selectedCategories.length > 0;

  if (!persons || (persons.length === 0 && !hasSelectedCategories)) {
    return (
      <div
        className={`${classes.recipesContainer} ${showChat ? classes.chatMode : ""}`}
      >
        {mobileTabsEl && createPortal(viewToggleElement, mobileTabsEl)}
        {mobileActionsEl && createPortal(mobileHeaderActions, mobileActionsEl)}
        <div className={classes.viewToggleWrapper}>
          <span className={classes.desktopOnly}>
            <AddRecipeDropdown onSelect={(method) => onAddPerson(method)} />
          </span>
          {!mobileTabsEl && (
            <div className={classes.viewToggle}>{viewToggleElement}</div>
          )}
        </div>

        <div style={{ display: showChat ? "block" : "none" }}>
          <ChatWindow showImageButton showGreeting={showGreeting} />
        </div>

        <div style={{ display: showChat ? "none" : "block" }}>
          {showGreeting && (
            <div className={classes.headerTitle}>
              <Greeting />
            </div>
          )}

          {selectedCategoryObjects.length > 0 && (
            <div className={classes.selectedCategoriesList}>
              {selectedCategoryObjects.map((cat) => (
                <span key={cat.id} className={classes.selectedCategoryTag}>
                  {getTranslatedGroup(cat)}
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <div className={classes.loadingState}>
              <span className={classes.loadingSpinner} />
              <p className={classes.loadingText}>
                {t("common", "loading") || "Loading..."}
              </p>
            </div>
          ) : (
            <div className={classes.emptyState}>
              <RecipeBookIcon width={72} height={72} />
              <p className={classes.emptyText}>
                {emptyTitle || t("recipesView", "emptyTitle")}
              </p>
              {showAddAndFavorites && (
                <AddRecipeDropdown onSelect={(method) => onAddPerson(method)}>
                  <span className={classes.emptyButton}>
                    {t("recipesView", "addNewRecipe")}
                  </span>
                </AddRecipeDropdown>
              )}
            </div>
          )}
        </div>

        {showAddAndFavorites && !showChat && (
          <Fab label={t("recipesView", "addNewRecipe")}>
            <AddRecipeMenu onSelect={onAddPerson} t={t} />
          </Fab>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${classes.recipesContainer} ${showChat ? classes.chatMode : ""}`}
    >
      {mobileTabsEl && createPortal(viewToggleElement, mobileTabsEl)}
      {mobileActionsEl && createPortal(mobileHeaderActions, mobileActionsEl)}

      <div className={classes.stickyTop}>
        <div className={classes.viewToggleWrapper}>
          <span className={classes.desktopOnly}>
            <AddRecipeDropdown onSelect={(method) => onAddPerson(method)} />
          </span>
          {!mobileTabsEl && (
            <div className={classes.viewToggle}>{viewToggleElement}</div>
          )}
          <div className={classes.desktopHeaderActions}>
            <button
              className={classes.desktopHeaderBtn}
              onClick={() => setShowCategoriesSheet(true)}
              title={t("nav", "categories")}
            >
              <Tags size={28} />
       
              {/* {!isAllSelected && selectedCount > 0 && (
                <span className={classes.mobileHeaderBadge}>
                  {selectedCount}
                </span>
              )} */}
            </button>
            <button
              className={classes.desktopHeaderBtn}
              onClick={toggleView}
              title={
                isSimpleView
                  ? t("recipesView", "gridView")
                  : t("recipesView", "listView")
              }
            >
              {isSimpleView ? (
                <LayoutGrid size={28} />
              ) : (
                <Rows4 size={28} />
              )}
            </button>
          </div>
        </div>

        {showGreeting && !showSearch && (
          <div
            className={classes.headerTitle}
            style={{ display: showChat ? "none" : undefined }}
          >
            <Greeting />
          </div>
        )}

        {!showChat && (persons.length > 0 || hasSelectedCategories) && (
          <div
            className={classes.searchHeader}
            style={{ display: showSearch ? "none" : undefined }}
          >
            {showAddAndFavorites && (
              <button
                onClick={() => setShowFavoritesOnly((prev) => !prev)}
                title={t("recipes", "favorite")}
                className={`${classes.favoritesBtn} ${showFavoritesOnly ? classes.favoritesActive : ""}`}
              >
                {showFavoritesOnly ? (
                  <Heart size={22} strokeWidth={1.5} fill="red" stroke="red" />
                ) : (
                  <Heart size={22} strokeWidth={1.5} />
                )}
              </button>
            )}
            <button
              className={classes.searchTrigger}
              onClick={() => setShowSearch(true)}
            >
              <Search size={16} className={classes.searchTriggerIcon} />
              <span className={classes.searchTriggerText}>
                {t("common", "search")}
              </span>
            </button>
            <div className={classes.headerControls}>
              <div className={classes.dropdownContainer} ref={sortRef}>
                <button
                  className={classes.sortingButton}
                  onClick={toggleSortMenu}
                >
                  <ArrowUpDown size={16} />{" "}
                  <span className={classes.hideOnMobile}>
                    {t("recipesView", "sorting")}
                  </span>{" "}
                  {/* <ChevronDown size={16} /> */}
                </button>
                {!isMobile && showSortMenu && (
                  <>
                    <div
                      className={classes.dropdownOverlay}
                      onClick={() => setShowSortMenu(false)}
                    />
                    <div className={classes.dropdownMenu} style={sortMenuStyle}>
                      <div className={classes.dropdownClose}>
                        <CloseButton onClick={() => setShowSortMenu(false)} />
                      </div>
                      <SortDropdown
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSortChange={handleRecipeSortChange}
                        options={recipeSortOptions}
                      />
                    </div>
                  </>
                )}
                {isMobile && (
                  <BottomSheet
                    open={showSortMenu}
                    onClose={() => setShowSortMenu(false)}
                    title={t("recipesView", "sorting")}
                  >
                    <SortDropdown
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSortChange={handleRecipeSortChange}
                      options={recipeSortOptions}
                    />
                  </BottomSheet>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showSearch ? (
        <SearchOverlay
          open={showSearch}
          persons={localPersons}
          groups={groups}
          onEditPerson={(person) => {
            closeSearch();
            setEditingPerson(person);
          }}
          onDeletePerson={onDeletePerson}
          onCopyRecipe={onCopyRecipe}
          onRate={onRate}
          userRatings={userRatings}
          onToggleFavorite={handleToggleFavorite}
          isSimpleView={isSimpleView}
          onClose={closeSearch}
          showCategories={showCategories}
          selectedCategories={selectedCategories}
          toggleCategory={toggleCategory}
          clearCategorySelection={clearCategorySelection}
          getTranslatedGroup={getTranslatedGroup}
          selectedCategoryObjects={selectedCategoryObjects}
          isAllSelected={isAllSelected}
        />
      ) : showChat ? (
        <ChatWindow showImageButton showGreeting={showGreeting} />
      ) : (
        <div>
          {recentlyViewed.length > 0 && (
            <div className={classes.recentlyViewedSection}>
              <div className={classes.sectionHeader}>
                <h2 className={classes.sectionTitle}>
                  <History size={16} style={{ marginInlineEnd: "0.4rem" }} />
                  {t("recipesView", "recentlyViewed")}
                </h2>
              </div>
              <div className={classes.recentlyViewedScroll}>
                {recentlyViewed.map((person) => (
                  <div
                    key={person.id}
                    className={classes.recentlyViewedCard}
                    onClick={() => navigate(`/recipe/${person.id}`)}
                  >
                    {person.image_src && (
                      <img
                        src={person.image_src}
                        alt={person.name}
                        className={classes.recentlyViewedImage}
                        loading="lazy"
                      />
                    )}
                    <span className={classes.recentlyViewedName}>
                      {person.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showCategories &&
            !isAllSelected &&
            selectedCategoryObjects.length > 0 && (
              <div className={classes.filterChips}>
                {selectedCategoryObjects.map((cat) => (
                  <button
                    key={cat.id}
                    className={classes.filterChip}
                    style={{ borderColor: cat.color, color: cat.color }}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {getTranslatedGroup(cat)} ✕
                  </button>
                ))}
                <button
                  className={classes.clearChips}
                  onClick={clearCategorySelection}
                >
                  {t("categories", "clearAllFilters")}
                </button>
              </div>
            )}

          {editingPerson && (
            <EditRecipe
              person={editingPerson}
              onSave={handleSaveEdit}
              onCancel={() => setEditingPerson(null)}
              groups={groups}
            />
          )}

          {filteredAndSortedPersons.length === 0 ? (
            <div className={classes.noResults}>
              {showFavoritesOnly
                ? t("favorites", "noFavorites")
                : t("recipesView", "noResults")}
            </div>
          ) : showCategories && selectedGroup === "all" ? (
            <div>
              {groups
                .filter((group) => group.id !== "all" && group.id !== "general")
                .map((group) => {
                  const groupRecipes = filteredAndSortedPersons.filter(
                    (person) =>
                      person.categories && person.categories.includes(group.id),
                  );
                  if (groupRecipes.length === 0) return null;
                  const displayRecipes = groupRecipes.slice(0, 8);
                  return (
                    <div key={group.id} className={classes.categorySection}>
                      <div className={classes.sectionHeader}>
                        <h2 className={classes.sectionTitle}>
                          {getTranslatedGroup(group)}
                        </h2>
                        {groupRecipes.length > 8 && (
                          <button
                            className={classes.seeMore}
                            onClick={() =>
                              onSelectGroup && onSelectGroup(group.id)
                            }
                          >
                            {t("categories", "seeMore")}
                          </button>
                        )}
                      </div>
                      {isSimpleView ? (
                        <div className={classes.compactList}>
                          {displayRecipes.map((person) => (
                            <div
                              key={person.id}
                              className={classes.compactItem}
                              onClick={() => navigate(`/recipe/${person.id}`)}
                            >
                              {person.image || person.image_src ? (
                                <img
                                  src={person.image || person.image_src}
                                  alt=""
                                  className={classes.compactThumb}
                                />
                              ) : (
                                <span
                                  className={classes.compactThumbPlaceholder}
                                >
                                  <UtensilsCrossed size={16} />
                                </span>
                              )}
                              <span className={classes.compactName}>
                                {person.name}
                              </span>
                              {showAddAndFavorites && (
                                <div className={classes.compactActions}>
                                  <button
                                    className={classes.compactActionBtn}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(person);
                                    }}
                                    title="Edit"
                                  >
                                    <FilePenLine size={16} />
                                  </button>
                                  <button
                                    className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeletePerson(person.id);
                                    }}
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={classes.recipeGrid}>
                          {displayRecipes.map((person) => (
                            <RecipeInfo
                              key={person.id}
                              person={person}
                              groups={groups}
                              onEdit={handleEditClick}
                              onDelete={onDeletePerson}
                              onToggleFavorite={handleToggleFavorite}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              {(() => {
                const uncategorizedRecipes = filteredAndSortedPersons.filter(
                  (person) =>
                    !person.categories || person.categories.length === 0,
                );
                if (uncategorizedRecipes.length === 0) return null;
                const displayRecipes = uncategorizedRecipes.slice(0, 8);
                return (
                  <div key="general" className={classes.categorySection}>
                    <div className={classes.sectionHeader}>
                      <h2 className={classes.sectionTitle}>
                        {t("categories", "general")}
                      </h2>
                      {uncategorizedRecipes.length > 8 && (
                        <span className={classes.recipeCount}>
                          {uncategorizedRecipes.length} recipes
                        </span>
                      )}
                    </div>
                    {isSimpleView ? (
                      <div className={classes.compactList}>
                        {displayRecipes.map((person) => (
                          <div
                            key={person.id}
                            className={classes.compactItem}
                            onClick={() => navigate(`/recipe/${person.id}`)}
                          >
                            {person.image || person.image_src ? (
                              <img
                                src={person.image || person.image_src}
                                alt=""
                                className={classes.compactThumb}
                              />
                            ) : (
                              <span className={classes.compactThumbPlaceholder}>
                                <UtensilsCrossed size={16} />
                              </span>
                            )}
                            <span className={classes.compactName}>
                              {person.name}
                            </span>
                            {showAddAndFavorites && (
                              <div className={classes.compactActions}>
                                <button
                                  className={classes.compactActionBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(person);
                                  }}
                                  title="Edit"
                                >
                                  <FilePenLine size={16} />
                                </button>
                                <button
                                  className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeletePerson(person.id);
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={classes.recipeGrid}>
                        {displayRecipes.map((person) => (
                          <RecipeInfo
                            key={person.id}
                            person={person}
                            groups={groups}
                            onEdit={handleEditClick}
                            onDelete={onDeletePerson}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : isSimpleView ? (
            <div className={classes.compactList}>
              {filteredAndSortedPersons.map((person) => (
                <div
                  key={person.id}
                  className={classes.compactItem}
                  onClick={() => navigate(`/recipe/${person.id}`)}
                >
                  {person.image || person.image_src ? (
                    <img
                      src={person.image || person.image_src}
                      alt=""
                      className={classes.compactThumb}
                    />
                  ) : (
                    <span className={classes.compactThumbPlaceholder}>
                      <UtensilsCrossed size={16} />
                    </span>
                  )}
                  <span className={classes.compactName}>{person.name}</span>
                  {showAddAndFavorites && (
                    <div className={classes.compactActions}>
                      <button
                        className={classes.compactActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(person);
                        }}
                        title="Edit"
                      >
                        <FilePenLine size={16} />
                      </button>
                      <button
                        className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePerson(person.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  {onCopyRecipe && (
                    <div className={classes.compactActions}>
                      <button
                        className={classes.compactActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyRecipe(person.id);
                        }}
                        title={t("globalRecipes", "copyToMyRecipes")}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={classes.recipeGrid}>
              {filteredAndSortedPersons.map((person) => (
                <RecipeInfo
                  key={person.id}
                  person={person}
                  groups={groups}
                  onEdit={onEditPerson ? handleEditClick : undefined}
                  onDelete={onDeletePerson}
                  onToggleFavorite={
                    showAddAndFavorites ? handleToggleFavorite : undefined
                  }
                  onCopyRecipe={onCopyRecipe}
                  onRate={onRate}
                  userRating={userRatings[person.id] || 0}
                />
              ))}
            </div>
          )}

          {hasMoreRecipes && (
            <div className={classes.loadMoreContainer}>
              <button
                className={classes.loadMoreButton}
                onClick={loadMoreRecipes}
              >
                {t("recipesView", "loadMore")}
              </button>
            </div>
          )}
        </div>
      )}

      {showAddAndFavorites && !showChat && !showSearch && (
        <Fab label={t("recipesView", "addNewRecipe")}>
          <AddRecipeMenu onSelect={onAddPerson} t={t} />
        </Fab>
      )}

      {isMobile ? (
        <BottomSheet
          open={showCategoriesSheet}
          onClose={() => setShowCategoriesSheet(false)}
          title={t("nav", "categories")}
        >
          <CategoriesSheetContent
            classes={classes}
            categories={categories}
            categorySearch={categorySearch}
            setCategorySearch={setCategorySearch}
            clearCategorySelection={clearCategorySelection}
            isAllSelected={isAllSelected}
            selectedCount={selectedCount}
            selectedCategories={selectedCategories}
            toggleCategory={toggleCategory}
            getTranslatedGroup={getTranslatedGroup}
            getGroupContacts={getGroupContacts}
            getCategoryIcon={getCategoryIcon}
            setShowCategoriesSheet={setShowCategoriesSheet}
            setShowManagement={setShowManagement}
            t={t}
          />
        </BottomSheet>
      ) : (
        showCategoriesSheet && (
          <>
            <div
              className={classes.categoriesPopupOverlay}
              onClick={() => setShowCategoriesSheet(false)}
            />
            <div className={classes.categoriesPopup}>
              <div className={classes.categoriesPopupHeader}>
                <span className={classes.categoriesPopupTitle}>
                  {t("nav", "categories")}
                </span>
                <button
                  className={classes.categoriesPopupClose}
                  onClick={() => setShowCategoriesSheet(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <CategoriesSheetContent
                classes={classes}
                categories={categories}
                categorySearch={categorySearch}
                setCategorySearch={setCategorySearch}
                clearCategorySelection={clearCategorySelection}
                isAllSelected={isAllSelected}
                selectedCount={selectedCount}
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
                getTranslatedGroup={getTranslatedGroup}
                getGroupContacts={getGroupContacts}
                getCategoryIcon={getCategoryIcon}
                setShowCategoriesSheet={setShowCategoriesSheet}
                setShowManagement={setShowManagement}
                t={t}
              />
            </div>
          </>
        )
      )}

      {showManagement && (
        <CategoriesManagement
          categories={categories}
          onClose={() => setShowManagement(false)}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
          onSortAlphabetically={sortCategoriesAlphabetically}
          getGroupContacts={getGroupContacts}
        />
      )}
    </div>
  );
}

function CategoriesSheetContent({
  classes,
  categories,
  categorySearch,
  setCategorySearch,
  clearCategorySelection,
  isAllSelected,
  selectedCount,
  selectedCategories,
  toggleCategory,
  getTranslatedGroup,
  getGroupContacts,
  getCategoryIcon,
  setShowCategoriesSheet,
  setShowManagement,
  t,
}) {
  return (
    <div className={classes.categoriesSheetContent}>
      <div className={classes.categoriesSheetSearch}>
        <SearchBox
          searchTerm={categorySearch}
          onSearchChange={(val) => {
            setCategorySearch(val);
            if (!val) clearCategorySelection();
          }}
          placeholder={t("categories", "searchCategory")}
          size="small"
        />
      </div>

      {!isAllSelected && selectedCount > 0 && (
        <div className={classes.categoriesSheetActiveBar}>
          <span className={classes.categoriesSheetActiveCount}>
            {selectedCount} {t("categories", "selected") || "נבחרו"}
          </span>
          <button
            className={classes.categoriesSheetClear}
            onClick={clearCategorySelection}
          >
            {t("categories", "clear")}
          </button>
        </div>
      )}

      <div className={classes.categoriesSheetList}>
        {categories
          .filter((group) => {
            if (!categorySearch.trim()) return true;
            const term = categorySearch.trim().toLowerCase();
            const name =
              group.id === "all"
                ? t("categories", "allRecipes").toLowerCase()
                : (getTranslatedGroup(group) || "").toLowerCase();
            return name.includes(term);
          })
          .map((group) => {
            const isSelected = selectedCategories.includes(group.id);
            const IconComp =
              group.id === "all"
                ? UtensilsCrossed
                : getCategoryIcon(group.icon);
            return (
              <button
                key={group.id}
                className={`${classes.categorySheetItem} ${isSelected ? classes.categorySheetActive : ""}`}
                onClick={() => toggleCategory(group.id)}
                style={
                  isSelected
                    ? {
                        borderColor: group.color,
                        backgroundColor: `${group.color}15`,
                      }
                    : undefined
                }
              >
                <span className={classes.categorySheetLabel}>
                  <span
                    className={classes.categorySheetIcon}
                    style={{
                      backgroundColor: `${group.color}18`,
                      color: group.color,
                    }}
                  >
                    <IconComp size={18} />
                  </span>
                  <span className={classes.categorySheetName}>
                    {group.id === "all"
                      ? t("categories", "allRecipes")
                      : getTranslatedGroup(group)}
                  </span>
                </span>
                <span className={classes.categorySheetCountNum}>
                  {getGroupContacts(group.id).length}
                </span>
              </button>
            );
          })}
      </div>

      <button
        className={classes.categoryManageBtn}
        onClick={() => {
          setShowCategoriesSheet(false);
          setShowManagement(true);
        }}
      >
        <Settings2 size={16} />
        {t("categories", "manage")}
      </button>
    </div>
  );
}

function AddRecipeMenu({ onSelect, t }) {
  return (
    <div className={fabClasses.menu}>
      <button className={fabClasses.menuItem} onClick={() => onSelect("photo")}>
        <span className={fabClasses.menuLabel}>
          {t("addWizard", "fromPhoto")}
        </span>
        <span className={fabClasses.menuIcon}>
          <ImagePlus size={20} />
        </span>
      </button>
      <button className={fabClasses.menuItem} onClick={() => onSelect("url")}>
        <span className={fabClasses.menuLabel}>
          {t("addWizard", "fromUrl")}
        </span>
        <span className={fabClasses.menuIcon}>
          <Link size={20} />
        </span>
      </button>
      <button className={fabClasses.menuItem} onClick={() => onSelect("text")}>
        <span className={fabClasses.menuLabel}>
          {t("addWizard", "fromText")}
        </span>
        <span className={fabClasses.menuIcon}>
          <ClipboardList size={20} />
        </span>
      </button>
      <button
        className={fabClasses.menuItem}
        onClick={() => onSelect("recording")}
      >
        <span className={fabClasses.menuLabel}>
          {t("addWizard", "fromRecording")}
        </span>
        <span className={fabClasses.menuIcon}>
          <Mic size={20} />
        </span>
      </button>
      <button
        className={fabClasses.menuItem}
        onClick={() => onSelect("manual")}
      >
        <span className={fabClasses.menuLabel}>{t("addWizard", "manual")}</span>
        <span className={fabClasses.menuIcon}>
          <FilePenLine size={20} />
        </span>
      </button>
    </div>
  );
}

export { RecipesView };
export default RecipesView;
