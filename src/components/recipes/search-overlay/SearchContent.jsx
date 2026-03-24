import { Search } from "lucide-react";
import { RecipeInfo } from "../RecipeInfo";
import { useSearchOverlay } from "./SearchOverlayContext";

export default function SearchContent() {
  const {
    showCategories, isAllSelected, selectedCategoryObjects,
    toggleCategory, clearCategorySelection, getTranslatedGroup,
    showResults, filteredResults, isSimpleView, handleRecipeClick,
    groups, onEditPerson, onDeletePerson, onToggleFavorite,
    onCopyRecipe, userRatings, onRate, hideRating,
    lastFoundData, recentSearches, parentClasses, classes, t,
  } = useSearchOverlay();

  return (
    <>
      {showCategories &&
        !isAllSelected &&
        selectedCategoryObjects.length > 0 && (
          <div className={parentClasses.filterChips}>
            {selectedCategoryObjects.map((cat) => (
              <button
                key={cat.id}
                className={parentClasses.filterChip}
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

      <div>
        {showResults ? (
          <>
            <div className={classes.resultsCount}>
              {filteredResults.length}{" "}
              {t("recipesView", "results") || "תוצאות"}
            </div>
            {filteredResults.length === 0 ? (
              <div className={classes.noResultsBlock}>
                <p className={classes.noResultsTitle}>
                  {t("recipesView", "noResults")}
                </p>
                <p className={classes.noResultsHint}>
                  {t("recipesView", "noResultsHint") ||
                    "נסי מילה אחרת או הסירי סינון"}
                </p>
              </div>
            ) : isSimpleView ? (
              <div className={parentClasses.compactList}>
                {filteredResults.map((person) => (
                  <div
                    key={person.id}
                    className={parentClasses.compactItem}
                    onClick={() => handleRecipeClick(person.id)}
                  >
                    <span className={parentClasses.compactName}>
                      {person.name}
                    </span>
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
                    hideRating={hideRating}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {lastFoundData.recipes.length > 0 && (
              <div className={parentClasses.recentlyViewedSection}>
                <div className={parentClasses.sectionHeader}>
                  <h2 className={parentClasses.sectionTitle}>
                    <Search size={16} style={{ marginInlineEnd: "0.4rem" }} />
                    {t("recipesView", "foundRecently") || "נמצאו לאחרונה"}
                    {lastFoundData.term && (
                      <span className={classes.foundTermLabel}>
                        {" "}
                        "{lastFoundData.term}"
                      </span>
                    )}
                  </h2>
                </div>
                <div className={parentClasses.recentlyViewedScroll}>
                  {lastFoundData.recipes.map((person) => (
                    <div
                      key={person.id}
                      className={parentClasses.recentlyViewedCard}
                      onClick={() => handleRecipeClick(person.id)}
                    >
                      {person.image_src && (
                        <img
                          src={person.image_src}
                          alt={person.name}
                          className={parentClasses.recentlyViewedImage}
                          loading="lazy"
                        />
                      )}
                      <span className={parentClasses.recentlyViewedName}>
                        {person.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentSearches.length === 0 &&
              lastFoundData.recipes.length === 0 && (
              <div className={classes.emptyState}>
                <p className={classes.emptyHint}>
                  {t("recipesView", "searchHint") ||
                    "חפש מתכון לפי שם, מרכיב או קטגוריה"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
