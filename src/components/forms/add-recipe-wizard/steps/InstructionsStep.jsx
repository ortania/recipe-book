import React from "react";
import { X, GripVertical } from "lucide-react";
import { useWizard } from "../WizardContext";

export default function InstructionsStep() {
  const {
    recipe,
    updateRecipe,
    dragIndex,
    dragField,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleInstructionChange,
    handleAddInstruction,
    handleRemoveInstruction,
    handleTouchStart,
    instructionsListRef,
    classes,
    shared,
    t,
  } = useWizard();

  return (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("recipes", "instructions")}
      </h3>
      <p className={classes.stepSectionSubtitle}>
        {t("addWizard", "instructionsSubtitle")}
      </p>

      <div className={shared.dynamicList} ref={instructionsListRef}>
        {recipe.instructions.map((inst, i) => (
          <div
            key={i}
            data-drag-item
            className={`${classes.dynamicItem} ${
              dragIndex === i && dragField === "instructions"
                ? classes.dragging
                : ""
            } ${
              dragOverIndex === i &&
              dragIndex !== null &&
              dragField === "instructions" &&
              dragIndex !== i
                ? dragIndex > i
                  ? shared.dragOverAbove
                  : shared.dragOverBelow
                : ""
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, i, "instructions")}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i, "instructions")}
            onDragEnd={handleDragEnd}
          >
            <span
              className={shared.dragHandle}
              onTouchStart={(e) =>
                handleTouchStart(e, i, "instructions", instructionsListRef)
              }
            >
              <GripVertical size={16} />
            </span>
            <div
              className={`${shared.instructionBox} ${classes.instructionBox}`}
            >
              {recipe.instructions.length > 1 && (
                <button
                  type="button"
                  className={`${shared.instructionRemoveBtn} ${classes.instructionRemoveBtn}`}
                  onClick={() => handleRemoveInstruction(i)}
                >
                  <X size={16} />
                </button>
              )}
              <div
                className={`${shared.instructionContent} ${classes.instructionContent}`}
              >
                <span
                  className={`${shared.dynamicItemNumber} ${classes.dynamicItemNumber}`}
                >
                  {i + 1}.
                </span>
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
          className={shared.addItemBtn}
          onClick={handleAddInstruction}
        >
          + {t("addWizard", "addStep")}
        </button>
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>{t("addWizard", "videoUrl")}</label>
        <input
          type="url"
          className={shared.formInput}
          placeholder="https://youtube.com/..."
          value={recipe.videoUrl}
          onChange={(e) => updateRecipe("videoUrl", e.target.value)}
        />
      </div>
    </div>
  );
}
