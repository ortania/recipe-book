import React from "react";
import { Plus, Check, X } from "lucide-react";
import { useWizard } from "../WizardContext";
import RecipeImageUpload from "../../RecipeImageUpload";

export default function ImageCategoriesStep() {
  const {
    recipe,
    uploadingImage,
    generatingAiImage,
    imageDragOver,
    setImageDragOver,
    handleImageUpload,
    handleRemoveImage,
    handleReorderImages,
    handleImageDrop,
    handlePasteImage,
    handleGenerateAiImage,
    toggleCategory,
    newCategoryName,
    setNewCategoryName,
    showNewCategoryInput,
    setShowNewCategoryInput,
    handleAddNewCategory,
    importError,
    fileInputRef,
    isMobileDevice,
    groups,
    getTranslatedGroup,
    classes,
    shared,
    catShared,
    t,
  } = useWizard();

  return (
    <div className={classes.stepContent}>
      <h3 className={classes.stepSectionTitle}>
        {t("addWizard", "imageCategories")}
      </h3>

      {/* Image upload */}
      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("addWizard", "recipeImage")}
        </label>

        <RecipeImageUpload
          images={recipe.images || []}
          uploadingImage={uploadingImage}
          generatingAiImage={generatingAiImage}
          isDragOver={imageDragOver}
          setIsDragOver={setImageDragOver}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          onReorderImages={handleReorderImages}
          onDrop={handleImageDrop}
          onPasteImage={handlePasteImage}
          onGenerateAiImage={handleGenerateAiImage}
          fileInputRef={fileInputRef}
          isMobile={isMobileDevice}
          t={t}
        />

        {importError && <p className={classes.errorText}>{importError}</p>}
      </div>

      {/* Categories */}
      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("addWizard", "categories")}
        </label>
        <div className={catShared.categoryChips}>
          {groups
            .filter((g) => g.id !== "all")
            .map((group) => (
              <button
                key={group.id}
                type="button"
                className={`${catShared.categoryChip} ${
                  recipe.categories.includes(group.id)
                    ? catShared.categoryChipActive
                    : ""
                }`}
                onClick={() => toggleCategory(group.id)}
              >
                {getTranslatedGroup(group)}
              </button>
            ))}
          {showNewCategoryInput ? (
            <div className={catShared.newCategoryInline}>
              <input
                type="text"
                className={catShared.newCategoryInput}
                placeholder={t("categories", "categoryName")}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewCategory();
                  }
                  if (e.key === "Escape") {
                    setShowNewCategoryInput(false);
                    setNewCategoryName("");
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                className={catShared.newCategoryConfirmBtn}
                onClick={handleAddNewCategory}
                disabled={!newCategoryName.trim()}
              >
                <Check size={18} />
              </button>
              <button
                type="button"
                className={catShared.newCategoryCancelBtn}
                onClick={() => {
                  setShowNewCategoryInput(false);
                  setNewCategoryName("");
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={catShared.addCategoryChip}
              onClick={() => setShowNewCategoryInput(true)}
            >
              <Plus size={14} /> {t("categories", "addCategory")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
