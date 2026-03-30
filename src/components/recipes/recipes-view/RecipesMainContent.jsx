import { useState } from "react";
import {
  History,
  UtensilsCrossed,
  FilePenLine,
  Trash2,
  Copy,
  Bookmark,
  UserCheck,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { useRecipesView } from "../RecipesViewContext";
import { RecipeInfo } from "../RecipeInfo";
import { EditRecipe } from "../../forms/edit-recipe";
import { ConfirmDialog } from "../../forms/confirm-dialog";

export default function RecipesMainContent() {
  const {
    recentlyViewed,
    classes,
    t,
    navigate,
    linkState,
    recentlyViewedKey,
    trackRecentlyViewed,
    showCategories,
    isAllSelected,
    selectedCategoryObjects,
    toggleCategory,
    getTranslatedGroup,
    clearCategorySelection,
    editingRecipe,
    setEditingRecipe,
    handleSaveEdit,
    groups,
    loading,
    isSimpleView,
    filteredAndSortedRecipes,
    showSavedOnly,
    showFavoritesOnly,
    showAddAndFavorites,
    selectedGroup,
    onSelectGroup,
    onDeleteRecipe,
    onEditRecipe,
    handleEditClick,
    handleToggleFavorite,
    hideRating,
    onCopyRecipe,
    onSaveRecipe,
    savedRecipes,
    onRate,
    userRatings,
    currentUser,
    followingList,
    hasMoreRecipes,
    loadMoreRecipes,
    onSaved,
  } = useRecipesView();

  const [recipeToDelete, setRecipeToDelete] = useState(null);

  const handleCompactDeleteClick = (recipe) => {
    setRecipeToDelete(recipe);
  };

  const handleConfirmDelete = () => {
    if (recipeToDelete) {
      onDeleteRecipe(recipeToDelete.id);
      setRecipeToDelete(null);
    }
  };

  return (
    <div>
      {recentlyViewed.length > 0 && (
        <div className={classes.recentlyViewedSection}>
          <div className={classes.sectionHeader}>
            <h2 className={classes.sectionTitle}>
              <History size={16} style={{ marginInlineEnd: "0.4rem" }} />
              {t("recipesView", "recentlyViewed")}
            </h2>
          </div>
          <div className={classes.recentlyViewedScroll}>
            {recentlyViewed.map((recipe) => (
              <div
                key={recipe.id}
                className={classes.recentlyViewedCard}
                onClick={() =>
                  recentlyViewedKey
                    ? trackRecentlyViewed(recipe.id)
                    : navigate(
                        `/recipe/${recipe.id}`,
                        linkState ? { state: linkState } : undefined,
                      )
                }
              >
                <div className={classes.recentlyViewedImageWrap}>
                  <div className={classes.recentlyViewedNoImage} />
                  {recipe.image_src &&
                    typeof recipe.image_src === "string" &&
                    recipe.image_src.trim() !== "" && (
                      <img
                        src={recipe.image_src}
                        alt={recipe.name}
                        className={classes.recentlyViewedImage}
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                </div>
                <span className={classes.recentlyViewedName}>
                  {recipe.name}
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

      {editingRecipe && (
        <EditRecipe
          recipe={editingRecipe}
          onSave={handleSaveEdit}
          onCancel={() => setEditingRecipe(null)}
          onSaved={onSaved}
          onDelete={onDeleteRecipe}
          groups={groups}
        />
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
      ) : filteredAndSortedRecipes.length === 0 ? (
        <div className={classes.noResults}>
          {showSavedOnly
            ? t("globalRecipes", "noSavedRecipes")
            : showFavoritesOnly
              ? t("favorites", "noFavorites")
              : t("recipesView", "noResults")}
        </div>
      ) : showCategories && selectedGroup === "all" ? (
        <div>
          {groups
            .filter((group) => group.id !== "all" && group.id !== "general")
            .map((group) => {
              const groupRecipes = filteredAndSortedRecipes.filter(
                (recipe) =>
                  recipe.categories && recipe.categories.includes(group.id),
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
                        onClick={() => onSelectGroup && onSelectGroup(group.id)}
                      >
                        {t("categories", "seeMore")}
                      </button>
                    )}
                  </div>
                  {isSimpleView ? (
                    <div className={classes.compactList}>
                      {displayRecipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className={classes.compactItem}
                          onClick={() =>
                            navigate(
                              `/recipe/${recipe.id}`,
                              linkState ? { state: linkState } : undefined,
                            )
                          }
                        >
                          <span className={classes.compactThumbWrap}>
                            <UtensilsCrossed size={16} />
                            {(recipe.image || recipe.image_src) && (
                              <img
                                src={recipe.image || recipe.image_src}
                                alt=""
                                className={classes.compactThumb}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            )}
                          </span>
                          <span className={classes.compactName}>
                            {recipe.name}
                          </span>
                          {showAddAndFavorites && (
                            <div className={classes.compactActions}>
                              <button
                                className={classes.compactActionBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(recipe);
                                }}
                                title="Edit"
                              >
                                <FilePenLine size={16} />
                              </button>
                              <button
                                className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompactDeleteClick(recipe);
                                }}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={classes.recipeGrid}>
                      {displayRecipes.map((recipe) => (
                        <RecipeInfo
                          key={recipe.id}
                          recipe={recipe}
                          groups={groups}
                          onEdit={handleEditClick}
                          onDelete={onDeleteRecipe}
                          onToggleFavorite={handleToggleFavorite}
                          hideRating={hideRating}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          {(() => {
            const validGroupIds = new Set(
              groups
                .filter((g) => g.id !== "all" && g.id !== "general")
                .map((g) => g.id),
            );
            const uncategorizedRecipes = filteredAndSortedRecipes.filter(
              (recipe) =>
                !recipe.categories ||
                recipe.categories.length === 0 ||
                !recipe.categories.some((catId) => validGroupIds.has(catId)),
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
                    {displayRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className={classes.compactItem}
                        onClick={() =>
                          navigate(
                            `/recipe/${recipe.id}`,
                            linkState ? { state: linkState } : undefined,
                          )
                        }
                      >
                        <span className={classes.compactThumbWrap}>
                          <UtensilsCrossed size={16} />
                          {(recipe.image || recipe.image_src) && (
                            <img
                              src={recipe.image || recipe.image_src}
                              alt=""
                              className={classes.compactThumb}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                        </span>
                        <span className={classes.compactName}>
                          {recipe.name}
                        </span>
                        {showAddAndFavorites && (
                          <div className={classes.compactActions}>
                            <button
                              className={classes.compactActionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(recipe);
                              }}
                              title="Edit"
                            >
                              <FilePenLine size={16} />
                            </button>
                            <button
                              className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompactDeleteClick(recipe);
                              }}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={classes.recipeGrid}>
                    {displayRecipes.map((recipe) => (
                      <RecipeInfo
                        key={recipe.id}
                        recipe={recipe}
                        groups={groups}
                        onEdit={handleEditClick}
                        onDelete={onDeleteRecipe}
                        onToggleFavorite={handleToggleFavorite}
                        hideRating={hideRating}
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
          {filteredAndSortedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={classes.compactItem}
              onClick={() =>
                recentlyViewedKey
                  ? trackRecentlyViewed(recipe.id)
                  : navigate(
                      `/recipe/${recipe.id}`,
                      linkState ? { state: linkState } : undefined,
                    )
              }
            >
              <span className={classes.compactThumbWrap}>
                <UtensilsCrossed size={16} />
                {(recipe.image || recipe.image_src) && (
                  <img
                    src={recipe.image || recipe.image_src}
                    alt=""
                    className={classes.compactThumb}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </span>
              <span className={classes.compactName}>{recipe.name}</span>
              {recipe.sharerName &&
                recipe.sharerUserId !== currentUser?.uid && (
                  <span
                    className={classes.compactSharer}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/sharer/${recipe.sharerUserId}`);
                    }}
                  >
                    {followingList.includes(recipe.sharerUserId) && (
                      <UserCheck
                        size={14}
                        style={{
                          marginInlineEnd: "0.2rem",
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                    {recipe.sharerName}
                  </span>
                )}
              {showAddAndFavorites && (
                <div className={classes.compactActions}>
                  <button
                    className={classes.compactActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(recipe);
                    }}
                    title="Edit"
                  >
                    <FilePenLine size={16} />
                  </button>
                  <button
                    className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompactDeleteClick(recipe);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              {onCopyRecipe && (
                <div className={classes.compactActions}>
                  <button
                    className={classes.compactActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyRecipe(recipe.id);
                    }}
                    title={t("globalRecipes", "copyToMyRecipes")}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              )}
              {onSaveRecipe && (
                <button
                  className={classes.compactActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveRecipe(recipe.id);
                  }}
                  title={t("globalRecipes", "savedRecipes")}
                >
                  <Bookmark
                    size={16}
                    fill={
                      savedRecipes.includes(recipe.id)
                        ? "var(--clr-primary-700)"
                        : "none"
                    }
                    stroke={
                      savedRecipes.includes(recipe.id)
                        ? "var(--clr-primary-700)"
                        : "currentColor"
                    }
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={classes.recipeGrid}>
          {filteredAndSortedRecipes.map((recipe) => (
            <RecipeInfo
              key={recipe.id}
              recipe={recipe}
              groups={groups}
              onEdit={onEditRecipe ? handleEditClick : undefined}
              onDelete={onDeleteRecipe}
              onToggleFavorite={
                showAddAndFavorites ? handleToggleFavorite : undefined
              }
              onCopyRecipe={onCopyRecipe}
              onSaveRecipe={onSaveRecipe}
              isSaved={savedRecipes.includes(recipe.id)}
              onRate={onRate}
              userRating={userRatings[recipe.id] || 0}
              onCardClick={recentlyViewedKey ? trackRecentlyViewed : undefined}
              followingList={followingList}
              linkState={linkState}
              hideRating={hideRating}
            />
          ))}
        </div>
      )}

      {hasMoreRecipes && (
        <div className={classes.loadMoreContainer}>
          <button className={classes.loadMoreButton} onClick={loadMoreRecipes}>
            {t("recipesView", "loadMore")}
          </button>
        </div>
      )}

      {recipeToDelete && (
        <ConfirmDialog
          title={t("confirm", "deleteRecipe")}
          message={`${t("confirm", "deleteRecipeMsg")} "${recipeToDelete.name}"? ${t("confirm", "cannotUndo")}.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setRecipeToDelete(null)}
          confirmText={t("confirm", "yesDelete")}
          cancelText={t("common", "cancel")}
        />
      )}
    </div>
  );
}
