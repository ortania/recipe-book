import { useState, useEffect, useMemo, useRef } from "react";
import { FaFilter, FaPlus, FaStar } from "react-icons/fa";
import { CiFilter } from "react-icons/ci";
import { IoMdStarOutline } from "react-icons/io";
import { IoChevronDown, IoAddOutline } from "react-icons/io5";
import { useRecipeBook } from "../../context";

import classes from "./recipes-view-new.module.css";

import { RecipeInfo } from "./RecipeInfo";
import { SimpleRecipeInfo } from "./SimpleRecipeInfo";
import { SearchBox } from "../controls/search";
import { EditRecipe } from "../forms/edit-recipe";
import { SortControls } from "../controls/sort-controls";
import { ViewToggleButton } from "../controls/view-toggle-button";
import ViewToggle from "../controls/view-toggle";
import ChatWindow from "../chat/ChatWindow";

import { search } from "./utils";

function RecipesView({
  persons,
  onAddPerson,
  onShowFavorites,
  groups = [],
  onEditPerson,
  onDeletePerson,
  selectedGroup,
  onSelectGroup,
}) {
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
  const { hasMoreRecipes, loadMoreRecipes } = useRecipeBook();

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

    // Filter by currently selected category from categories list
    if (selectedGroup !== "all") {
      filtered = filtered.filter(
        (person) =>
          person.categories && person.categories.includes(selectedGroup),
      );
    }

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
    selectedGroup,
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

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);
  const groupTitle =
    selectedGroup === "all"
      ? "All Recipes"
      : selectedGroupData?.name || "All Recipes";

  return (
    <div className={classes.contactsContainer}>
      <div className={classes.viewToggleWrapper}>
        <div className={classes.viewToggle}>
          <ViewToggle activeView={activeView} onViewChange={handleViewChange} />
        </div>
        <div className={classes.iconButtons}>
          <button
            className={classes.iconButton}
            onClick={onShowFavorites}
            title="Favorites"
          >
            <IoMdStarOutline />
          </button>
          <button
            className={classes.iconButton}
            onClick={onAddPerson}
            title="Add New Recipe"
          >
            <IoAddOutline />
          </button>
        </div>
      </div>

      <div className={classes.headerTitle}>
        <h2>{groupTitle}</h2>
        {selectedGroup !== "all" && selectedGroupData?.description && (
          <span className={classes.groupDescription}>
            - {selectedGroupData.description}
          </span>
        )}
      </div>

      <div className={classes.searchHeader}>
        <SearchBox
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search for labels"
        />
        <div className={classes.headerControls}>
          <div className={classes.dropdownContainer} ref={filterRef}>
            <button
              className={classes.filterButton}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <CiFilter /> Filter <IoChevronDown />
            </button>
            {showFilterMenu && (
              <div
                className={classes.dropdownMenu}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={classes.filterSection}>
                  <label className={classes.filterLabel}>מילות מפתח:</label>
                  <div className={classes.inputWrapper}>
                    <input
                      type="text"
                      className={classes.keywordInput}
                      placeholder="קמח, גבינה, עגבניות (הפרד בפסיק)"
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
                  <label className={classes.filterLabel}>זמן הכנה:</label>
                  <button
                    className={selectedPrepTime === "all" ? classes.active : ""}
                    onClick={() => setSelectedPrepTime("all")}
                  >
                    הכל
                  </button>
                  <button
                    className={
                      selectedPrepTime === "quick" ? classes.active : ""
                    }
                    onClick={() => setSelectedPrepTime("quick")}
                  >
                    מהיר (עד 15 דק')
                  </button>
                  <button
                    className={
                      selectedPrepTime === "medium" ? classes.active : ""
                    }
                    onClick={() => setSelectedPrepTime("medium")}
                  >
                    בינוני (15-30 דק')
                  </button>
                  <button
                    className={
                      selectedPrepTime === "long" ? classes.active : ""
                    }
                    onClick={() => setSelectedPrepTime("long")}
                  >
                    ארוך (מעל 30 דק')
                  </button>
                </div>
                <div className={classes.filterDivider}></div>
                <div className={classes.filterSection}>
                  <label className={classes.filterLabel}>רמת קושי:</label>
                  <button
                    className={
                      selectedDifficulty === "all" ? classes.active : ""
                    }
                    onClick={() => setSelectedDifficulty("all")}
                  >
                    הכל
                  </button>
                  <button
                    className={
                      selectedDifficulty === "VeryEasy" ? classes.active : ""
                    }
                    onClick={() => setSelectedDifficulty("VeryEasy")}
                  >
                    קל מאוד
                  </button>
                  <button
                    className={
                      selectedDifficulty === "Easy" ? classes.active : ""
                    }
                    onClick={() => setSelectedDifficulty("Easy")}
                  >
                    קל
                  </button>
                  <button
                    className={
                      selectedDifficulty === "Medium" ? classes.active : ""
                    }
                    onClick={() => setSelectedDifficulty("Medium")}
                  >
                    בינוני
                  </button>
                  <button
                    className={
                      selectedDifficulty === "Hard" ? classes.active : ""
                    }
                    onClick={() => setSelectedDifficulty("Hard")}
                  >
                    קשה
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
              Sorting <IoChevronDown />
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
                  Name{" "}
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
                  Prep Time{" "}
                  {sortField === "prepTime" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </button>
                <button
                  className={sortField === "difficulty" ? classes.active : ""}
                  onClick={() => {
                    handleSort("difficulty");
                    setShowSortMenu(false);
                  }}
                >
                  Difficulty{" "}
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
        <div className={classes.noResults}>No recipes found</div>
      ) : selectedGroup === "all" ? (
        <div>
          {groups
            .filter((group) => group.id !== "all")
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
                    <h2 className={classes.sectionTitle}>{group.name}</h2>
                    {groupRecipes.length > 8 && (
                      <button
                        className={classes.seeMore}
                        onClick={() => onSelectGroup && onSelectGroup(group.id)}
                      >
                        See more
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
              (person) => !person.categories || person.categories.length === 0,
            );
            if (uncategorizedRecipes.length === 0) return null;
            const displayRecipes = uncategorizedRecipes.slice(0, 8);
            return (
              <div key="uncategorized" className={classes.categorySection}>
                <div className={classes.sectionHeader}>
                  <h2 className={classes.sectionTitle}>Uncategorized</h2>
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

      {hasMoreRecipes && !showChat && (
        <div className={classes.loadMoreContainer}>
          <button className={classes.loadMoreButton} onClick={loadMoreRecipes}>
            טען עוד מתכונים
          </button>
        </div>
      )}

      {showChat && (
        <ChatWindow
          onClose={() => {
            setShowChat(false);
            setActiveView("recipes");
          }}
        />
      )}
    </div>
  );
}

export { RecipesView };
export default RecipesView;
