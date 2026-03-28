import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
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
  CircleCheck,
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
import { AddRecipeDropdown, Toast } from "../controls";
import { Fab } from "../controls/fab";
import fabClasses from "../controls/fab/fab.module.css";
import { BottomSheet } from "../controls/bottom-sheet";
import { CloseButton } from "../controls/close-button";
import { BackButton } from "../controls/back-button";
import { SortButton } from "../controls/sort-button";
import { SearchBox } from "../controls/search";
import { SearchOverlay } from "./search-overlay";
import { CategoriesManagement } from "../categories-management";
import { Modal } from "../modal";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { CategoriesSheetContent } from "../categories-sheet-content";

import { RecipesViewContext } from "./RecipesViewContext";
import RecipesEmptyState from "./recipes-view/RecipesEmptyState";
import RecipesStickyTop from "./recipes-view/RecipesStickyTop";
import RecipesMainContent from "./recipes-view/RecipesMainContent";
import RecipesSheets from "./recipes-view/RecipesSheets";

const MOBILE_BREAKPOINT = 768;

function RecipesView({
  recipes: recipesProp,
  onAddRecipe,
  groups = [],
  onEditRecipe,
  onDeleteRecipe,
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
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const handleSaveToastClose = useCallback(() => {
    setSaveToastOpen(false);
    setEditingRecipe(null);
  }, []);
  const [localRecipes, setLocalRecipes] = useState(recipesProp);
  const [isSimpleView, setIsSimpleView] = useState(() => {
    // For categories view, always default to grid with images (false)
    if (readOnlyCategories) return false;
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
  const [activeView, setActiveView] = useState(
    readOnlyCategories ? "categories" : "recipes",
  );
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
    currentUser,
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
  const recipes = readOnlyCategories ? recipesProp : ctxRecipes;

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

  // Filtered recipes based on favorites/saved toggle
  const displayRecipes = useMemo(() => {
    let result = localRecipes;
    if (showFavoritesOnly) result = result.filter((p) => p.isFavorite);
    if (showSavedOnly)
      result = result.filter((p) => savedRecipes.includes(p.id));
    return result;
  }, [localRecipes, showFavoritesOnly, showSavedOnly, savedRecipes]);

  const rvKey = recentlyViewedKey || "recentlyViewedRecipes";

  // Recently viewed recipes
  const recentlyViewedStoredIds = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(rvKey) || "[]");
    } catch {
      return [];
    }
  }, [localRecipes, rvKey]);

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
    // Set grid view (with images) as default when entering categories
    if (view === "categories") {
      setIsSimpleView(false);
      try {
        localStorage.setItem("recipesSimpleView", "false");
      } catch {}
    }
  };

  useLayoutEffect(() => {
    if (showChat) {
      document.body.classList.add("chat-open");
      window.scrollTo({ top: 0 });
      document.querySelector("main")?.scrollTo({ top: 0 });
    } else {
      document.body.classList.remove("chat-open");
    }
    return () => document.body.classList.remove("chat-open");
  }, [showChat]);

  // Update local recipes when the prop changes
  useEffect(() => {
    setLocalRecipes(recipes);
  }, [recipes]);

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
  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = displayRecipes;

    // Filter by rating
    if (selectedRating !== "all") {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter((recipe) => {
        const rating = parseFloat(recipe.rating) || 0;
        return rating >= minRating;
      });
    }

    // Filter by prep time
    if (selectedPrepTime !== "all") {
      filtered = filtered.filter((recipe) => {
        const prepTimeMatch = recipe.prepTime?.match(/\d+/);
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
      filtered = filtered.filter((recipe) => {
        if (!recipe.difficulty) return false;
        return (
          recipe.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
        );
      });
    }

    // Filter by ingredient count
    if (selectedIngredientCount !== "all") {
      filtered = filtered.filter((recipe) => {
        const count = Array.isArray(recipe.ingredients)
          ? recipe.ingredients.filter(Boolean).length
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
      filtered = filtered.filter((recipe) => {
        const count = Array.isArray(recipe.instructions)
          ? recipe.instructions.filter(Boolean).length
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
      filtered = filtered.filter((recipe) => {
        if (!Array.isArray(recipe.ingredients)) return false;
        const recipeIngs = recipe.ingredients
          .filter(Boolean)
          .map((i) => (typeof i === "string" ? i : i.name || "").toLowerCase());
        return filterIngredients.every((fi) =>
          recipeIngs.some((ri) => ri.includes(fi.toLowerCase())),
        );
      });
    }

    // Filter by selected categories (for flat list views like sharer profile)
    if (!selectedCategories.includes("all") && selectedCategories.length > 0) {
      filtered = filtered.filter((recipe) => {
        // If "general" is selected, include recipes without categories OR with "general" category
        if (selectedCategories.includes("general")) {
          const hasNoCategories =
            !recipe.categories || recipe.categories.length === 0;
          const hasGeneralCategory =
            recipe.categories && recipe.categories.includes("general");
          const hasOtherSelectedCategories =
            recipe.categories &&
            recipe.categories.some(
              (c) => selectedCategories.includes(c) && c !== "general",
            );
          return (
            hasNoCategories || hasGeneralCategory || hasOtherSelectedCategories
          );
        }
        // For other categories, check if recipe has any of the selected categories
        return (
          recipe.categories &&
          recipe.categories.some((c) => selectedCategories.includes(c))
        );
      });
    }

    return search(filtered, debouncedSearch, sortField, sortDirection);
  }, [
    displayRecipes,
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
    const filteredIds = new Set(filteredAndSortedRecipes.map((p) => p.id));
    return recentlyViewedStoredIds
      .filter((id) => filteredIds.has(id))
      .map((id) => filteredAndSortedRecipes.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 6);
  }, [filteredAndSortedRecipes, recentlyViewedStoredIds]);

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

  const handleSaveEdit = async (updatedRecipe) => {
    setLocalRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === updatedRecipe.id ? updatedRecipe : recipe,
      ),
    );
    setEditingRecipe(updatedRecipe);
    try {
      await onEditRecipe(updatedRecipe);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleToggleFavorite = useCallback(
    (recipeId, isFavorite) => {
      setLocalRecipes((prev) => {
        const recipeToUpdate = prev.find((p) => p.id === recipeId);
        if (!recipeToUpdate) return prev;
        const updatedRecipe = { ...recipeToUpdate, isFavorite };
        onEditRecipe(updatedRecipe);
        return prev.map((p) => (p.id === recipeId ? updatedRecipe : p));
      });
    },
    [onEditRecipe],
  );

  const handleEditClick = useCallback((recipe) => {
    setEditingRecipe(recipe);
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
      {sharerOptions.length > 0 && onSelectSharer && (
        <button
          className={classes.mobileHeaderBtn}
          onClick={() => setShowSharerSheet(true)}
          title={t("globalRecipes", "filterBySharer")}
        >
          <Users size={23} />
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
        {isSimpleView ? <LayoutGrid size={22} /> : <Rows4 size={22} />}
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

  const viewToggleElement = (
    <ViewToggle
      activeView={activeView}
      onViewChange={handleViewChange}
      recipesLabel={recipesTabLabel}
    />
  );

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
          <Tags size={23} />
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
        {isSimpleView ? <LayoutGrid size={22} /> : <Rows4 size={22} />}
      </button>
    </div>
  );

  const selectedCategoryObjects = isAllSelected
    ? []
    : selectedCategories
        .map((id) => groups.find((g) => g.id === id))
        .filter(Boolean);

  const hasSelectedCategories = !isAllSelected && selectedCategories.length > 0;

  const contextValue = {
    // props
    localRecipes,
    onAddRecipe,
    groups,
    onEditRecipe,
    onDeleteRecipe,
    selectedGroup,
    onSelectGroup,
    showGreeting,
    showAddAndFavorites,
    showCategories,
    emptyTitle,
    onCopyRecipe,
    onSaveRecipe,
    savedRecipes,
    onRate,
    userRatings,
    loading,
    backAction,
    showTabs,
    headerAction,
    sharerOptions,
    selectedSharer,
    onSelectSharer,
    followingList,
    searchPlaceholder,
    hasContentAbove,
    backLabel,
    linkState,
    hideRating,
    readOnlyCategories,
    recipesTabLabel,
    // state
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    editingRecipe,
    setEditingRecipe,
    isSimpleView,
    showFilterMenu,
    setShowFilterMenu,
    selectedRating,
    setSelectedRating,
    selectedPrepTime,
    setSelectedPrepTime,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedIngredientCount,
    setSelectedIngredientCount,
    selectedStepCount,
    setSelectedStepCount,
    filterIngredients,
    ingredientInput,
    setIngredientInput,
    activeView,
    showChat,
    showFavoritesOnly,
    setShowFavoritesOnly,
    showSavedOnly,
    setShowSavedOnly,
    showSearch,
    setShowSearch,
    isMobile,
    mobileTabsEl,
    mobileActionsEl,
    showCategoriesSheet,
    setShowCategoriesSheet,
    showEmptyAddSheet,
    setShowEmptyAddSheet,
    showSharerSheet,
    setShowSharerSheet,
    showManagement,
    setShowManagement,
    filterRef,
    filterMenuStyle,
    // computed
    selectedCategories,
    toggleCategory,
    clearCategorySelection,
    categories,
    recipes,
    hasMoreRecipes,
    loadMoreRecipes,
    filteredAndSortedRecipes,
    recentlyViewed,
    hasActiveFilters,
    isAllSelected,
    selectedCount,
    selectedCategoryObjects,
    hasSelectedCategories,
    currentUser,
    getGroupContacts,
    getTranslatedGroup,
    recipeSortOptions,
    // from useRecipeBook
    addCategory,
    editCategory,
    deleteCategory,
    reorderCategories,
    sortCategoriesAlphabetically,
    // handlers
    navigate,
    closeSearch,
    handleViewChange,
    handleSort,
    clearAllFilters,
    addFilterIngredient,
    removeFilterIngredient,
    handleSaveEdit,
    handleToggleFavorite,
    handleEditClick,
    toggleView,
    handleRecipeSortChange,
    trackRecentlyViewed,
    onSaved: () => setSaveToastOpen(true),
    // css
    classes,
    fabClasses,
    t,
  };

  if (!recipes || (recipes.length === 0 && !hasSelectedCategories)) {
    return (
      <RecipesViewContext.Provider value={contextValue}>
        <RecipesEmptyState />
        <Toast
          open={saveToastOpen}
          onClose={handleSaveToastClose}
          variant="success"
        >
          <CircleCheck size={18} aria-hidden />
          <span>{t("recipes", "saved")}</span>
        </Toast>
      </RecipesViewContext.Provider>
    );
  }

  return (
    <RecipesViewContext.Provider value={contextValue}>
      <div
        className={`${classes.recipesContainer} ${showChat ? classes.chatMode : ""} ${!showTabs && !hasContentAbove ? classes.noTabsContainer : ""}`}
      >
        {showTabs &&
          mobileTabsEl &&
          createPortal(mobileTabsContent, mobileTabsEl)}
        {mobileActionsEl &&
          mobileHeaderActions &&
          createPortal(mobileHeaderActions, mobileActionsEl)}

        <RecipesStickyTop />

        {showSearch ? (
          <SearchOverlay
            open={showSearch}
            recipes={localRecipes}
            groups={groups}
            onEditRecipe={(recipe) => {
              closeSearch();
              setEditingRecipe(recipe);
            }}
            onDeleteRecipe={onDeleteRecipe}
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
            onRecipeNavigate={
              recentlyViewedKey ? trackRecentlyViewed : undefined
            }
          />
        ) : showChat ? (
          <ChatWindow showImageButton showGreeting={showGreeting} />
        ) : (
          <RecipesMainContent />
        )}

        <RecipesSheets />
      </div>
      <Toast
        open={saveToastOpen}
        onClose={handleSaveToastClose}
        variant="success"
      >
        <CircleCheck size={18} aria-hidden />
        <span>{t("recipes", "saved")}</span>
      </Toast>
    </RecipesViewContext.Provider>
  );
}

export { RecipesView };
export default RecipesView;
