import {
  EllipsisVertical, FilePenLine, Link, Files, Forward,
  Printer, Trash2, Heart, Share2, MonitorSmartphone, ChefHat,
} from "lucide-react";
import { ExportImageButton } from "../export-image-button";
import { useRecipeDetails } from "../RecipeDetailsContext";

export default function RecipeActionBar() {
  const {
    actionBarSentinelRef, actionBarRef, actionBarFixed, stickyHeaderRef,
    moreMenuRef, showMoreMenu, setShowMoreMenu, copyToMySuccess,
    onEdit, recipe, onDuplicate, onCopyRecipe, handleCopyClick,
    onCopyToMyRecipes, setCopyToMySuccess, onDelete, handleDeleteClick,
    onToggleFavorite, handleShare, wakeLockWrapperRef, wakeLockActive,
    toggleWakeLock, wakeLockToast, onEnterCookingMode, classes, t,
  } = useRecipeDetails();

  return (
    <>
      <div
        ref={actionBarSentinelRef}
        className={classes.actionBarSentinel}
        style={
          actionBarFixed && actionBarRef.current
            ? { height: actionBarRef.current.offsetHeight }
            : undefined
        }
      />
      <div
        ref={actionBarRef}
        className={classes.actionBar}
        style={
          actionBarFixed
            ? {
                position: "fixed",
                top: stickyHeaderRef.current
                  ? `${stickyHeaderRef.current.offsetHeight}px`
                  : "3.5rem",
                left: 0,
                right: 0,
                zIndex: 99,
                background: "var(--clr-bg-primary)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                paddingInline: "1rem",
              }
            : undefined
        }
      >
        <div className={classes.actionBarStart}>
          <div className={classes.moreMenuWrapper} ref={moreMenuRef}>
            <button
              className={classes.actionIcon}
              onClick={() => setShowMoreMenu((prev) => !prev)}
              title={t("common", "more")}
            >
              <EllipsisVertical size={20} />
            </button>
            {showMoreMenu && (
              <div className={classes.moreMenu}>
                {onEdit && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={() => {
                      setShowMoreMenu(false);
                      onEdit(recipe);
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "edit")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <FilePenLine size={18} />
                    </span>
                  </button>
                )}
                {recipe.sourceUrl && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={() => {
                      setShowMoreMenu(false);
                      window.open(
                        recipe.sourceUrl,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "sourceUrl")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <Link size={18} />
                    </span>
                  </button>
                )}
                {onDuplicate && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={() => {
                      setShowMoreMenu(false);
                      onDuplicate();
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "duplicate")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <Files size={18} />
                    </span>
                  </button>
                )}
                {onCopyRecipe && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleCopyClick();
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "copyToAnotherUser")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <Forward size={18} />
                    </span>
                  </button>
                )}
                {onCopyToMyRecipes && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={async () => {
                      setShowMoreMenu(false);
                      try {
                        await onCopyToMyRecipes(recipe.id);
                        setCopyToMySuccess(true);
                        setTimeout(() => setCopyToMySuccess(false), 3000);
                      } catch (err) {
                        console.error("Copy failed:", err);
                      }
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "copyToMyRecipes")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <Forward size={18} />
                    </span>
                  </button>
                )}
                <ExportImageButton recipe={recipe} asMenuItem />
                <button
                  className={classes.moreMenuItem}
                  onClick={() => {
                    setShowMoreMenu(false);
                    window.print();
                  }}
                >
                  <span className={classes.moreMenuLabel}>
                    {t("mealPlanner", "print")}
                  </span>
                  <span className={classes.moreMenuIcon}>
                    <Printer size={18} />
                  </span>
                </button>
                {onDelete && (
                  <button
                    className={`${classes.moreMenuItem} ${classes.moreMenuItemDanger}`}
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleDeleteClick();
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "delete")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <Trash2 size={18} />
                    </span>
                  </button>
                )}
              </div>
            )}
            {copyToMySuccess && (
              <div className={classes.copyToast}>
                ✓ {t("globalRecipes", "copied")}
              </div>
            )}
          </div>

          {onToggleFavorite && (
            <button
              className={`${classes.actionIcon} ${recipe.isFavorite ? classes.actionIconActive : ""}`}
              onClick={() => onToggleFavorite(recipe)}
              title={t("recipes", "favorite")}
            >
              {recipe.isFavorite ? (
                <Heart size={22} fill="red" color="red" />
              ) : (
                <Heart size={22} />
              )}
            </button>
          )}

          <button
            className={classes.actionIcon}
            onClick={handleShare}
            title={t("recipes", "share")}
          >
            <Share2 size={20} />
          </button>

          <div ref={wakeLockWrapperRef} style={{ position: "relative" }}>
            <button
              className={`${classes.wakeLockBtn} ${wakeLockActive ? classes.wakeLockBtnActive : ""}`}
              onClick={toggleWakeLock}
              title={t("recipes", "keepScreenOn")}
            >
              <MonitorSmartphone size={22} />
            </button>
            {wakeLockToast && (
              <div className={classes.wakeLockToast}>{wakeLockToast}</div>
            )}
          </div>
        </div>

        <div className={classes.actionBarEnd}>
          {onEnterCookingMode && (
            <button className={classes.cookingBtn} onClick={onEnterCookingMode}>
              <ChefHat size={18} />
              <span>{t("recipes", "cookingMode")}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
