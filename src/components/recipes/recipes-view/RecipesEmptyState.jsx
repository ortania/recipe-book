import { createPortal } from "react-dom";
import Skeleton from "react-loading-skeleton";
import RecipeBookIcon from "../../icons/RecipeBookIcon/RecipeBookIcon";
import { CloseButton } from "../../controls/close-button";
import { AddRecipeDropdown } from "../../controls";
import { BottomSheet } from "../../controls/bottom-sheet";
import ChatWindow from "../../chat/ChatWindow";
import { Greeting } from "../../greeting";
import { useRecipesView } from "../RecipesViewContext";
import AddRecipeMenu from "./AddRecipeMenu";

export default function RecipesEmptyState() {
  const {
    backAction, mobileActionsEl, showChat, showGreeting,
    headerAction, selectedCategoryObjects, getTranslatedGroup,
    loading, isSimpleView, emptyTitle, showAddAndFavorites,
    isMobile, showEmptyAddSheet, setShowEmptyAddSheet, onAddPerson,
    classes, t,
  } = useRecipesView();

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
                    background: "var(--clr-bg-card)",
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
                      <Skeleton width="30%" height="0.9rem" borderRadius={6} />
                      <Skeleton width="25%" height="0.9rem" borderRadius={6} />
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
