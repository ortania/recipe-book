import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaFilter, FaRegEdit } from "react-icons/fa";
import { FaHistory } from "react-icons/fa";
import { PiStar, PiStarFill } from "react-icons/pi";
import { CiFilter } from "react-icons/ci";
import { IoMdStarOutline } from "react-icons/io";
import {
  IoChevronDown,
  IoSearchOutline,
  IoChatbubbleOutline,
  IoMenuOutline,
} from "react-icons/io5";
import { BiSortAlt2 } from "react-icons/bi";
import {
  BsList,
  BsListUl,
  BsGrid3X3Gap,
  BsSortDownAlt,
  BsSortUpAlt,
} from "react-icons/bs";
// import { LuLayoutList } from "react-icons/lu";
// import { CgLayoutList } from "react-icons/cg";
import { IoBookOutline, IoCopyOutline } from "react-icons/io5";
import RecipeBookIcon from "../icons/RecipeBookIcon/RecipeBookIcon";
import { GoTrash } from "react-icons/go";
import { Heart, MessageCircle, Lightbulb, Camera, Sparkles } from "lucide-react";
import { useRecipeBook, useLanguage } from "../../context";
import useTranslatedList from "../../hooks/useTranslatedList";

import classes from "./recipes-view-new.module.css";

import { RecipeInfo } from "./RecipeInfo";
import { SimpleRecipeInfo } from "./SimpleRecipeInfo";
import { SearchBox } from "../controls/search";
import { EditRecipe } from "../forms/edit-recipe";
import { SortControls } from "../controls/sort-controls";
import { ViewToggleButton } from "../controls/view-toggle-button";
import ViewToggle from "../controls/view-toggle";
import ChatWindow from "../chat/ChatWindow";

