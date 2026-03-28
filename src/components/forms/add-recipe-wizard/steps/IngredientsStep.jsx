import React from "react";
import { X, GripVertical, ChevronUp, ChevronDown, HelpCircle } from "lucide-react";
import { useWizard } from "../WizardContext";
import {
  isGroupHeader,
  getGroupName,
  makeGroupHeader,
} from "../../../../utils/ingredientUtils";

export default function IngredientsStep() {
  const {
    recipe,
    dragIndex,
    dragField,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleIngredientChange,
    handleAddIngredient,
    handleAddIngredientGroup,
    handleRemoveIngredient,
    handleTouchStart,
    handleLongPressStart,
    ingredientsListRef,
    parseIngredientsPaste,
    setParseIngredientsPaste,
    parseIngredientsOpen,
    setParseIngredientsOpen,
    parseIngredientsHelpOpen,
    setParseIngredientsHelpOpen,
    applyParsedIngredients,
    classes,
    shared,
    t,
  } = useWizard();

  let ingredientCounter = 0;

  return (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("recipes", "ingredients")}
      </h3>
      <p className={classes.stepSectionSubtitle}>
        {t("addWizard", "ingredientsSubtitle")}
      </p>

      <div className={shared.dynamicList} ref={ingredientsListRef}>
        {recipe.ingredients.map((ing, i) => {
          const isGroup = isGroupHeader(ing);
          if (!isGroup) ingredientCounter++;
          return (
            <div
              key={i}
              data-drag-item
              className={`${isGroup ? shared.groupItem : classes.dynamicItem} ${
                dragIndex === i && dragField === "ingredients"
                  ? classes.dragging
                  : ""
              } ${
                dragOverIndex === i &&
                dragIndex !== null &&
                dragField === "ingredients" &&
                dragIndex !== i
                  ? dragIndex > i
                    ? shared.dragOverAbove
                    : shared.dragOverBelow
                  : ""
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, i, "ingredients")}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i, "ingredients")}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) =>
                handleLongPressStart(e, i, "ingredients", ingredientsListRef)
              }
            >
              <span
                className={shared.dragHandle}
                onTouchStart={(e) =>
                  handleTouchStart(e, i, "ingredients", ingredientsListRef)
                }
              >
                <GripVertical size={16} />
              </span>
              {isGroup ? (
                <div className={shared.groupInputBox}>
                  <input
                    className={shared.groupInput}
                    placeholder={t("addWizard", "groupPlaceholder")}
                    value={getGroupName(ing)}
                    onChange={(e) =>
                      handleIngredientChange(i, makeGroupHeader(e.target.value))
                    }
                  />
                  <button
                    type="button"
                    className={`${shared.removeItemBtn} ${classes.removeItemBtn}`}
                    onClick={() => handleRemoveIngredient(i)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className={shared.inputBox}>
                  <textarea
                    className={`${shared.dynamicItemInput} ${classes.dynamicItemInput}`}
                    placeholder={`${t("addWizard", "ingredient")} ${ingredientCounter}`}
                    value={ing}
                    rows={1}
                    onChange={(e) => handleIngredientChange(i, e.target.value)}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }
                    }}
                  />
                  {recipe.ingredients.length > 1 && (
                    <button
                      type="button"
                      className={`${shared.removeItemBtn} ${classes.removeItemBtn}`}
                      onClick={() => handleRemoveIngredient(i)}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className={shared.addItemRow}>
          <button
            type="button"
            className={shared.addItemBtn}
            onClick={handleAddIngredient}
          >
            + {t("addWizard", "addIngredient")}
          </button>
          <button
            type="button"
            className={shared.addGroupBtn}
            onClick={handleAddIngredientGroup}
          >
            + {t("addWizard", "addGroup")}
          </button>
        </div>

        {/* Parse ingredients box */}
        <div className={classes.parseIngredientsBox}>
          <div
            className={classes.parseIngredientsHeader}
            role="button"
            tabIndex={0}
            onClick={() => setParseIngredientsOpen((o) => !o)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setParseIngredientsOpen((o) => !o);
              }
            }}
            aria-expanded={parseIngredientsOpen}
          >
            <span className={classes.parseIngredientsTitle}>
              {t("addWizard", "parseIngredientsTitle")}
            </span>
            <span className={classes.parseIngredientsHeaderIcons}>
              <button
                type="button"
                className={classes.parseIngredientsHelpBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setParseIngredientsHelpOpen((h) => !h);
                }}
                title={t("addWizard", "parseIngredientsWhenToUse")}
                aria-label={t("addWizard", "parseIngredientsHelpLabel")}
              >
                <HelpCircle size={18} />
              </button>
              {parseIngredientsOpen ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </span>
          </div>

          {parseIngredientsHelpOpen && (
            <div
              className={classes.parseIngredientsHelpPopover}
              role="region"
              aria-label={t("addWizard", "parseIngredientsHelpLabel")}
            >
              <button
                type="button"
                className={classes.parseIngredientsHelpClose}
                onClick={(e) => {
                  e.stopPropagation();
                  setParseIngredientsHelpOpen(false);
                }}
                aria-label={t("common", "close")}
              >
                <X size={18} />
              </button>
              <div className={classes.parseIngredientsHelpBody}>
                {t("addWizard", "parseIngredientsHelpText")
                  .split("\n")
                  .filter(Boolean)
                  .map((line, i) => {
                    const colon = line.indexOf(":");
                    const label = colon >= 0 ? line.slice(0, colon + 1) : "";
                    const rest =
                      colon >= 0 ? line.slice(colon + 1).trim() : line;
                    return (
                      <div
                        key={i}
                        className={classes.parseIngredientsHelpBlock}
                      >
                        {label && (
                          <span className={classes.parseIngredientsHelpLabel}>
                            {label}
                          </span>
                        )}
                        {(rest || !label) && (
                          <span className={classes.parseIngredientsHelpContent}>
                            {rest || line}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {parseIngredientsOpen && (
            <>
              <label className={classes.parseIngredientsExampleLabel}>
                {t("addWizard", "parseIngredientsExampleLabel")}
              </label>
              <textarea
                className={classes.parseIngredientsTextarea}
                placeholder={t("addWizard", "parseIngredientsPlaceholder")}
                value={parseIngredientsPaste}
                onChange={(e) => setParseIngredientsPaste(e.target.value)}
                rows={5}
              />
              <div className={classes.parseIngredientsActions}>
                <button
                  type="button"
                  className={classes.parseIngredientsApplyBtn}
                  onClick={applyParsedIngredients}
                  disabled={!parseIngredientsPaste.trim()}
                >
                  {t("addWizard", "parseIngredientsApply")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
