import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classes from "./recipe-details-full.module.css";
import { formatDifficulty, formatTime } from "./utils";
import { useLanguage } from "../../context";
import { FaRegEdit } from "react-icons/fa";
import { BsTrash3, BsThreeDotsVertical } from "react-icons/bs";
import {
  MdExpandMore,
  MdExpandLess,
  MdOutlineFormatListBulleted,
  MdOutlineFormatListNumbered,
  MdOutlineTipsAndUpdates,
  MdOutlineChat,
} from "react-icons/md";
import { GiMeal } from "react-icons/gi";
import { FaNutritionix } from "react-icons/fa";
import {
  IoCopyOutline,
  IoShareSocialOutline,
  IoTimeOutline,
  IoPrintOutline,
  IoStarOutline,
  IoStar,
  IoChevronBackOutline,
} from "react-icons/io5";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";
import { TbChefHat, TbUsers } from "react-icons/tb";
import { ConfirmDialog } from "../forms/confirm-dialog";
import { CopyRecipeDialog } from "../forms/copy-recipe-dialog";
import { CloseButton } from "../controls/close-button";
import { AddButton } from "../controls/add-button";
import { ExportImageButton } from "./export-image-button";
import { RecipeChat } from "./recipe-chat";
import { ChatHelpButton } from "../controls/chat-help-button";

