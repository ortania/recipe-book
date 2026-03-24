import { Heart, Bookmark, LayoutGrid, Rows4, Users } from "lucide-react";
import { useRecipesView } from "../RecipesViewContext";
import ViewToggle from "../../controls/view-toggle";
import { SearchBox } from "../../controls/search";
import { SortButton } from "../../controls/sort-button";
import { AddRecipeDropdown, CloseButton } from "../../controls";
import { BackButton } from "../../controls/back-button";
import { Greeting } from "../../greeting";

export default function RecipesStickyTop() {
  const {
    showSearch, showTabs, mobileTabsEl,
    headerAction, backAction, onAddPerson,
    activeView, handleViewChange, recipesTabLabel,
    classes, searchPlaceholder, t,
    setShowSearch, sortField, sortDirection, handleRecipeSortChange, recipeSortOptions,
    sharerOptions, onSelectSharer, setShowSharerSheet,
    toggleView, isSimpleView,
    showGreeting, showChat,
    persons, hasSelectedCategories, isMobile,
    showAddAndFavorites, showFavoritesOnly, setShowFavoritesOnly,
    onSaveRecipe, showSavedOnly, setShowSavedOnly,
  } = useRecipesView();

  const viewToggleElement = (
    <ViewToggle
      activeView={activeView}
      onViewChange={handleViewChange}
      recipesLabel={recipesTabLabel}
    />
  );

  return (
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
          {/* {showCategories && (
            <button
              className={classes.desktopHeaderBtn}
              onClick={() => setShowCategoriesSheet(true)}
              title={t("nav", "categories")}
            >
              <Tags size={28} />
            </button>
          )} */}
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
                    fill="var(--clr-favorite)"
                    stroke="var(--clr-favorite)"
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
                    fill="var(--clr-primary-700)"
                    stroke="var(--clr-primary-700)"
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
  );
}
