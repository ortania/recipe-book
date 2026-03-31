import React from "react";
import { X, GripVertical } from "lucide-react";
import { useEditRecipe } from "../EditRecipeContext";

export default function InstructionsTab() {
  const {
    editedRecipe,
    setEditedRecipe,
    dragIndex,
    dragField,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleInstructionChange,
    addInstruction,
    removeInstruction,
    handleTouchStart,
    handleLongPressStart,
    instructionsListRef,
    classes,
    shared,
    t,
  } = useEditRecipe();

  return (
    <>
      <h3 className={classes.sectionTitle}>{t("recipes", "instructions")}</h3>
      <div className={shared.dynamicList} ref={instructionsListRef}>
        {editedRecipe.instructions.map((inst, i) => (
          <div
            key={i}
            data-drag-item
            className={`${classes.dynamicItem} ${dragIndex === i && dragField === "instructions" ? classes.dragging : ""} ${dragOverIndex === i && dragIndex !== null && dragField === "instructions" && dragIndex !== i ? (dragIndex > i ? `${shared.dragOverAbove} ${classes.dragOverAbove}` : `${shared.dragOverBelow} ${classes.dragOverBelow}`) : ""}`}
            draggable
            onDragStart={(e) => handleDragStart(e, i, "instructions")}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i, "instructions")}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) =>
              handleLongPressStart(e, i, "instructions", instructionsListRef)
            }
          >
            <span
              className={`${shared.dragHandle} ${classes.dragHandle}`}
              onTouchStart={(e) =>
                handleTouchStart(e, i, "instructions", instructionsListRef)
              }
            >
              <GripVertical size={16} />
            </span>
            <div className={`${shared.instructionBox} ${classes.instructionBox}`}>
              {editedRecipe.instructions.length > 1 && (
                <button
                  type="button"
                  className={`${shared.instructionRemoveBtn} ${classes.instructionRemoveBtn}`}
                  onClick={() => removeInstruction(i)}
                >
                  <X />
                </button>
              )}
              <div className={`${shared.instructionContent} ${classes.instructionContent}`}>
                <span className={`${shared.dynamicItemNumber} ${classes.dynamicItemNumber}`}>{i + 1}.</span>
                <textarea
                  className={`${shared.dynamicItemTextarea} ${classes.dynamicItemTextarea}`}
                  placeholder={`${t("addWizard", "step")} ${i + 1}...`}
                  value={inst}
                  onChange={(e) => handleInstructionChange(i, e.target.value)}
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
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className={`${shared.addDashedBtn} ${shared.addItemBtn} ${classes.addItemBtn}`}
          onClick={addInstruction}
        >
          + {t("addWizard", "addStep")}
        </button>
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("recipes", "videoUrl")}
        </label>
        <input
          type="url"
          className={shared.formInput}
          placeholder="https://youtube.com/..."
          value={editedRecipe.videoUrl}
          onChange={(e) =>
            setEditedRecipe((prev) => ({
              ...prev,
              videoUrl: e.target.value,
            }))
          }
        />
      </div>
    </>
  );
}
