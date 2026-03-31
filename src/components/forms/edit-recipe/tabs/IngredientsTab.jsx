import React from "react";
import { X, GripVertical } from "lucide-react";
import { useEditRecipe } from "../EditRecipeContext";
import {
  isGroupHeader,
  getGroupName,
  makeGroupHeader,
} from "../../../../utils/ingredientUtils";

export default function IngredientsTab() {
  const {
    editedRecipe,
    dragIndex,
    dragField,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleIngredientChange,
    addIngredient,
    addIngredientGroup,
    removeIngredient,
    handleTouchStart,
    handleLongPressStart,
    ingredientsListRef,
    classes,
    shared,
    t,
  } = useEditRecipe();

  let ingredientCounter = 0;

  return (
    <>
      <h3 className={classes.sectionTitle}>{t("recipes", "ingredients")}</h3>
      <div className={shared.dynamicList} ref={ingredientsListRef}>
        {editedRecipe.ingredients.map((ing, i) => {
          const isGroup = isGroupHeader(ing);
          if (!isGroup) ingredientCounter++;
          return (
            <div
              key={i}
              data-drag-item
              className={`${isGroup ? shared.groupItem : classes.dynamicItem} ${dragIndex === i && dragField === "ingredients" ? classes.dragging : ""} ${dragOverIndex === i && dragIndex !== null && dragField === "ingredients" && dragIndex !== i ? (dragIndex > i ? `${shared.dragOverAbove} ${classes.dragOverAbove}` : `${shared.dragOverBelow} ${classes.dragOverBelow}`) : ""}`}
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
                className={`${shared.dragHandle} ${classes.dragHandle}`}
                onTouchStart={(e) =>
                  handleTouchStart(e, i, "ingredients", ingredientsListRef)
                }
              >
                <GripVertical size={16} />
              </span>
              {isGroup ? (
                <div
                  className={`${shared.groupInputBox} ${classes.groupInputBox}`}
                >
                  <input
                    className={`${shared.groupInput} ${classes.groupInput}`}
                    placeholder={t("addWizard", "groupPlaceholder")}
                    value={getGroupName(ing)}
                    onChange={(e) =>
                      handleIngredientChange(
                        i,
                        makeGroupHeader(e.target.value),
                      )
                    }
                  />
                  <button
                    type="button"
                    className={`${shared.removeItemBtn} ${classes.removeItemBtn}`}
                    onClick={() => removeIngredient(i)}
                  >
                    <X />
                  </button>
                </div>
              ) : (
                <div className={shared.inputBox}>
                  <textarea
                    className={`${shared.dynamicItemInput} ${classes.dynamicItemInput}`}
                    placeholder={`${t("addWizard", "ingredient")} ${ingredientCounter}`}
                    value={ing}
                    rows={1}
                    onChange={(e) =>
                      handleIngredientChange(i, e.target.value)
                    }
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
                  {editedRecipe.ingredients.length > 1 && (
                    <button
                      type="button"
                      className={`${shared.removeItemBtn} ${classes.removeItemBtn}`}
                      onClick={() => removeIngredient(i)}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div className={`${shared.addItemRow} ${classes.addItemRow}`}>
          <button
            type="button"
            className={`${shared.addDashedBtn} ${shared.addItemBtn} ${classes.addItemBtn}`}
            onClick={addIngredient}
          >
            + {t("addWizard", "addIngredient")}
          </button>
          <button
            type="button"
            className={`${shared.addDashedBtn} ${shared.addGroupBtn} ${classes.addGroupBtn}`}
            onClick={addIngredientGroup}
          >
            + {t("addWizard", "addGroup")}
          </button>
        </div>
      </div>
    </>
  );
}
