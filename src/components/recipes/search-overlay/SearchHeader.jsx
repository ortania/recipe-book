import { ChevronDown, Filter, RotateCcw, LayoutGrid, Rows4 } from "lucide-react";
import { SearchBox } from "../../controls/search";
import { BottomSheet } from "../../controls/bottom-sheet";
import { CloseButton } from "../../controls/close-button";
import { BackButton } from "../../controls/back-button";
import { SortButton } from "../../controls/sort-button";
import { useSearchOverlay } from "./SearchOverlayContext";
import btnClasses from "../../../styles/shared/buttons.module.css";
import SearchFilterContent from "./SearchFilterContent";

const SORT_OPTIONS = [
  { field: "name", defaultDir: "asc" },
  { field: "newest", defaultDir: "desc", lockedDir: "desc" },
  { field: "prepTime", defaultDir: "asc" },
  { field: "difficulty", defaultDir: "asc" },
  { field: "rating", defaultDir: "desc" },
  { field: "favorites", defaultDir: "desc" },
];

export default function SearchHeader() {
  const {
    onClose, isMobile, onToggleView, isSimpleView,
    suggestionsRef, searchTerm, setSearchTerm,
    recentSearches, setShowRecentSearches,
    handleSearchKeyDown, handleSearchFocus,
    filterRef, toggleFilterMenu, showFilterMenu, setShowFilterMenu,
    hasActiveFilters, clearAllFilters, filterMenuStyle,
    sortField, sortDirection, handleSortChange,
    hasAnythingActive, clearSearch,
    parentClasses, classes, t,
  } = useSearchOverlay();

  return (
    <div
      className={`${parentClasses.searchHeader} ${onToggleView ? classes.searchHeaderEdges : ""} ${isMobile ? classes.mobileSearchHeader : ""}`}
    >
      <BackButton
        onClick={onClose}
        className={isMobile ? "" : parentClasses.desktopHeaderBtn}
      />
      <div
        className={
          onToggleView ? classes.searchCenter : classes.searchCenterDefault
        }
      >
        <div
          className={`${parentClasses.searchBoxWrapper} ${classes.searchBoxRelative}`}
          ref={suggestionsRef}
        >
          <SearchBox
            searchTerm={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              if (!val && recentSearches.length > 0) {
                setShowRecentSearches(true);
              } else {
                setShowRecentSearches(false);
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
            size={isMobile ? "medium" : "large"}
          />
        </div>
        <div className={parentClasses.headerControls}>
          <div className={parentClasses.dropdownContainer} ref={filterRef}>
            <button
              className={parentClasses.filterButton}
              onClick={toggleFilterMenu}
            >
              <Filter size={16} />
              <span className={parentClasses.hideOnMobile}>
                {t("recipesView", "filter")}
              </span>
              <span
                className={`${parentClasses.hideOnMobile} ${showFilterMenu ? parentClasses.chevronOpen : ""}`}
              >
                <ChevronDown size={16} />
              </span>
            </button>
            {!isMobile && showFilterMenu && (
              <>
                <div
                  className={parentClasses.dropdownOverlay}
                  onClick={() => setShowFilterMenu(false)}
                />
                <div
                  className={parentClasses.dropdownMenu}
                  style={filterMenuStyle}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={parentClasses.dropdownClose}>
                    {hasActiveFilters && (
                      <button
                        className={btnClasses.clearBtn}
                        style={{ marginInlineEnd: "auto" }}
                        onClick={clearAllFilters}
                      >
                        {t("recipesView", "clearFilters")}
                      </button>
                    )}
                    <CloseButton
                      onClick={() => setShowFilterMenu(false)}
                      size={20}
                    />
                  </div>
                  <SearchFilterContent />
                </div>
              </>
            )}
            {isMobile && (
              <BottomSheet
                open={showFilterMenu}
                onClose={() => setShowFilterMenu(false)}
                title={t("recipesView", "filter")}
              >
                <div style={{ minHeight: "50dvh" }}>
                  <SearchFilterContent />
                </div>
              </BottomSheet>
            )}
          </div>

          <SortButton
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            options={SORT_OPTIONS}
          />

          {hasAnythingActive && !isMobile && (
            <button className={btnClasses.clearBtn} onClick={clearSearch}>
              <RotateCcw size={14} />
              <span>
                {t("categories", "clearAllFilters") || "נקה הכל"}
              </span>
            </button>
          )}
        </div>
      </div>
      {onToggleView && (
        <button
          className={parentClasses.desktopHeaderBtn}
          onClick={onToggleView}
        >
          {isSimpleView ? <LayoutGrid size={28} /> : <Rows4 size={28} />}
        </button>
      )}
    </div>
  );
}
