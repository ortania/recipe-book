import { useSearchOverlay } from "./SearchOverlayContext";

export default function SearchFilterContent() {
  const {
    hasActiveFilters, isMobile, clearAllFilters,
    selectedRating, setSelectedRating,
    selectedPrepTime, setSelectedPrepTime,
    selectedDifficulty, setSelectedDifficulty,
    selectedIngredientCount, setSelectedIngredientCount,
    selectedStepCount, setSelectedStepCount,
    ingredientInput, setIngredientInput,
    filterIngredients, addFilterIngredient, removeFilterIngredient,
    parentClasses, t,
  } = useSearchOverlay();

  return (
    <div className={parentClasses.dropdownScrollable}>
      {hasActiveFilters && isMobile && (
        <>
          <div className={parentClasses.filterSection}>
            <button
              className={parentClasses.clearFiltersBtn}
              onClick={clearAllFilters}
            >
              {t("recipesView", "clearFilters")}
            </button>
          </div>
          <div className={parentClasses.filterDivider} />
        </>
      )}
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>
          {t("recipesView", "sortByRating")}:
        </label>
        {["all", "3", "4", "5"].map((v) => (
          <button
            key={v}
            className={selectedRating === v ? parentClasses.active : ""}
            onClick={() => setSelectedRating(v)}
          >
            {v === "all"
              ? t("categories", "all")
              : `★${v}${v !== "5" ? "+" : ""}`}
          </button>
        ))}
      </div>
      <div className={parentClasses.filterDivider} />
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>
          {t("recipes", "prepTime")}:
        </label>
        <button
          className={selectedPrepTime === "all" ? parentClasses.active : ""}
          onClick={() => setSelectedPrepTime("all")}
        >
          {t("categories", "all")}
        </button>
        <button
          className={selectedPrepTime === "quick" ? parentClasses.active : ""}
          onClick={() => setSelectedPrepTime("quick")}
        >
          ≤15 {t("recipes", "minutes")}
        </button>
        <button
          className={selectedPrepTime === "medium" ? parentClasses.active : ""}
          onClick={() => setSelectedPrepTime("medium")}
        >
          15-30 {t("recipes", "minutes")}
        </button>
        <button
          className={selectedPrepTime === "long" ? parentClasses.active : ""}
          onClick={() => setSelectedPrepTime("long")}
        >
          30+ {t("recipes", "minutes")}
        </button>
      </div>
      <div className={parentClasses.filterDivider} />
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>
          {t("recipes", "difficulty")}:
        </label>
        {["all", "VeryEasy", "Easy", "Medium", "Hard"].map((v) => (
          <button
            key={v}
            className={selectedDifficulty === v ? parentClasses.active : ""}
            onClick={() => setSelectedDifficulty(v)}
          >
            {v === "all" ? t("categories", "all") : t("difficulty", v)}
          </button>
        ))}
      </div>
      <div className={parentClasses.filterDivider} />
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>
          {t("recipesView", "ingredientCount")}:
        </label>
        <button
          className={
            selectedIngredientCount === "all" ? parentClasses.active : ""
          }
          onClick={() => setSelectedIngredientCount("all")}
        >
          {t("categories", "all")}
        </button>
        <button
          className={
            selectedIngredientCount === "few" ? parentClasses.active : ""
          }
          onClick={() => setSelectedIngredientCount("few")}
        >
          ≤5
        </button>
        <button
          className={
            selectedIngredientCount === "medium" ? parentClasses.active : ""
          }
          onClick={() => setSelectedIngredientCount("medium")}
        >
          6-10
        </button>
        <button
          className={
            selectedIngredientCount === "many" ? parentClasses.active : ""
          }
          onClick={() => setSelectedIngredientCount("many")}
        >
          10+
        </button>
      </div>
      <div className={parentClasses.filterDivider} />
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>
          {t("recipesView", "stepCount")}:
        </label>
        <button
          className={selectedStepCount === "all" ? parentClasses.active : ""}
          onClick={() => setSelectedStepCount("all")}
        >
          {t("categories", "all")}
        </button>
        <button
          className={selectedStepCount === "few" ? parentClasses.active : ""}
          onClick={() => setSelectedStepCount("few")}
        >
          ≤3
        </button>
        <button
          className={
            selectedStepCount === "medium" ? parentClasses.active : ""
          }
          onClick={() => setSelectedStepCount("medium")}
        >
          4-7
        </button>
        <button
          className={selectedStepCount === "many" ? parentClasses.active : ""}
          onClick={() => setSelectedStepCount("many")}
        >
          7+
        </button>
      </div>
      <div className={parentClasses.filterDivider} />
      <div className={parentClasses.filterSection}>
        <label className={parentClasses.filterLabel}>
          {t("recipesView", "byIngredients")}:
        </label>
        <div className={parentClasses.ingredientInputRow}>
          <input
            type="text"
            className={parentClasses.ingredientInput}
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
            className={parentClasses.ingredientAddBtn}
            onClick={addFilterIngredient}
            type="button"
          >
            +
          </button>
        </div>
        {filterIngredients.length > 0 && (
          <div className={parentClasses.ingredientChips}>
            {filterIngredients.map((ing) => (
              <span key={ing} className={parentClasses.ingredientChip}>
                {ing}
                <button
                  className={parentClasses.ingredientChipRemove}
                  onClick={() => removeFilterIngredient(ing)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