import { Greeting } from "../greeting";
import { search } from "./utils";
import { AddButton, AddRecipeDropdown } from "../controls";
import { Fab } from "../controls/fab";
import fabClasses from "../controls/fab/fab.module.css";
import { FiLink } from "react-icons/fi";
import { BsClipboardData } from "react-icons/bs";
import { PiPencilSimpleLineLight, PiMicrophoneLight } from "react-icons/pi";
import { GalleryIcon } from "../icons/GalleryIcon";
import { BottomSheet } from "../controls/bottom-sheet";
import { CloseButton } from "../controls/close-button";
import ChatHelpButton from "../controls/chat-help-button/ChatHelpButton";

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
  const [isMobile, setIsMobile] = useState(false);
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
  } = useRecipeBook();

  const hasMoreRecipes = hasMoreRecipesProp ?? hasMoreRecipesCtx;
  const loadMoreRecipes = onLoadMore || loadMoreRecipesCtx;

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsMobile(mql.matches);
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
      return JSON.parse(
        localStorage.getItem("recentlyViewedRecipes") || "[]",
      );
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
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
  const isAllSelected = selectedCategories.includes("all");

  /* ── Shared filter/sort content for dropdown (desktop) + BottomSheet (mobile) ── */
  const filterContent = (
    <div className={classes.dropdownScrollable}>
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>{t("recipesView", "sortByRating")}:</label>
        {["all", "3", "4", "5"].map((v) => (
          <button key={v} className={selectedRating === v ? classes.active : ""} onClick={() => setSelectedRating(v)}>
            {v === "all" ? t("categories", "all") : `★${v}${v !== "5" ? "+" : ""}`}
          </button>
        ))}
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>{t("recipes", "prepTime")}:</label>
        <button className={selectedPrepTime === "all" ? classes.active : ""} onClick={() => setSelectedPrepTime("all")}>{t("categories", "all")}</button>
        <button className={selectedPrepTime === "quick" ? classes.active : ""} onClick={() => setSelectedPrepTime("quick")}>≤15 {t("recipes", "minutes")}</button>
        <button className={selectedPrepTime === "medium" ? classes.active : ""} onClick={() => setSelectedPrepTime("medium")}>15-30 {t("recipes", "minutes")}</button>
        <button className={selectedPrepTime === "long" ? classes.active : ""} onClick={() => setSelectedPrepTime("long")}>30+ {t("recipes", "minutes")}</button>
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>{t("recipes", "difficulty")}:</label>
        {["all", "VeryEasy", "Easy", "Medium", "Hard"].map((v) => (
          <button key={v} className={selectedDifficulty === v ? classes.active : ""} onClick={() => setSelectedDifficulty(v)}>
            {v === "all" ? t("categories", "all") : t("difficulty", v)}
          </button>
        ))}
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>{t("recipesView", "ingredientCount")}:</label>
        <button className={selectedIngredientCount === "all" ? classes.active : ""} onClick={() => setSelectedIngredientCount("all")}>{t("categories", "all")}</button>
        <button className={selectedIngredientCount === "few" ? classes.active : ""} onClick={() => setSelectedIngredientCount("few")}>≤5</button>
        <button className={selectedIngredientCount === "medium" ? classes.active : ""} onClick={() => setSelectedIngredientCount("medium")}>6-10</button>
        <button className={selectedIngredientCount === "many" ? classes.active : ""} onClick={() => setSelectedIngredientCount("many")}>10+</button>
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>{t("recipesView", "stepCount")}:</label>
        <button className={selectedStepCount === "all" ? classes.active : ""} onClick={() => setSelectedStepCount("all")}>{t("categories", "all")}</button>
        <button className={selectedStepCount === "few" ? classes.active : ""} onClick={() => setSelectedStepCount("few")}>≤3</button>
        <button className={selectedStepCount === "medium" ? classes.active : ""} onClick={() => setSelectedStepCount("medium")}>4-7</button>
        <button className={selectedStepCount === "many" ? classes.active : ""} onClick={() => setSelectedStepCount("many")}>7+</button>
      </div>
      <div className={classes.filterDivider} />
      <div className={classes.filterSection}>
        <label className={classes.filterLabel}>{t("recipesView", "byIngredients")}:</label>
        <div className={classes.ingredientInputRow}>
          <input type="text" className={classes.ingredientInput} value={ingredientInput} onChange={(e) => setIngredientInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFilterIngredient(); } }} placeholder={t("recipesView", "addIngredient")} />
          <button className={classes.ingredientAddBtn} onClick={addFilterIngredient} type="button">+</button>
        </div>
        {filterIngredients.length > 0 && (
          <div className={classes.ingredientChips}>
            {filterIngredients.map((ing) => (
              <span key={ing} className={classes.ingredientChip}>{ing}<button className={classes.ingredientChipRemove} onClick={() => removeFilterIngredient(ing)}>✕</button></span>
            ))}
          </div>
        )}
      </div>
      {hasActiveFilters && (
        <>
          <div className={classes.filterDivider} />
          <div className={classes.filterSection}>
            <button className={classes.clearFiltersBtn} onClick={clearAllFilters}>{t("recipesView", "clearFilters")}</button>
          </div>
        </>
      )}
    </div>
  );

  const sortContent = (
    <div className={classes.dropdownScrollable}>
      <div className={classes.filterSection}>
        <button className={classes.sortDirectionBtn} onClick={() => setSortDirection((prev) => prev === "asc" ? "desc" : "asc")} title={sortDirection === "asc" ? "Ascending" : "Descending"}>
          {sortDirection === "asc" ? <BsSortUpAlt size={20} /> : <BsSortDownAlt size={20} />}
          {sortDirection === "asc" ? t("recipesView", "ascending") || "↑" : t("recipesView", "descending") || "↓"}
        </button>
      </div>
      <div className={classes.filterDivider} />
      {[
        { field: "name", label: t("recipesView", "sortByName") },
        { field: "prepTime", label: t("recipesView", "sortByPrepTime") },
        { field: "difficulty", label: t("recipesView", "sortByDifficulty") },
        { field: "rating", label: t("recipesView", "sortByRating") },
        { field: "favorites", label: t("recipesView", "sortByFavorites") },
        { field: "recentlyViewed", label: t("recipesView", "sortByRecentlyViewed") },
      ].map(({ field, label }) => (
        <button key={field} className={sortField === field ? classes.active : ""} onClick={() => { setSortField(field); if (!isMobile) setShowSortMenu(false); }}>
          {label}
        </button>
      ))}
    </div>
  );
  const selectedCategoryObjects = isAllSelected
    ? []
    : selectedCategories
        .map((id) => groups.find((g) => g.id === id))
        .filter(Boolean);

  if (!persons || persons.length === 0) {
    return (
      <div className={classes.recipesContainer}>
        <div className={classes.viewToggleWrapper}>
          {showAddAndFavorites && (
            <div className={classes.iconButtons}>
              <AddButton
                type="circle"
                onClick={() => setShowFavoritesOnly((prev) => !prev)}
                title={t("recipes", "favorite")}
                className={showFavoritesOnly ? classes.favoritesActive : ""}
              >
                {showFavoritesOnly ? (
                  <Heart size="1em" strokeWidth={1.5} fill="red" stroke="red" />
                ) : (
                  <Heart size="1em" strokeWidth={1.5} />
                )}
              </AddButton>
              <span className={classes.desktopOnly}>
                <AddRecipeDropdown onSelect={(method) => onAddPerson(method)} />
              </span>
            </div>
          )}
          <div className={classes.viewToggle}>
            <ViewToggle
              activeView={activeView}
              onViewChange={handleViewChange}
              recipesLabel={recipesTabLabel}
            />
          </div>
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
    <div className={classes.recipesContainer}>
      <div className={classes.stickyTop}>
        <div className={classes.viewToggleWrapper}>
          {showAddAndFavorites && (
            <div className={classes.iconButtons}>
              <AddButton
                type="circle"
                onClick={() => setShowFavoritesOnly((prev) => !prev)}
                title={t("recipes", "favorite")}
                className={showFavoritesOnly ? classes.favoritesActive : ""}
              >
                {showFavoritesOnly ? (
                  <Heart size="1em" strokeWidth={1.5} fill="red" stroke="red" />
                ) : (
                  <Heart size="1em" strokeWidth={1.5} />
                )}
              </AddButton>
              <span className={classes.desktopOnly}>
                <AddRecipeDropdown onSelect={(method) => onAddPerson(method)} />
              </span>
            </div>
          )}
          <div className={classes.viewToggle}>
            <ViewToggle
              activeView={activeView}
              onViewChange={handleViewChange}
              recipesLabel={recipesTabLabel}
            />
          </div>
          {persons.length > 0 && !showChat && (
            <button
              className={classes.viewToggleIcon}
              onClick={toggleView}
              title={
                isSimpleView
                  ? t("recipesView", "gridView")
                  : t("recipesView", "listView")
              }
            >
              {isSimpleView ? <BsGrid3X3Gap /> : <BsListUl />}
            </button>
          )}
          <div className={classes.helpBtnEnd}>
            <ChatHelpButton
              key={activeView}
              title={
                showChat
                  ? t("chat", "helpTitle")
                  : helpTitleProp || t("recipesView", "helpTitle")
              }
              description={
                showChat
                  ? t("chat", "helpIntro")
                  : helpDescriptionProp || t("recipesView", "helpIntro")
              }
              items={
                showChat
                  ? [
                      <>
                        <MessageCircle size={16} style={{ verticalAlign: "middle" }} />{" "}
                        {t("chat", "helpFeature1")}
                      </>,
                      <>
                        <Lightbulb size={16} style={{ verticalAlign: "middle" }} />{" "}
                        {t("chat", "helpFeature2")}
                      </>,
                      <>
                        <Camera size={16} style={{ verticalAlign: "middle" }} />{" "}
                        {t("chat", "helpFeature3")}
                      </>,
                      <>
                        <Sparkles size={16} style={{ verticalAlign: "middle" }} />{" "}
                        {t("chat", "helpFeature4")}
                      </>,
                    ]
                  : helpItemsProp || [
                      <>
                        <IoMenuOutline style={{ verticalAlign: "middle" }} />{" "}
                        {t("recipesView", "helpSideMenu")}
                      </>,
                      <>
                        <IoChatbubbleOutline style={{ verticalAlign: "middle" }} />{" "}
                        {t("recipesView", "helpTabChat")}
                      </>,
                      <>
                        <IoBookOutline style={{ verticalAlign: "middle" }} />{" "}
                        {t("recipesView", "helpTabRecipes")}
                      </>,
                      <>
                        <IoSearchOutline style={{ verticalAlign: "middle" }} />{" "}
                        {t("recipesView", "helpSearch")}
                      </>,
                      <>
                        <CiFilter style={{ verticalAlign: "middle" }} />{" "}
                        {t("recipesView", "helpFilter")}
                      </>,
                      <>
                        <BiSortAlt2 style={{ verticalAlign: "middle" }} />{" "}
                        {t("recipesView", "helpSort")}
                      </>,
                      <>
                        <Heart size={16} style={{ verticalAlign: "middle" }} />{" "}
                        {t("recipesView", "helpFavorites")}
                      </>,
                      <>
                        <span
                          style={{ verticalAlign: "middle", fontWeight: 700 }}
                        >
                          +
                        </span>{" "}
                        {t("recipesView", "helpAdd")}
                      </>,
                      <>
                        <BsGrid3X3Gap style={{ verticalAlign: "middle" }} />{" "}
                        {t("recipesView", "helpView")}
                      </>,
                    ]
              }
            />
          </div>
        </div>

        {showGreeting && (
          <div
            className={classes.headerTitle}
            style={{ display: showChat ? "none" : undefined }}
          >
            <Greeting />
          </div>
        )}

        {!showChat && persons.length > 0 && (
          <div className={classes.searchHeader}>
            <div className={classes.searchBoxWrapper}>
              <SearchBox
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder={t("common", "search")}
                examples={[
                  t("recipesView", "searchExample1"),
                  t("recipesView", "searchExample2"),
                  t("recipesView", "searchExample3"),
                  t("recipesView", "searchExample4"),
                ]}
              />
            </div>
            <div className={classes.headerControls}>
              <div className={classes.dropdownContainer} ref={filterRef}>
                <button
                  className={classes.filterButton}
                  onClick={toggleFilterMenu}
                >
                  <CiFilter />{" "}
                  <span className={classes.hideOnMobile}>
                    {t("recipesView", "filter")}
                  </span>{" "}
                  <IoChevronDown />
                </button>
                {!isMobile && showFilterMenu && (
                  <>
                    <div className={classes.dropdownOverlay} onClick={() => setShowFilterMenu(false)} />
                    <div className={classes.dropdownMenu} style={filterMenuStyle} onClick={(e) => e.stopPropagation()}>
                      <div className={classes.dropdownClose}>
                        {hasActiveFilters && (
                          <button className={classes.clearFiltersBtn} onClick={clearAllFilters}>{t("recipesView", "clearFilters")}</button>
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
              <div className={classes.dropdownContainer} ref={sortRef}>
                <button
                  className={classes.sortingButton}
                  onClick={toggleSortMenu}
                >
                  <BiSortAlt2 />{" "}
                  <span className={classes.hideOnMobile}>
                    {t("recipesView", "sorting")}
                  </span>{" "}
                  <IoChevronDown />
                </button>
                {!isMobile && showSortMenu && (
                  <>
                    <div className={classes.dropdownOverlay} onClick={() => setShowSortMenu(false)} />
                    <div className={classes.dropdownMenu} style={sortMenuStyle}>
                      <div className={classes.dropdownClose}>
                        <button className={classes.sortDirectionBtn} onClick={() => setSortDirection((prev) => prev === "asc" ? "desc" : "asc")} title={sortDirection === "asc" ? "Ascending" : "Descending"}>
                          {sortDirection === "asc" ? <BsSortUpAlt size={20} /> : <BsSortDownAlt size={20} />}
                        </button>
                        <CloseButton onClick={() => setShowSortMenu(false)} />
                      </div>
                      {sortContent}
                    </div>
                  </>
                )}
                {isMobile && (
                  <BottomSheet open={showSortMenu} onClose={() => setShowSortMenu(false)} title={t("recipesView", "sorting")}>
                    {sortContent}
                  </BottomSheet>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showChat ? (
        <ChatWindow showImageButton showGreeting={showGreeting} />
      ) : (
        <div>
          {recentlyViewed.length > 0 && (
            <div className={classes.recentlyViewedSection}>
              <div className={classes.sectionHeader}>
                <h2 className={classes.sectionTitle}>
                  <FaHistory
                    style={{ marginInlineEnd: "0.4rem", fontSize: "0.85em" }}
                  />
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
                                    <FaRegEdit />
                                  </button>
                                  <button
                                    className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeletePerson(person.id);
                                    }}
                                    title="Delete"
                                  >
                                    <GoTrash />
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
                                  <FaRegEdit />
                                </button>
                                <button
                                  className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeletePerson(person.id);
                                  }}
                                  title="Delete"
                                >
                                  <GoTrash />
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
                        <FaRegEdit />
                      </button>
                      <button
                        className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePerson(person.id);
                        }}
                        title="Delete"
                      >
                        <GoTrash />
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
                        <IoCopyOutline />
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

      {showAddAndFavorites && !showChat && (
        <Fab label={t("recipesView", "addNewRecipe")}>
          <AddRecipeMenu onSelect={onAddPerson} t={t} />
        </Fab>
      )}
    </div>
  );
}

function AddRecipeMenu({ onSelect, t }) {
  return (
    <div className={fabClasses.menu}>
      <button className={fabClasses.menuItem} onClick={() => onSelect("photo")}>
        <span className={fabClasses.menuLabel}>{t("addWizard", "fromPhoto")}</span>
        <span className={fabClasses.menuIcon}><GalleryIcon width={20} height={20} /></span>
      </button>
      <button className={fabClasses.menuItem} onClick={() => onSelect("url")}>
        <span className={fabClasses.menuLabel}>{t("addWizard", "fromUrl")}</span>
        <span className={fabClasses.menuIcon}><FiLink /></span>
      </button>
      <button className={fabClasses.menuItem} onClick={() => onSelect("text")}>
        <span className={fabClasses.menuLabel}>{t("addWizard", "fromText")}</span>
        <span className={fabClasses.menuIcon}><BsClipboardData /></span>
      </button>
      <button className={fabClasses.menuItem} onClick={() => onSelect("recording")}>
        <span className={fabClasses.menuLabel}>{t("addWizard", "fromRecording")}</span>
        <span className={fabClasses.menuIcon}><PiMicrophoneLight size="1.2em" /></span>
      </button>
      <button className={fabClasses.menuItem} onClick={() => onSelect("manual")}>
        <span className={fabClasses.menuLabel}>{t("addWizard", "manual")}</span>
        <span className={fabClasses.menuIcon}><PiPencilSimpleLineLight /></span>
      </button>
    </div>
  );
}

export { RecipesView };
export default RecipesView;
