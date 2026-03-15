import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Search,
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
  Users,
  UserCheck,
  Bookmark,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
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
import { SortButton } from "../controls/sort-button";
import { SearchBox } from "../controls/search";
import { SearchOverlay } from "./search-overlay";
import { CategoriesManagement } from "../categories-management";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { CategoriesSheetContent } from "../categories-sheet-content";

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
  onSaveRecipe,
  savedRecipes = [],
  onRate,
  userRatings = {},
  helpTitle: helpTitleProp,
  helpDescription: helpDescriptionProp,
  helpItems: helpItemsProp,
  defaultSortField = "name",
  defaultSortDirection = "asc",
  sortStorageKey,
  loading = false,
  backAction,
  showTabs = true,
  recentlyViewedKey,
  headerAction,
  sharerOptions = [],
  selectedSharer = "all",
  onSelectSharer,
  followingList = [],
  searchPlaceholder,
  hasContentAbove = false,
  backLabel,
  linkState,
  hideRating = false,
  readOnlyCategories = false,
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
  const [showSavedOnly, setShowSavedOnly] = useState(false);
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
  const [showEmptyAddSheet, setShowEmptyAddSheet] = useState(false);
  const [showSharerSheet, setShowSharerSheet] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const filterRef = useRef(null);
  const [filterMenuStyle, setFilterMenuStyle] = useState({});
  const {
    hasMoreRecipes: hasMoreRecipesCtx,
    loadMoreRecipes: loadMoreRecipesCtx,
    selectedCategories: ctxSelectedCategories,
    toggleCategory: ctxToggleCategory,
    clearCategorySelection: ctxClearCategorySelection,
    setIsSearchActive,
    categories: ctxCategories,
    recipes: ctxRecipes,
    addCategory,
    editCategory,
    deleteCategory,
    reorderCategories,
    sortCategoriesAlphabetically,
  } = useRecipeBook();

  // Local category selection state for readOnlyCategories mode (e.g. sharer profile)
  const [localSelectedCategories, setLocalSelectedCategories] = useState([
    "all",
  ]);
  const localToggleCategory = useCallback((categoryId) => {
    setLocalSelectedCategories((prev) => {
      if (categoryId === "all") return ["all"];
      const withoutAll = prev.filter((id) => id !== "all");
      if (withoutAll.includes(categoryId)) {
        const next = withoutAll.filter((id) => id !== categoryId);
        return next.length === 0 ? ["all"] : next;
      }
      return [...withoutAll, categoryId];
    });
  }, []);
  const localClearCategorySelection = useCallback(() => {
    setLocalSelectedCategories(["all"]);
  }, []);

  const selectedCategories = readOnlyCategories
    ? localSelectedCategories
    : ctxSelectedCategories;
  const toggleCategory = readOnlyCategories
    ? localToggleCategory
    : ctxToggleCategory;
  const clearCategorySelection = readOnlyCategories
    ? localClearCategorySelection
    : ctxClearCategorySelection;
  const categories = readOnlyCategories ? groups : ctxCategories;
  const recipes = readOnlyCategories ? persons : ctxRecipes;

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

  // Listen for sidebar "open-categories-sheet" event (used on sharer profile)
  useEffect(() => {
    if (!readOnlyCategories) return;
    const handler = () => setShowCategoriesSheet(true);
    window.addEventListener("open-categories-sheet", handler);
    return () => window.removeEventListener("open-categories-sheet", handler);
  }, [readOnlyCategories]);

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

  // Filtered persons based on favorites/saved toggle
  const displayPersons = useMemo(() => {
    let result = localPersons;
    if (showFavoritesOnly) result = result.filter((p) => p.isFavorite);
    if (showSavedOnly)
      result = result.filter((p) => savedRecipes.includes(p.id));
    return result;
  }, [localPersons, showFavoritesOnly, showSavedOnly, savedRecipes]);

  const rvKey = recentlyViewedKey || "recentlyViewedRecipes";

  // Recently viewed recipes
  const recentlyViewedStoredIds = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(rvKey) || "[]");
    } catch {
      return [];
    }
  }, [localPersons, rvKey]);

  const trackRecentlyViewed = useCallback(
    (recipeId) => {
      try {
        const stored = JSON.parse(localStorage.getItem(rvKey) || "[]");
        const updated = [
          recipeId,
          ...stored.filter((id) => id !== recipeId),
        ].slice(0, 20);
        localStorage.setItem(rvKey, JSON.stringify(updated));
      } catch {}
      navigate(
        `/recipe/${recipeId}`,
        linkState ? { state: linkState } : undefined,
      );
    },
    [rvKey, navigate],
  );

  const handleViewChange = (view) => {
    setActiveView(view);
    setShowSearch(false);
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

  // Lock body scroll only on desktop when dropdown is open.
  // On mobile we rely on the bottom-sheet styles and let the page scroll normally
  // so that the filter window itself יהיה ניתן לגלילה.
  useEffect(() => {
    const isDesktop = window.innerWidth > 700;

    if (isDesktop && showFilterMenu) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow || "";
      };
    }

    if (isDesktop) {
      document.body.style.overflow = "";
    }
  }, [showFilterMenu]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) return;
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterMenu(false);
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

    // Filter by selected categories (for flat list views like sharer profile)
    if (!selectedCategories.includes("all") && selectedCategories.length > 0) {
      filtered = filtered.filter(
        (person) =>
          person.categories &&
          person.categories.some((c) => selectedCategories.includes(c)),
      );
    }

    return search(filtered, debouncedSearch, sortField, sortDirection);
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
    savedRecipes,
    selectedCategories,
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

  const handleSaveEdit = async (updatedPerson) => {
    // Also update the local state to reflect changes immediately
    setLocalPersons((prev) =>
      prev.map((person) =>
        person.id === updatedPerson.id ? updatedPerson : person,
      ),
    );

    // Update editingPerson with saved data so further edits start from saved state
    setEditingPerson(updatedPerson);

    try {
      await onEditPerson(updatedPerson);
    } catch (error) {
      console.error("Save failed:", error);
    }
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
        <div className={classes.filterSectionButtons}>
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
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>
          {t("recipes", "prepTime")}:
        </label>
        <div className={classes.filterSectionButtons}>
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
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>
          {t("recipes", "difficulty")}:
        </label>
        <div className={classes.filterSectionButtons}>
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
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>
          {t("recipesView", "ingredientCount")}:
        </label>
        <div className={classes.filterSectionButtons}>
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
            className={
              selectedIngredientCount === "medium" ? classes.active : ""
            }
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
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>
          {t("recipesView", "stepCount")}:
        </label>
        <div className={classes.filterSectionButtons}>
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

  const recipeSortOptions = onSaveRecipe
    ? [
        { field: "name", defaultDir: "asc" },
        { field: "newest", defaultDir: "desc" },
        { field: "prepTime", defaultDir: "asc" },
        { field: "difficulty", defaultDir: "asc" },
        { field: "rating", defaultDir: "desc" },
        { field: "saved", defaultDir: "desc" },
      ]
    : [
        { field: "name", defaultDir: "asc" },
        { field: "newest", defaultDir: "desc" },
        { field: "prepTime", defaultDir: "asc" },
        { field: "difficulty", defaultDir: "asc" },
        { field: "rating", defaultDir: "desc" },
        { field: "favorites", defaultDir: "desc" },
      ];

  useEffect(() => {
    const validFields = recipeSortOptions.map((o) => o.field);
    if (!validFields.includes(sortField)) {
      setSortField(defaultSortField);
      setSortDirection(defaultSortDirection);
    }
  }, []);

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

  const mobileHeaderActions = showTabs ? (
    <>
      {showCategories && (
        <button
          className={classes.mobileHeaderBtn}
          onClick={() => setShowCategoriesSheet(true)}
          title={t("nav", "categories")}
        >
          <Tags size={20} />
        </button>
      )}
      {sharerOptions.length > 0 && onSelectSharer && (
        <button
          className={classes.mobileHeaderBtn}
          onClick={() => setShowSharerSheet(true)}
          title={t("globalRecipes", "filterBySharer")}
        >
          <Users size={20} />
        </button>
      )}
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
  ) : backAction ? (
    showSearch ? (
      <button className={classes.mobileCloseWithLabel} onClick={closeSearch}>
        <X size={18} />
        <span>{backLabel}</span>
      </button>
    ) : (
      <CloseButton onClick={backAction} size={22} type="plain" />
    )
  ) : null;

  const mobileTabsContent = showTabs ? (
    viewToggleElement
  ) : showSearch ? null : (
    <div className={classes.mobileSearchSort}>
      <SearchBox
        searchTerm=""
        onSearchChange={() => setShowSearch(true)}
        onFocus={() => setShowSearch(true)}
        placeholder={searchPlaceholder || t("common", "search")}
        examples={[
          t("recipesView", "searchExample1"),
          t("recipesView", "searchExample2"),
          t("recipesView", "searchExample3"),
          t("recipesView", "searchExample4"),
        ]}
      />
      <SortButton
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleRecipeSortChange}
        options={recipeSortOptions}
      />
      {showCategories && (
        <button
          className={classes.mobileHeaderBtn}
          onClick={() => setShowCategoriesSheet(true)}
          title={t("nav", "categories")}
        >
          <Tags size={20} />
        </button>
      )}
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
    </div>
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
        {backAction &&
          mobileActionsEl &&
          createPortal(
            <CloseButton onClick={backAction} size={22} type="plain" />,
            mobileActionsEl,
          )}
        <div className={classes.viewToggleWrapper}>
          {headerAction ? (
            <span className={classes.desktopOnly}>{headerAction}</span>
          ) : backAction ? (
            <span className={classes.desktopOnly}>
              <CloseButton onClick={backAction} />
            </span>
          ) : null}
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
            isSimpleView ? (
              <div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.75rem 1rem",
                      marginBottom: "0.5rem",
                      background: "var(--bg-card)",
                      borderRadius: 4,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Skeleton width={32} height={32} borderRadius={6} />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="60%" height="0.9rem" borderRadius={6} />
                    </div>
                    <Skeleton width={50} height="0.7rem" borderRadius={6} />
                  </div>
                ))}
              </div>
            ) : (
              <div className={classes.recipeGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton
                      height={0}
                      style={{ paddingBottom: "100%" }}
                      borderRadius={25}
                    />
                    <div style={{ padding: "0.75rem" }}>
                      <Skeleton
                        width="75%"
                        height="1.2rem"
                        borderRadius={6}
                        style={{ marginBottom: "0.3rem" }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Skeleton
                          width="30%"
                          height="0.9rem"
                          borderRadius={6}
                        />
                        <Skeleton
                          width="25%"
                          height="0.9rem"
                          borderRadius={6}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className={classes.emptyState}>
              <RecipeBookIcon width={72} height={72} />
              <p className={classes.emptyText}>
                {emptyTitle || t("recipesView", "emptyTitle")}
              </p>
              {showAddAndFavorites &&
                (isMobile ? (
                  <>
                    <button
                      className={classes.emptyButton}
                      onClick={() => setShowEmptyAddSheet(true)}
                    >
                      {t("recipesView", "addNewRecipe")}
                    </button>
                    <BottomSheet
                      open={showEmptyAddSheet}
                      onClose={() => setShowEmptyAddSheet(false)}
                      title={t("recipesView", "addNewRecipe")}
                    >
                      <div onClick={() => setShowEmptyAddSheet(false)}>
                        <AddRecipeMenu onSelect={onAddPerson} t={t} />
                      </div>
                    </BottomSheet>
                  </>
                ) : (
                  <AddRecipeDropdown onSelect={(method) => onAddPerson(method)}>
                    <span className={classes.emptyButton}>
                      {t("recipesView", "addNewRecipe")}
                    </span>
                  </AddRecipeDropdown>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${classes.recipesContainer} ${showChat ? classes.chatMode : ""} ${!showTabs && !hasContentAbove ? classes.noTabsContainer : ""}`}
    >
      {showTabs &&
        mobileTabsEl &&
        createPortal(mobileTabsContent, mobileTabsEl)}
      {mobileActionsEl &&
        mobileHeaderActions &&
        createPortal(mobileHeaderActions, mobileActionsEl)}

      <div
        className={`${classes.stickyTop} ${!showTabs ? classes.noTabsMode : ""}`}
        style={showSearch ? { display: "none" } : undefined}
      >
        <div className={classes.viewToggleWrapper}>
          {headerAction ? (
            <span className={classes.desktopOnly}>{headerAction}</span>
          ) : showTabs ? (
            <span className={classes.desktopOnly}>
              <AddRecipeDropdown onSelect={(method) => onAddPerson(method)} />
            </span>
          ) : backAction ? (
            <span className={classes.desktopOnly}>
              <CloseButton onClick={backAction} />
            </span>
          ) : null}
          {showTabs && !mobileTabsEl && (
            <div className={classes.viewToggle}>{viewToggleElement}</div>
          )}
          {!showTabs && !showSearch && (
            <div className={classes.desktopSearchSort}>
              <div className={classes.searchBoxWrapper}>
                <SearchBox
                  searchTerm=""
                  onSearchChange={() => setShowSearch(true)}
                  onFocus={() => setShowSearch(true)}
                  placeholder={searchPlaceholder || t("common", "search")}
                  examples={[
                    t("recipesView", "searchExample1"),
                    t("recipesView", "searchExample2"),
                    t("recipesView", "searchExample3"),
                    t("recipesView", "searchExample4"),
                  ]}
                  size="large"
                />
              </div>
              <SortButton
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleRecipeSortChange}
                options={recipeSortOptions}
              />
            </div>
          )}
          <div className={classes.desktopHeaderActions}>
            {showCategories && (
              <button
                className={classes.desktopHeaderBtn}
                onClick={() => setShowCategoriesSheet(true)}
                title={t("nav", "categories")}
              >
                <Tags size={28} />
              </button>
            )}
            {sharerOptions.length > 0 && onSelectSharer && (
              <button
                className={classes.desktopHeaderBtn}
                onClick={() => setShowSharerSheet(true)}
                title={t("globalRecipes", "filterBySharer")}
              >
                <Users size={28} />
              </button>
            )}
            <button
              className={classes.desktopHeaderBtn}
              onClick={toggleView}
              title={
                isSimpleView
                  ? t("recipesView", "gridView")
                  : t("recipesView", "listView")
              }
            >
              {isSimpleView ? <LayoutGrid size={28} /> : <Rows4 size={28} />}
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

        {showTabs &&
          !showChat &&
          (persons.length > 0 || hasSelectedCategories) && (
            <div
              className={classes.searchHeader}
              style={{ display: showSearch ? "none" : undefined }}
            >
              {backAction && !isMobile && <BackButton onClick={backAction} />}
              {showAddAndFavorites && (
                <button
                  onClick={() => setShowFavoritesOnly((prev) => !prev)}
                  title={t("recipes", "favorite")}
                  className={`${classes.favoritesBtn} ${showFavoritesOnly ? classes.favoritesActive : ""}`}
                >
                  {showFavoritesOnly ? (
                    <Heart
                      size={isMobile ? 24 : 30}
                      strokeWidth={1.5}
                      fill="red"
                      stroke="red"
                    />
                  ) : (
                    <Heart size={isMobile ? 24 : 30} strokeWidth={1.5} />
                  )}
                </button>
              )}
              {onSaveRecipe && (
                <button
                  onClick={() => setShowSavedOnly((prev) => !prev)}
                  title={t("globalRecipes", "savedRecipes")}
                  className={`${classes.favoritesBtn} ${showSavedOnly ? classes.favoritesActive : ""}`}
                >
                  {showSavedOnly ? (
                    <Bookmark
                      size={isMobile ? 24 : 30}
                      strokeWidth={1.5}
                      fill="var(--accent-color-1)"
                      stroke="var(--accent-color-1)"
                    />
                  ) : (
                    <Bookmark size={isMobile ? 24 : 30} strokeWidth={1.5} />
                  )}
                </button>
              )}
              <div className={classes.searchBoxWrapper}>
                <SearchBox
                  searchTerm=""
                  onSearchChange={() => setShowSearch(true)}
                  onFocus={() => setShowSearch(true)}
                  placeholder={searchPlaceholder || t("common", "search")}
                  examples={[
                    t("recipesView", "searchExample1"),
                    t("recipesView", "searchExample2"),
                    t("recipesView", "searchExample3"),
                    t("recipesView", "searchExample4"),
                  ]}
                  size="large"
                />
              </div>
              <div className={classes.headerControls}>
                <SortButton
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSortChange={handleRecipeSortChange}
                  options={recipeSortOptions}
                />
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
          hideRating={hideRating}
          isSimpleView={isSimpleView}
          onToggleView={!showTabs ? toggleView : undefined}
          onClose={closeSearch}
          showCategories={showCategories}
          selectedCategories={selectedCategories}
          toggleCategory={toggleCategory}
          clearCategorySelection={clearCategorySelection}
          getTranslatedGroup={getTranslatedGroup}
          selectedCategoryObjects={selectedCategoryObjects}
          isAllSelected={isAllSelected}
          onRecipeNavigate={recentlyViewedKey ? trackRecentlyViewed : undefined}
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
                    onClick={() =>
                      recentlyViewedKey
                        ? trackRecentlyViewed(person.id)
                        : navigate(
                            `/recipe/${person.id}`,
                            linkState ? { state: linkState } : undefined,
                          )
                    }
                  >
                    <div className={classes.recentlyViewedImageWrap}>
                      <div className={classes.recentlyViewedNoImage} />
                      {person.image_src &&
                        typeof person.image_src === "string" &&
                        person.image_src.trim() !== "" && (
                          <img
                            src={person.image_src}
                            alt={person.name}
                            className={classes.recentlyViewedImage}
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                    </div>
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

          {loading ? (
            isSimpleView ? (
              <div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.75rem 1rem",
                      marginBottom: "0.5rem",
                      background: "var(--bg-card)",
                      borderRadius: 4,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Skeleton width={32} height={32} borderRadius={6} />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="60%" height="0.9rem" borderRadius={6} />
                    </div>
                    <Skeleton width={50} height="0.7rem" borderRadius={6} />
                  </div>
                ))}
              </div>
            ) : (
              <div className={classes.recipeGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton
                      height={0}
                      style={{ paddingBottom: "100%" }}
                      borderRadius={25}
                    />
                    <div style={{ padding: "0.75rem" }}>
                      <Skeleton
                        width="75%"
                        height="1.2rem"
                        borderRadius={6}
                        style={{ marginBottom: "0.3rem" }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Skeleton
                          width="30%"
                          height="0.9rem"
                          borderRadius={6}
                        />
                        <Skeleton
                          width="25%"
                          height="0.9rem"
                          borderRadius={6}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredAndSortedPersons.length === 0 ? (
            <div className={classes.noResults}>
              {showSavedOnly
                ? t("globalRecipes", "noSavedRecipes")
                : showFavoritesOnly
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
                              onClick={() =>
                                navigate(
                                  `/recipe/${person.id}`,
                                  linkState ? { state: linkState } : undefined,
                                )
                              }
                            >
                              <span className={classes.compactThumbWrap}>
                                <UtensilsCrossed size={16} />
                                {(person.image || person.image_src) && (
                                  <img
                                    src={person.image || person.image_src}
                                    alt=""
                                    className={classes.compactThumb}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                )}
                              </span>
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
                              hideRating={hideRating}
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
                            onClick={() =>
                              navigate(
                                `/recipe/${person.id}`,
                                linkState ? { state: linkState } : undefined,
                              )
                            }
                          >
                            <span className={classes.compactThumbWrap}>
                              <UtensilsCrossed size={16} />
                              {(person.image || person.image_src) && (
                                <img
                                  src={person.image || person.image_src}
                                  alt=""
                                  className={classes.compactThumb}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              )}
                            </span>
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
                            hideRating={hideRating}
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
                  onClick={() =>
                    recentlyViewedKey
                      ? trackRecentlyViewed(person.id)
                      : navigate(
                          `/recipe/${person.id}`,
                          linkState ? { state: linkState } : undefined,
                        )
                  }
                >
                  <span className={classes.compactThumbWrap}>
                    <UtensilsCrossed size={16} />
                    {(person.image || person.image_src) && (
                      <img
                        src={person.image || person.image_src}
                        alt=""
                        className={classes.compactThumb}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                  </span>
                  <span className={classes.compactName}>{person.name}</span>
                  {person.sharerName && (
                    <span
                      className={classes.compactSharer}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/sharer/${person.sharerUserId}`);
                      }}
                    >
                      {followingList.includes(person.sharerUserId) && (
                        <UserCheck
                          size={14}
                          style={{
                            marginInlineEnd: "0.2rem",
                            verticalAlign: "middle",
                          }}
                        />
                      )}
                      {person.sharerName}
                    </span>
                  )}
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
                  {onSaveRecipe && (
                    <button
                      className={classes.compactActionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveRecipe(person.id);
                      }}
                      title={t("globalRecipes", "savedRecipes")}
                    >
                      <Bookmark
                        size={16}
                        fill={
                          savedRecipes.includes(person.id)
                            ? "var(--accent-color-1)"
                            : "none"
                        }
                        stroke={
                          savedRecipes.includes(person.id)
                            ? "var(--accent-color-1)"
                            : "currentColor"
                        }
                      />
                    </button>
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
                  onSaveRecipe={onSaveRecipe}
                  isSaved={savedRecipes.includes(person.id)}
                  onRate={onRate}
                  userRating={userRatings[person.id] || 0}
                  onCardClick={
                    recentlyViewedKey ? trackRecentlyViewed : undefined
                  }
                  followingList={followingList}
                  linkState={linkState}
                  hideRating={hideRating}
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

      {onAddPerson && !showChat && !showSearch && (
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
            onManage={() => {
              setShowCategoriesSheet(false);
              setShowManagement(true);
            }}
            hideManage={readOnlyCategories}
            categoriesOverride={readOnlyCategories ? categories : undefined}
            recipesOverride={readOnlyCategories ? recipes : undefined}
            selectedCategoriesOverride={
              readOnlyCategories ? selectedCategories : undefined
            }
            toggleCategoryOverride={
              readOnlyCategories ? toggleCategory : undefined
            }
            clearCategorySelectionOverride={
              readOnlyCategories ? clearCategorySelection : undefined
            }
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
                <CloseButton
                  className={classes.categoriesPopupClose}
                  onClick={() => setShowCategoriesSheet(false)}
                  size={25}
                />
              </div>
              <CategoriesSheetContent
                onManage={() => {
                  setShowCategoriesSheet(false);
                  setShowManagement(true);
                }}
                hideManage={readOnlyCategories}
                categoriesOverride={readOnlyCategories ? categories : undefined}
                recipesOverride={readOnlyCategories ? recipes : undefined}
                selectedCategoriesOverride={
                  readOnlyCategories ? selectedCategories : undefined
                }
                toggleCategoryOverride={
                  readOnlyCategories ? toggleCategory : undefined
                }
                clearCategorySelectionOverride={
                  readOnlyCategories ? clearCategorySelection : undefined
                }
              />
            </div>
          </>
        )
      )}

      {showManagement && !readOnlyCategories && (
        <CategoriesManagement
          categories={categories}
          onClose={() => {
            setShowManagement(false);
            setShowCategoriesSheet(true);
          }}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
          onSortAlphabetically={sortCategoriesAlphabetically}
          getGroupContacts={getGroupContacts}
        />
      )}

      {sharerOptions.length > 0 &&
        onSelectSharer &&
        (() => {
          const sorted = [...sharerOptions].sort((a, b) => {
            const aF = followingList.includes(a.id) ? 0 : 1;
            const bF = followingList.includes(b.id) ? 0 : 1;
            return aF - bF;
          });
          const sharerListContent = (
            <div className={classes.sharerList}>
              <button
                className={`${classes.sharerItem} ${selectedSharer === "all" ? classes.sharerItemActive : ""}`}
                onClick={() => {
                  onSelectSharer("all");
                  setShowSharerSheet(false);
                }}
              >
                {t("globalRecipes", "allSharers")}
              </button>
              {sorted.map((s) => (
                <button
                  key={s.id}
                  className={`${classes.sharerItem} ${selectedSharer === s.id ? classes.sharerItemActive : ""}`}
                  onClick={() => {
                    onSelectSharer(s.id);
                    setShowSharerSheet(false);
                  }}
                >
                  {followingList.includes(s.id) && <UserCheck size={16} />}
                  {s.name}
                </button>
              ))}
            </div>
          );
          return isMobile ? (
            <BottomSheet
              open={showSharerSheet}
              onClose={() => setShowSharerSheet(false)}
              title={t("globalRecipes", "filterBySharer")}
            >
              {sharerListContent}
            </BottomSheet>
          ) : (
            showSharerSheet && (
              <>
                <div
                  className={classes.categoriesPopupOverlay}
                  onClick={() => setShowSharerSheet(false)}
                />
                <div className={classes.categoriesPopup}>
                  <div className={classes.categoriesPopupHeader}>
                    <span className={classes.categoriesPopupTitle}>
                      {t("globalRecipes", "filterBySharer")}
                    </span>
                    <CloseButton
                      className={classes.categoriesPopupClose}
                      onClick={() => setShowSharerSheet(false)}
                      size={25}
                    />
                  </div>
                  {sharerListContent}
                </div>
              </>
            )
          );
        })()}
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
