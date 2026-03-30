import { UserCheck } from "lucide-react";
import { useRecipesView } from "../RecipesViewContext";
import { Fab } from "../../controls/fab";
import { BottomSheet } from "../../controls/bottom-sheet";
import { CloseButton } from "../../controls/close-button";
import { Modal } from "../../modal";
import { CategoriesSheetContent } from "../../categories-sheet-content";
import { CategoriesManagement } from "../../categories-management";
import AddRecipeMenu from "./AddRecipeMenu";

export default function RecipesSheets() {
  const {
    onAddRecipe,
    showChat,
    showSearch,
    t,
    isMobile,
    showCategoriesSheet,
    setShowCategoriesSheet,
    showManagement,
    setShowManagement,
    readOnlyCategories,
    categories,
    recipes,
    selectedCategories,
    toggleCategory,
    clearCategorySelection,
    addCategory,
    editCategory,
    deleteCategory,
    reorderCategories,
    sortCategoriesAlphabetically,
    getGroupContacts,
    sharerOptions,
    onSelectSharer,
    showSharerSheet,
    setShowSharerSheet,
    selectedSharer,
    followingList,
    classes,
  } = useRecipesView();

  return (
    <>
      {onAddRecipe && !showChat && !showSearch && (
        <Fab label={t("recipesView", "addNewRecipe")}>
          <AddRecipeMenu onSelect={onAddRecipe} t={t} />
        </Fab>
      )}

      {showCategoriesSheet && (
        <Modal onClose={() => setShowCategoriesSheet(false)} maxWidth="480px">
          <CategoriesSheetContent
            onClose={() => setShowCategoriesSheet(false)}
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
        </Modal>
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
                    />
                  </div>
                  {sharerListContent}
                </div>
              </>
            )
          );
        })()}
    </>
  );
}
