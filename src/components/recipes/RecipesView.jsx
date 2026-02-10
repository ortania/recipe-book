import { useState, useEffect, useMemo, useRef } from "react";
import { FaFilter } from "react-icons/fa";
import { PiStar } from "react-icons/pi";
import { CiFilter } from "react-icons/ci";
import { IoMdStarOutline } from "react-icons/io";
import { IoChevronDown } from "react-icons/io5";
import { IoBookOutline } from "react-icons/io5";
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

function RecipesView({
  persons,
  onAddPerson,
  onShowFavorites,
  groups = [],
  onEditPerson,
  onDeletePerson,
  selectedGroup,
  onSelectGroup,
  showGreeting = false,
}) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [editingPerson, setEditingPerson] = useState(null);
  const [localPersons, setLocalPersons] = useState(persons);
  const [isSimpleView, setIsSimpleView] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState("");
  const [selectedPrepTime, setSelectedPrepTime] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [activeView, setActiveView] = useState("recipes");
  const [showChat, setShowChat] = useState(false);
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const {
    hasMoreRecipes,
    loadMoreRecipes,
    selectedCategories,
    toggleCategory,
    clearCategorySelection,
  } = useRecipeBook();

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
    let filtered = localPersons;

    // Filter by keyword in ingredients (supports multiple keywords separated by comma)
    if (keywordFilter.trim()) {
      const keywords = keywordFilter
        .toLowerCase()
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      filtered = filtered.filter((person) => {
        const ingredients = Array.isArray(person.ingredients)
          ? person.ingredients
          : [];
        const ingredientsText = ingredients.join(" ").toLowerCase();

        return keywords.some((keyword) => ingredientsText.includes(keyword));
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
        // Case-insensitive comparison
        return (
          person.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
        );
      });
    }

    // Search and sort
    return search(filtered, searchTerm, sortField, sortDirection);
  }, [
    localPersons,
    searchTerm,
    sortField,
    sortDirection,
    keywordFilter,
    selectedPrepTime,
    selectedDifficulty,
  ]);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSaveEdit = (updatedPerson) => {
    // Pass the updated person directly to the parent component
    onEditPerson(updatedPerson);
    setEditingPerson(null);

    // Also update the local state to reflect changes immediately
    setLocalPersons((prev) =>
      prev.map((person) =>
        person.id === updatedPerson.id ? updatedPerson : person,
      ),
    );
  };

  const handleToggleFavorite = (personId, isFavorite) => {
    // Find the person to update
    const personToUpdate = localPersons.find(
      (person) => person.id === personId,
    );

    if (personToUpdate) {
      // Create updated person with the new favorite status
      const updatedPerson = {
        ...personToUpdate,
        isFavorite,
      };

      // Update the local state
      setLocalPersons((prev) =>
        prev.map((person) => (person.id === personId ? updatedPerson : person)),
      );

      // Update the parent state
      onEditPerson(updatedPerson);
    }
  };

  const toggleView = () => {
    setIsSimpleView((prev) => !prev);
  };

  const { getTranslated: getTranslatedGroup } = useTranslatedList(
    groups,
    "name",
  );
  const isAllSelected = selectedCategories.includes("all");
  const selectedCategoryObjects = isAllSelected
    ? []
    : selectedCategories
        .map((id) => groups.find((g) => g.id === id))
        .filter(Boolean);

  if (!persons || persons.length === 0) {
    return (
      <div className={classes.recipesContainer}>
        <div className={classes.viewToggleWrapper}>
          <div className={classes.viewToggle}>
            <ViewToggle
              activeView={activeView}
              onViewChange={handleViewChange}
            />
          </div>
          <div className={classes.iconButtons}>
            <AddButton
              type="circle"
              onClick={onShowFavorites}
              title="Favorites"
            >
              <PiStar />
            </AddButton>
            <AddRecipeDropdown onSelect={(method) => onAddPerson(method)} />
          </div>
        </div>

        <div style={{ display: showChat ? "block" : "none" }}>
          <ChatWindow />
        </div>

        <div style={{ display: showChat ? "none" : "block" }}>
          {showGreeting && (
            <div className={classes.headerTitle}>
              <Greeting />
            </div>
          )}

          <div className={classes.emptyState}>
            <IoBookOutline className={classes.emptyIcon} />
            <p className={classes.emptyText}>
              {t("recipesView", "emptyTitle")}
            </p>
            <AddRecipeDropdown onSelect={(method) => onAddPerson(method)}>
              <span className={classes.emptyButton}>
                {t("recipesView", "addNewRecipe")}
              </span>
            </AddRecipeDropdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.recipesContainer}>
      <div className={classes.viewToggleWrapper}>
        <div className={classes.viewToggle}>
          <ViewToggle activeView={activeView} onViewChange={handleViewChange} />
        </div>
        <div className={classes.iconButtons}>
          <AddButton
            type="circle"
            // className={classes.iconButton}
            onClick={onShowFavorites}
            title="Favorites"
          >
            <PiStar />
          </AddButton>
          <AddRecipeDropdown onSelect={(method) => onAddPerson(method)} />
        </div>
      </div>

      {showChat ? (
        <ChatWindow />
      ) : (
        <div>
          {showGreeting && (
            <div className={classes.headerTitle}>
              <Greeting />
            </div>
          )}

          {!isAllSelected && selectedCategoryObjects.length > 0 && (
            <div className={classes.filterChips}>
              {/* <span className={classes.filterChipsLabel}>
            {t("categories", "filteredBy")}
          </span> */}
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

          <div className={classes.searchHeader}>
            <SearchBox
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder={t("common", "search")}
            />
            <div className={classes.headerControls}>
              <div className={classes.dropdownContainer} ref={filterRef}>
                <button
                  className={classes.filterButton}
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                  <CiFilter /> {t("recipesView", "filter")} <IoChevronDown />
                </button>
                {showFilterMenu && (
                  <div
                    className={classes.dropdownMenu}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={classes.filterSection}>
                      <label className={classes.filterLabel}>
                        {t("common", "search")}:
                      </label>
                      <div className={classes.inputWrapper}>
                        <input
                          type="text"
                          className={classes.keywordInput}
                          placeholder={t("recipesView", "keywordPlaceholder")}
                          value={keywordFilter}
                          onChange={(e) => setKeywordFilter(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoComplete="off"
                          style={{
                            color: "#000",
                            backgroundColor: "#fff",
                            fontSize: "1rem",
                            direction: "rtl",
                            textAlign: "right",
                            position: "relative",
                            zIndex: 1,
                          }}
                        />
                        {keywordFilter && (
                          <button
                            className={classes.clearKeyword}
                            onClick={() => setKeywordFilter("")}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={classes.filterDivider}></div>
                    <div className={classes.filterSection}>
                      <label className={classes.filterLabel}>
                        {t("recipes", "prepTime")}:
                      </label>
                      <button
                        className={
                          selectedPrepTime === "all" ? classes.active : ""
                        }
                        onClick={() => setSelectedPrepTime("all")}
                      >
                        {t("categories", "all")}
                      </button>
                      <button
                        className={
                          selectedPrepTime === "quick" ? classes.active : ""
                        }
                        onClick={() => setSelectedPrepTime("quick")}
                      >
                        ≤15 {t("recipes", "minutes")}
                      </button>
                      <button
                        className={
                          selectedPrepTime === "medium" ? classes.active : ""
                        }
                        onClick={() => setSelectedPrepTime("medium")}
                      >
                        15-30 {t("recipes", "minutes")}
                      </button>
                      <button
                        className={
                          selectedPrepTime === "long" ? classes.active : ""
                        }
                        onClick={() => setSelectedPrepTime("long")}
                      >
                        30+ {t("recipes", "minutes")}
                      </button>
                    </div>
                    <div className={classes.filterDivider}></div>
                    <div className={classes.filterSection}>
                      <label className={classes.filterLabel}>
                        {t("recipes", "difficulty")}:
                      </label>
                      <button
                        className={
                          selectedDifficulty === "all" ? classes.active : ""
                        }
                        onClick={() => setSelectedDifficulty("all")}
                      >
                        {t("categories", "all")}
                      </button>
                      <button
                        className={
                          selectedDifficulty === "VeryEasy"
                            ? classes.active
                            : ""
                        }
                        onClick={() => setSelectedDifficulty("VeryEasy")}
                      >
                        {t("difficulty", "VeryEasy")}
                      </button>
                      <button
                        className={
                          selectedDifficulty === "Easy" ? classes.active : ""
                        }
                        onClick={() => setSelectedDifficulty("Easy")}
                      >
                        {t("difficulty", "Easy")}
                      </button>
                      <button
                        className={
                          selectedDifficulty === "Medium" ? classes.active : ""
                        }
                        onClick={() => setSelectedDifficulty("Medium")}
                      >
                        {t("difficulty", "Medium")}
                      </button>
                      <button
                        className={
                          selectedDifficulty === "Hard" ? classes.active : ""
                        }
                        onClick={() => setSelectedDifficulty("Hard")}
                      >
                        {t("difficulty", "Hard")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={classes.dropdownContainer} ref={sortRef}>
                <button
                  className={classes.sortingButton}
                  onClick={() => setShowSortMenu(!showSortMenu)}
                >
                  {t("recipesView", "sorting")} <IoChevronDown />
                </button>
                {showSortMenu && (
                  <div className={classes.dropdownMenu}>
                    <button
                      className={sortField === "name" ? classes.active : ""}
                      onClick={() => {
                        handleSort("name");
                        setShowSortMenu(false);
                      }}
                    >
                      {t("recipesView", "sortByName")}{" "}
                      {sortField === "name" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      className={sortField === "prepTime" ? classes.active : ""}
                      onClick={() => {
                        handleSort("prepTime");
                        setShowSortMenu(false);
                      }}
                    >
                      {t("recipesView", "sortByPrepTime")}{" "}
                      {sortField === "prepTime" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      className={
                        sortField === "difficulty" ? classes.active : ""
                      }
                      onClick={() => {
                        handleSort("difficulty");
                        setShowSortMenu(false);
                      }}
                    >
                      {t("recipesView", "sortByDifficulty")}{" "}
                      {sortField === "difficulty" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

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
              {t("recipesView", "noResults")}
            </div>
          ) : selectedGroup === "all" ? (
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
                      <div className={classes.recipeGrid}>
                        {displayRecipes.map((person) => (
                          <RecipeInfo
                            key={person.id}
                            person={person}
                            groups={groups}
                            onEdit={() => setEditingPerson(person)}
                            onDelete={onDeletePerson}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              {/* Show uncategorized recipes */}
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
                    <div className={classes.recipeGrid}>
                      {displayRecipes.map((person) => (
                        <RecipeInfo
                          key={person.id}
                          person={person}
                          groups={groups}
                          onEdit={() => setEditingPerson(person)}
                          onDelete={onDeletePerson}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className={classes.recipeGrid}>
              {filteredAndSortedPersons.map((person) => (
                <RecipeInfo
                  key={person.id}
                  person={person}
                  groups={groups}
                  onEdit={() => setEditingPerson(person)}
                  onDelete={onDeletePerson}
                  onToggleFavorite={handleToggleFavorite}
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
    </div>
  );
}

export { RecipesView };
export default RecipesView;
