import { History, UtensilsCrossed, FilePenLine, Trash2, Copy, Bookmark, UserCheck } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { useRecipesView } from "../RecipesViewContext";
import { RecipeInfo } from "../RecipeInfo";
import { EditRecipe } from "../../forms/edit-recipe";

export default function RecipesMainContent() {
  const {
    recentlyViewed, classes, t, navigate, linkState, recentlyViewedKey, trackRecentlyViewed,
    showCategories, isAllSelected, selectedCategoryObjects, toggleCategory, getTranslatedGroup,
    clearCategorySelection, editingPerson, setEditingPerson, handleSaveEdit, groups,
    loading, isSimpleView, filteredAndSortedPersons, showSavedOnly, showFavoritesOnly,
    showAddAndFavorites, selectedGroup, onSelectGroup, onDeletePerson, onEditPerson,
    handleEditClick, handleToggleFavorite, hideRating, onCopyRecipe, onSaveRecipe, savedRecipes,
    onRate, userRatings, currentUser, followingList, hasMoreRecipes, loadMoreRecipes,
  } = useRecipesView();

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
            {recentlyViewed.map((person) => (
              <div
                key={person.id}
                className={classes.recentlyViewedCard}
                onClick={() =>
                  recentlyViewedKey
                    ? trackRecentlyViewed(person.id)
                    : navigate(
                        `/recipe/${person.id}`,
                        linkState ? { state: linkState } : undefined,
                      )
                }
              >
                <div className={classes.recentlyViewedImageWrap}>
                  <div className={classes.recentlyViewedNoImage} />
                  {person.image_src &&
                    typeof person.image_src === "string" &&
                    person.image_src.trim() !== "" && (
                      <img
                        src={person.image_src}
                        alt={person.name}
                        className={classes.recentlyViewedImage}
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                </div>
                <span className={classes.recentlyViewedName}>
                  {person.name}
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

      {editingPerson && (
        <EditRecipe
          person={editingPerson}
          onSave={handleSaveEdit}
          onCancel={() => setEditingPerson(null)}
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
      ) : filteredAndSortedPersons.length === 0 ? (
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
                  {isSimpleView ? (
                    <div className={classes.compactList}>
                      {displayRecipes.map((person) => (
                        <div
                          key={person.id}
                          className={classes.compactItem}
                          onClick={() =>
                            navigate(
                              `/recipe/${person.id}`,
                              linkState ? { state: linkState } : undefined,
                            )
                          }
                        >
                          <span className={classes.compactThumbWrap}>
                            <UtensilsCrossed size={16} />
                            {(person.image || person.image_src) && (
                              <img
                                src={person.image || person.image_src}
                                alt=""
                                className={classes.compactThumb}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            )}
                          </span>
                          <span className={classes.compactName}>
                            {person.name}
                          </span>
                          {showAddAndFavorites && (
                            <div className={classes.compactActions}>
                              <button
                                className={classes.compactActionBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(person);
                                }}
                                title="Edit"
                              >
                                <FilePenLine size={16} />
                              </button>
                              <button
                                className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeletePerson(person.id);
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
                      {displayRecipes.map((person) => (
                        <RecipeInfo
                          key={person.id}
                          person={person}
                          groups={groups}
                          onEdit={handleEditClick}
                          onDelete={onDeletePerson}
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
                {isSimpleView ? (
                  <div className={classes.compactList}>
                    {displayRecipes.map((person) => (
                      <div
                        key={person.id}
                        className={classes.compactItem}
                        onClick={() =>
                          navigate(
                            `/recipe/${person.id}`,
                            linkState ? { state: linkState } : undefined,
                          )
                        }
                      >
                        <span className={classes.compactThumbWrap}>
                          <UtensilsCrossed size={16} />
                          {(person.image || person.image_src) && (
                            <img
                              src={person.image || person.image_src}
                              alt=""
                              className={classes.compactThumb}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                        </span>
                        <span className={classes.compactName}>
                          {person.name}
                        </span>
                        {showAddAndFavorites && (
                          <div className={classes.compactActions}>
                            <button
                              className={classes.compactActionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(person);
                              }}
                              title="Edit"
                            >
                              <FilePenLine size={16} />
                            </button>
                            <button
                              className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePerson(person.id);
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
                    {displayRecipes.map((person) => (
                      <RecipeInfo
                        key={person.id}
                        person={person}
                        groups={groups}
                        onEdit={handleEditClick}
                        onDelete={onDeletePerson}
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
          {filteredAndSortedPersons.map((person) => (
            <div
              key={person.id}
              className={classes.compactItem}
              onClick={() =>
                recentlyViewedKey
                  ? trackRecentlyViewed(person.id)
                  : navigate(
                      `/recipe/${person.id}`,
                      linkState ? { state: linkState } : undefined,
                    )
              }
            >
              <span className={classes.compactThumbWrap}>
                <UtensilsCrossed size={16} />
                {(person.image || person.image_src) && (
                  <img
                    src={person.image || person.image_src}
                    alt=""
                    className={classes.compactThumb}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </span>
              <span className={classes.compactName}>{person.name}</span>
              {person.sharerName &&
                person.sharerUserId !== currentUser?.uid && (
                  <span
                    className={classes.compactSharer}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/sharer/${person.sharerUserId}`);
                    }}
                  >
                    {followingList.includes(person.sharerUserId) && (
                      <UserCheck
                        size={14}
                        style={{
                          marginInlineEnd: "0.2rem",
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                    {person.sharerName}
                  </span>
                )}
              {showAddAndFavorites && (
                <div className={classes.compactActions}>
                  <button
                    className={classes.compactActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(person);
                    }}
                    title="Edit"
                  >
                    <FilePenLine size={16} />
                  </button>
                  <button
                    className={`${classes.compactActionBtn} ${classes.compactDanger}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePerson(person.id);
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
                      onCopyRecipe(person.id);
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
                    onSaveRecipe(person.id);
                  }}
                  title={t("globalRecipes", "savedRecipes")}
                >
                  <Bookmark
                    size={16}
                    fill={
                      savedRecipes.includes(person.id)
                        ? "var(--clr-primary-700)"
                        : "none"
                    }
                    stroke={
                      savedRecipes.includes(person.id)
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
          {filteredAndSortedPersons.map((person) => (
            <RecipeInfo
              key={person.id}
              person={person}
              groups={groups}
              onEdit={onEditPerson ? handleEditClick : undefined}
              onDelete={onDeletePerson}
              onToggleFavorite={
                showAddAndFavorites ? handleToggleFavorite : undefined
              }
              onCopyRecipe={onCopyRecipe}
              onSaveRecipe={onSaveRecipe}
              isSaved={savedRecipes.includes(person.id)}
              onRate={onRate}
              userRating={userRatings[person.id] || 0}
              onCardClick={
                recentlyViewedKey ? trackRecentlyViewed : undefined
              }
              followingList={followingList}
              linkState={linkState}
              hideRating={hideRating}
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
  );
}