function RecipeDetailsFull({
  recipe,
  originalRecipe,
  isTranslating,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onSaveRecipe,
  getCategoryName,
  onEnterCookingMode,
  onCopyRecipe,
  currentUserId,
  onToggleFavorite,
}) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  // State management
  const [activeTab, setActiveTab] = useState("ingredients");
  const touchRef = useRef({ startX: 0, startY: 0 });

  const tabOrder = useMemo(() => {
    const tabs = ["ingredients", "instructions"];
    if (recipe.notes) tabs.push("tips");
    tabs.push("chat");
    return tabs;
  }, [recipe.notes]);

  const handleTabSwipe = (e) => {
    const diffX = e.changedTouches[0].clientX - touchRef.current.startX;
    const diffY = Math.abs(
      e.changedTouches[0].clientY - touchRef.current.startY,
    );
    if (diffY > Math.abs(diffX) || Math.abs(diffX) < 50) return;
    const isRTL = document.documentElement.dir === "rtl";
    const direction = isRTL ? -diffX : diffX;
    const currentIndex = tabOrder.indexOf(activeTab);
    if (direction < 0 && currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    } else if (direction > 0 && currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };
  const [servings, setServings] = useState(recipe.servings || 4);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [checkedInstructions, setCheckedInstructions] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatAppliedFields, setChatAppliedFields] = useState({});
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCookingHelp, setShowCookingHelp] = useState(false);

  const cookingHelpItems = [
    t("cookingMode", "helpGuideFeature1"),
    t("cookingMode", "helpGuideFeature2"),
    t("cookingMode", "helpGuideFeature3"),
  ];
  const moreMenuRef = useRef(null);

  const handleCopyClick = () => {
    setShowCopyDialog(true);
  };

  useEffect(() => {
    setServings(recipe.servings || 4);
  }, [recipe.servings]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: recipe.name,
      text: `${recipe.name}\n\n${t("recipes", "ingredients")}:\n${(recipe.ingredients || []).join("\n")}\n\n${t("recipes", "instructions")}:\n${(recipe.instructions || []).join("\n")}`,
    };
    if (recipe.sourceUrl) {
      shareData.url = recipe.sourceUrl;
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  const originalServings = recipe.servings || 4;

  // Parse ingredients and instructions
  const ingredientsArray = useMemo(() => {
    return Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : recipe.ingredients
          ?.split(",")
          .map((item) => item.trim())
          .filter((item) => item) || [];
  }, [recipe.ingredients]);

  const instructionsArray = useMemo(() => {
    return Array.isArray(recipe.instructions)
      ? recipe.instructions
      : recipe.instructions
          ?.split(".")
          .map((item) => item.trim())
          .filter((item) => item && item.length > 10) || [];
  }, [recipe.instructions]);

  // Toggle functions
  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleInstruction = (index) => {
    setCheckedInstructions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Scale ingredient based on servings
  const scaleIngredient = (ingredient) => {
    if (servings === originalServings) return ingredient;

    const ratio = servings / originalServings;
    const numberRegex = /(\d+\.?\d*|\d*\.\d+|\d+\/\d+)/g;

    return ingredient.replace(numberRegex, (match) => {
      if (match.includes("/")) {
        const [num, denom] = match.split("/").map(Number);
        const scaled = (num / denom) * ratio;
        if (scaled === 0.5) return "1/2";
        if (scaled === 0.25) return "1/4";
        if (scaled === 0.75) return "3/4";
        if (scaled === 0.33 || scaled === 0.34) return "1/3";
        if (scaled === 0.67 || scaled === 0.66) return "2/3";
        return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
      }

      const num = parseFloat(match);
      const scaled = num * ratio;
      return scaled % 1 === 0
        ? scaled.toString()
        : scaled.toFixed(1).replace(/\.0$/, "");
    });
  };

  const scaleNutrition = (value) => value;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      navigate("/categories", { replace: true });
      await onDelete(recipe.id);
    }
  };

  return (
    <div className={classes.recipeCard}>
      {showCopyDialog && (
        <CopyRecipeDialog
          recipeName={recipe.name}
          currentUserId={currentUserId}
          onCopy={(targetUserId) => onCopyRecipe(recipe, targetUserId)}
          onCancel={() => setShowCopyDialog(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title={t("confirm", "deleteRecipe")}
          message={`${t("confirm", "deleteRecipeMsg")} "${recipe.name}"? ${t("confirm", "cannotUndo")}.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText={t("confirm", "yesDelete")}
          cancelText={t("common", "cancel")}
        />
      )}

      <div className={classes.stickyHeader}>
        <div className={classes.cookingBtnWrapper}>
          <button
            className={`${classes.headerCookingBtn} ${showCookingHelp ? classes.cookingModeBtnHighlight : ""}`}
            onClick={onEnterCookingMode}
            title={t("recipes", "cookingMode")}
          >
            <TbChefHat />
            <span>
              {language === "he" || language === "mixed" ? "בישול" : "Cook"}
            </span>
          </button>
          {showCookingHelp && <div className={classes.cookingArrow} />}
        </div>
        <h2 className={classes.headerTitle}>{recipe.name}</h2>
        <button
          onClick={onClose}
          className={classes.backButton}
          title={t("common", "back")}
        >
          <IoChevronBackOutline />
        </button>
      </div>
      <div className={classes.imageContainer}>
        {recipe.image_src && (
          <img
            src={recipe.image_src}
            alt={recipe.name}
            className={classes.recipeImage}
            loading="lazy"
          />
        )}
      </div>

      <div className={classes.actionBar}>
        <div className={classes.actionBarStart}>
          <div className={classes.moreMenuWrapper} ref={moreMenuRef}>
            <button
              className={classes.actionIcon}
              onClick={() => setShowMoreMenu((prev) => !prev)}
              title={t("common", "more")}
            >
              <BsThreeDotsVertical size={20} />
            </button>
            {showMoreMenu && (
              <div className={classes.moreMenu}>
                {onDelete && (
                  <button
                    className={classes.moreMenuItem}
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleDeleteClick();
                    }}
                  >
                    <span className={classes.moreMenuLabel}>
                      {t("recipes", "delete")}
                    </span>
                    <span className={classes.moreMenuIcon}>
                      <BsTrash3 />
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
                      <HiOutlineDocumentDuplicate />
                    </span>
                  </button>
                )}
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
                    <IoCopyOutline />
                  </span>
                </button>
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
                    <IoPrintOutline />
                  </span>
                </button>
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
                <IoStar size={22} />
              ) : (
                <IoStarOutline size={22} />
              )}
            </button>
          )}

          <button
            className={classes.actionIcon}
            onClick={handleShare}
            title={t("recipes", "share")}
          >
            <IoShareSocialOutline size={20} />
          </button>

          <ChatHelpButton
            title={t("cookingMode", "helpGuideTitle")}
            items={cookingHelpItems}
            onToggle={setShowCookingHelp}
          />
        </div>

        {onEdit && (
          <button className={classes.editBtn} onClick={() => onEdit(recipe)}>
            <FaRegEdit size={16} />
            <span>{t("recipes", "edit")}</span>
          </button>
        )}
      </div>

      <div className={classes.recipeContent}>
        {recipe.rating > 0 && (
          <div className={classes.rating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                style={{
                  color: star <= recipe.rating ? "#ffc107" : "#e0e0e0",
                  fontSize: "1.5rem",
                }}
              >
                ★
              </span>
            ))}
          </div>
        )}

        <div className={classes.recipeInfo}>
          {recipe.difficulty && recipe.difficulty !== "Unknown" && (
            <span className={classes.infoItem}>
              <TbChefHat className={classes.infoIcon} />
              {t("difficulty", recipe.difficulty)}
            </span>
          )}
          {recipe.difficulty &&
            recipe.difficulty !== "Unknown" &&
            recipe.prepTime && <span className={classes.infoDot}>•</span>}
          {recipe.prepTime && (
            <span className={classes.infoItem}>
              <IoTimeOutline className={classes.infoIcon} />
              {language === "he" || language === "mixed" ? "הכנה" : "Prep"}{" "}
              {formatTime(recipe.prepTime, t("recipes", "minutes"))}
            </span>
          )}
          {recipe.cookTime && recipe.prepTime && (
            <span className={classes.infoDot}>•</span>
          )}
          {recipe.cookTime &&
            !recipe.prepTime &&
            recipe.difficulty &&
            recipe.difficulty !== "Unknown" && (
              <span className={classes.infoDot}>•</span>
            )}
          {recipe.cookTime && (
            <span className={classes.infoItem}>
              <IoTimeOutline className={classes.infoIcon} />
              {language === "he" || language === "mixed"
                ? "בישול"
                : "Cook"}{" "}
              {formatTime(recipe.cookTime, t("recipes", "minutes"))}
            </span>
          )}
        </div>

        {recipe.categories && recipe.categories.length > 0 && (
          <div className={classes.categoryTags}>
            {recipe.categories
              .filter((cat) => getCategoryName(cat))
              .map((cat, idx) => (
                <span key={idx} className={classes.categoryTag}>
                  {getCategoryName(cat)}
                </span>
              ))}
          </div>
        )}

        {recipe.sourceUrl && (
          <div className={classes.sourceUrl}>
            <span className={classes.sourceLabel}>
              {t("recipes", "sourceUrl")}:
            </span>
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.sourceLink}
            >
              {recipe.sourceUrl}
            </a>
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
            <TbUsers className={classes.servingLabelIcon} />
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
                  <FaNutritionix className={classes.nutritionIcon} />
                  <span>{t("recipes", "nutrition")}</span>
                </div>
                <span className={classes.expandIcon}>
                  {showNutrition ? <MdExpandLess /> : <MdExpandMore />}
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
                        <span className={classes.nutritionEmoji}>🔥</span>{" "}
                        {t("recipes", "calories")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.calories)} kcal
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.protein && (
                      <li>
                        <span className={classes.nutritionEmoji}>🍗</span>{" "}
                        {t("recipes", "protein")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.protein)} g
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.fat && (
                      <li>
                        <span className={classes.nutritionEmoji}>🥑</span>{" "}
                        {t("recipes", "fat")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.fat)} g
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.carbs && (
                      <li>
                        <span className={classes.nutritionEmoji}>🍞</span>{" "}
                        {t("recipes", "carbs")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.carbs)} g
                        </span>
                      </li>
                    )}
                    {recipe.nutrition.sugars && (
                      <li>
                        <span className={classes.nutritionEmoji}>🍬</span>{" "}
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
                        <span className={classes.nutritionEmoji}>🥬</span>{" "}
                        {t("recipes", "fiber")}:{" "}
                        <span className={classes.nutritionValue}>
                          {scaleNutrition(recipe.nutrition.fiber)} g
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

        <div className={classes.tabs}>
          <button
            className={`${classes.tab} ${activeTab === "ingredients" ? classes.activeTab : ""}`}
            onClick={() => setActiveTab("ingredients")}
          >
            <MdOutlineFormatListBulleted className={classes.tabIcon} />
            {t("recipes", "ingredients")}
          </button>
          <button
            className={`${classes.tab} ${activeTab === "instructions" ? classes.activeTab : ""}`}
            onClick={() => setActiveTab("instructions")}
          >
            <MdOutlineFormatListNumbered className={classes.tabIcon} />
            {t("recipes", "instructions")}
          </button>
          {recipe.notes && (
            <button
              className={`${classes.tab} ${activeTab === "tips" ? classes.activeTab : ""}`}
              onClick={() => setActiveTab("tips")}
            >
              <MdOutlineTipsAndUpdates className={classes.tabIcon} />
              {t("recipes", "notes")}
            </button>
          )}
          <button
            className={`${classes.tab} ${activeTab === "chat" ? classes.activeTab : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <MdOutlineChat className={classes.tabIcon} />
            {t("recipeChat", "tabLabel")}
          </button>
        </div>

        <div
          className={classes.tabContent}
          onTouchStart={(e) => {
            touchRef.current.startX = e.touches[0].clientX;
            touchRef.current.startY = e.touches[0].clientY;
          }}
          onTouchEnd={handleTabSwipe}
        >
          {activeTab === "ingredients" && (
            <ul className={classes.ingredientsList}>
              {ingredientsArray.length > 0 ? (
                ingredientsArray.map((ingredient, index) => (
                  <li key={index} className={classes.ingredientItem}>
                    <label className={classes.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={checkedIngredients[index] || false}
                        onChange={() => toggleIngredient(index)}
                        className={classes.checkbox}
                      />
                      <span
                        className={
                          checkedIngredients[index] ? classes.checkedText : ""
                        }
                      >
                        {scaleIngredient(ingredient)}
                      </span>
                    </label>
                  </li>
                ))
              ) : (
                <p>{t("recipes", "noIngredientsListed")}</p>
              )}
            </ul>
          )}

          {activeTab === "instructions" && (
            <ol className={classes.instructionsList}>
              {instructionsArray.length > 0 ? (
                instructionsArray.map((instruction, index) => (
                  <li key={index} className={classes.instructionItem}>
                    <label className={classes.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={checkedInstructions[index] || false}
                        onChange={() => toggleInstruction(index)}
                        className={classes.checkbox}
                      />
                      <span
                        className={
                          checkedInstructions[index] ? classes.checkedText : ""
                        }
                      >
                        {instruction}
                      </span>
                    </label>
                  </li>
                ))
              ) : (
                <p>{t("recipes", "noInstructionsListed")}</p>
              )}
            </ol>
          )}

          {activeTab === "tips" && recipe.notes && (
            <div className={classes.notesContent}>
              <p className={classes.notesText}>{recipe.notes}</p>
            </div>
          )}

          {activeTab === "chat" && (
            <RecipeChat
              recipe={recipe}
              servings={servings}
              messages={chatMessages}
              onMessagesChange={setChatMessages}
              appliedFields={chatAppliedFields}
              onAppliedFieldsChange={setChatAppliedFields}
              onUpdateRecipe={
                onSaveRecipe
                  ? (changes) => {
                      const base = originalRecipe || recipe;
                      const updated = { ...base, ...changes };
                      onSaveRecipe(updated);
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeDetailsFull;
