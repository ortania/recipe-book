import { useNavigate } from "react-router-dom";
import {
  ChefHat,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Apple,
  Flame,
  Drumstick,
  Droplet,
  Wheat,
  Candy,
  Leaf,
  Droplets,
  Pill,
  Sparkles,
  Bone,
  Atom,
  Info,
  MessageSquare,
  GitBranch,
} from "lucide-react";
import { AddButton } from "../../controls/add-button";
import { useRecipeDetails } from "../RecipeDetailsContext";
import { hasTime, formatTime } from "../utils";

export default function RecipeInfoSection() {
  const navigate = useNavigate();
  const {
    hideRating,
    onRate,
    hoverStar,
    setHoverStar,
    userRating,
    recipe,
    commentCount,
    language,
    getCategoryName,
    onCategoryClick,
    servings,
    setServings,
    showNutrition,
    setShowNutrition,
    scaleNutrition,
    onSaveRecipe,
    classes,
    t,
  } = useRecipeDetails();

  return (
    <>
      {recipe.parentRecipeId && recipe.parentRecipeId !== recipe.id && (
        <div className={classes.variationBanner}>
          <GitBranch size={15} />
          <span>
            {t("recipes", "variationOf")}{" "}
            <button
              className={classes.baseRecipeLink}
              onClick={() => navigate(`/recipe/${recipe.parentRecipeId}`)}
            >
              {recipe.parentRecipeName || t("recipes", "baseRecipe")}
            </button>
          </span>
        </div>
      )}
      {!hideRating && (
        <>
          {onRate ? (
            <div className={classes.ratingSection}>
              <div className={classes.ratingRow}>
                <span className={classes.ratingLabel}>
                  {t("globalRecipes", "myRating")}:
                </span>
                <div className={classes.rating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={classes.ratingStar}
                      role="button"
                      tabIndex={0}
                      style={{
                        color:
                          star <= (hoverStar || userRating)
                            ? "#ffc107"
                            : "#e0e0e0",
                      }}
                      onMouseEnter={() => setHoverStar(star)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() =>
                        onRate(recipe.id, star === userRating ? 0 : star)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          onRate(recipe.id, star === userRating ? 0 : star);
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              {recipe.avgRating > 0 && (
                <div className={classes.ratingRow}>
                  <span className={classes.ratingLabel}>
                    {t("globalRecipes", "avgRating")}:
                  </span>
                  <div className={classes.rating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={classes.ratingStar}
                        style={{
                          color:
                            star <= Math.round(recipe.avgRating)
                              ? "#ffc107"
                              : "#e0e0e0",
                          cursor: "default",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className={classes.ratingMeta}>
                    ({Number(recipe.avgRating).toFixed(1)} ·{" "}
                    {recipe.ratingCount})
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className={classes.rating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={classes.ratingStar}
                  role="button"
                  tabIndex={0}
                  style={{
                    color:
                      star <= (hoverStar || recipe.rating || 0)
                        ? "#ffc107"
                        : "#e0e0e0",
                  }}
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => {
                    if (!onSaveRecipe) return;
                    const newRating = star === recipe.rating ? 0 : star;
                    onSaveRecipe({ ...recipe, rating: newRating });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (!onSaveRecipe) return;
                      const newRating = star === recipe.rating ? 0 : star;
                      onSaveRecipe({ ...recipe, rating: newRating });
                    }
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {commentCount > 0 && (
        <div className={classes.commentCountRow}>
          <MessageSquare size={14} />
          <span>
            {commentCount} {t("comments", "commentsCount")}
          </span>
        </div>
      )}

      {((recipe.difficulty && recipe.difficulty !== "Unknown") ||
        hasTime(recipe.prepTime) ||
        hasTime(recipe.cookTime)) && (
        <div className={classes.recipeInfo}>
          {recipe.difficulty && recipe.difficulty !== "Unknown" && (
            <span className={classes.infoItem}>
              <ChefHat className={classes.infoIcon} size={16} />
              {t("difficulty", recipe.difficulty)}
            </span>
          )}
          {recipe.difficulty &&
            recipe.difficulty !== "Unknown" &&
            hasTime(recipe.prepTime) && (
              <span className={classes.infoDot}>•</span>
            )}
          {hasTime(recipe.prepTime) && (
            <span className={classes.infoItem}>
              <Clock className={classes.infoIcon} size={16} />
              {language === "he" || language === "mixed" ? "הכנה" : "Prep"}{" "}
              {formatTime(recipe.prepTime, t("recipes", "minutes"))}
            </span>
          )}
          {hasTime(recipe.cookTime) && hasTime(recipe.prepTime) && (
            <span className={classes.infoDot}>•</span>
          )}
          {hasTime(recipe.cookTime) &&
            !hasTime(recipe.prepTime) &&
            recipe.difficulty &&
            recipe.difficulty !== "Unknown" && (
              <span className={classes.infoDot}>•</span>
            )}
          {hasTime(recipe.cookTime) && (
            <span className={classes.infoItem}>
              <Clock className={classes.infoIcon} size={16} />
              {language === "he" || language === "mixed"
                ? "בישול"
                : "Cook"}{" "}
              {formatTime(recipe.cookTime, t("recipes", "minutes"))}
            </span>
          )}
        </div>
      )}

      {recipe.categories && recipe.categories.length > 0 && (
        <div className={classes.categoryTags}>
          {recipe.categories
            .filter((cat) => getCategoryName(cat))
            .map((cat, idx) => (
              <button
                key={idx}
                type="button"
                className={classes.categoryTag}
                onClick={() => onCategoryClick && onCategoryClick(cat)}
              >
                {getCategoryName(cat)}
              </button>
            ))}
        </div>
      )}

      {recipe.author && (
        <div className={classes.authorSection}>
          <span className={classes.authorLabel}>
            {t("recipeDetails", "recipeBy")}:
          </span>
          <span className={classes.authorName}>{recipe.author}</span>
        </div>
      )}

      <div className={classes.servingSelector}>
        <div className={classes.servingControls}>
          <AddButton
            type="circle"
            sign="+"
            className={classes.servingButton}
            onClick={() => setServings(servings + 1)}
          />
          <span>{servings}</span>
          <AddButton
            type="circle"
            sign="-"
            className={classes.servingButton}
            onClick={() => setServings(Math.max(1, servings - 1))}
          />
        </div>
        <span className={classes.servingLabel}>
          <Users className={classes.servingLabelIcon} size={16} />
          {t("recipes", "servings")} ({servings})
        </span>
      </div>

      {recipe.nutrition &&
        Object.entries(recipe.nutrition).some(
          ([k, v]) => v && k !== "note",
        ) && (
          <div className={classes.nutritionSection}>
            <button
              className={classes.nutritionToggle}
              onClick={() => setShowNutrition(!showNutrition)}
              title={t("recipeDetails", "nutritionTitle")}
            >
              <div className={classes.nutritionTitleWrapper}>
                <Apple className={classes.nutritionIcon} size={16} />
                <span>{t("recipes", "nutrition")}</span>
              </div>
              <span className={classes.expandIcon}>
                {showNutrition ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </span>
            </button>
            {showNutrition && (
              <div className={classes.nutritionContent}>
                <p className={classes.nutritionTitle}>
                  למנה אחת של {recipe.name} (מתוך {servings} מנות
                  {recipe.nutrition.note ? `, ${recipe.nutrition.note}` : ""}
                  ):
                </p>
                <ul className={classes.nutritionList}>
                  {recipe.nutrition.calories && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Flame size={16} />
                      </span>{" "}
                      {t("recipes", "calories")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.calories)} kcal
                      </span>
                    </li>
                  )}
                  {recipe.nutrition.protein && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Drumstick size={16} />
                      </span>{" "}
                      {t("recipes", "protein")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.protein)} g
                      </span>
                    </li>
                  )}
                  {recipe.nutrition.fat && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Droplet size={16} />
                      </span>{" "}
                      {t("recipes", "fat")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.fat)} g
                      </span>
                    </li>
                  )}
                  {recipe.nutrition.carbs && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Wheat size={16} />
                      </span>{" "}
                      {t("recipes", "carbs")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.carbs)} g
                      </span>
                    </li>
                  )}
                  {recipe.nutrition.sugars && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Candy size={16} />
                      </span>{" "}
                      {t("recipes", "sugars")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.sugars)} g
                      </span>{" "}
                      ({(parseFloat(recipe.nutrition.sugars) / 4).toFixed(1)}{" "}
                      {t("recipes", "teaspoons")})
                    </li>
                  )}
                  {recipe.nutrition.fiber && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Leaf size={16} />
                      </span>{" "}
                      {t("recipes", "fiber")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.fiber)} g
                      </span>
                    </li>
                  )}
                  {recipe.nutrition.saturatedFat && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Droplets size={16} />
                      </span>{" "}
                      {t("recipes", "saturatedFat")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.saturatedFat)} g
                      </span>
                    </li>
                  )}
                  {recipe.nutrition.cholesterol && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Pill size={16} />
                      </span>{" "}
                      {t("recipes", "cholesterol")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.cholesterol)} mg
                      </span>
                    </li>
                  )}
                  {recipe.nutrition.sodium && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Sparkles size={16} />
                      </span>{" "}
                      {t("recipes", "sodium")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.sodium)} mg
                      </span>
                    </li>
                  )}
                  {recipe.nutrition.calcium && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Bone size={16} />
                      </span>{" "}
                      {t("recipes", "calcium")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.calcium)} mg
                      </span>
                    </li>
                  )}
                  {recipe.nutrition.iron && (
                    <li>
                      <span className={classes.nutritionEmoji}>
                        <Atom size={16} />
                      </span>{" "}
                      {t("recipes", "iron")}:{" "}
                      <span className={classes.nutritionValue}>
                        {scaleNutrition(recipe.nutrition.iron)} mg
                      </span>
                    </li>
                  )}
                </ul>
                <p className={classes.nutritionDisclaimer}>
                  <Info size={14} className={classes.disclaimerIcon} />
                  {t("recipeDetails", "nutritionDisclaimer")}
                </p>
              </div>
            )}
          </div>
        )}
    </>
  );
}
