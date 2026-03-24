import React from "react";
import { X, Camera, Upload, Loader2, Sparkles, Plus, Check } from "lucide-react";
import { useWizard } from "../WizardContext";

export default function ImageCategoriesStep() {
  const {
    recipe,
    uploadingImage,
    generatingAiImage,
    imageDragOver,
    setImageDragOver,
    handleImageUpload,
    handleRemoveImage,
    handleImageDrop,
    handleGenerateAiImage,
    preventDragDefault,
    toggleCategory,
    newCategoryName,
    setNewCategoryName,
    showNewCategoryInput,
    setShowNewCategoryInput,
    handleAddNewCategory,
    importError,
    fileInputRef,
    cameraInputRef,
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

        {recipe.images?.length > 0 ? (
          <>
            <div
              className={`${shared.imageGrid} ${imageDragOver ? shared.dropActive : ""}`}
              onDragOver={(e) => {
                preventDragDefault(e);
                setImageDragOver(true);
              }}
              onDragLeave={() => setImageDragOver(false)}
              onDrop={handleImageDrop}
            >
              {recipe.images.map((url, i) => (
                <div key={i} className={shared.imageGridItem}>
                  <img
                    src={url}
                    alt={`${i + 1}`}
                    className={shared.imageGridPreview}
                  />
                  <button
                    type="button"
                    className={classes.imageRemoveBtn}
                    onClick={() => handleRemoveImage(i)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className={classes.addMoreImages}>
              {isMobileDevice && (
                <div
                  className={classes.addItemBtn}
                  style={{ position: "relative", overflow: "hidden" }}
                >
                  <input
                    type="file"
                    accept="image/*,.jfif"
                    capture="environment"
                    ref={cameraInputRef}
                    onChange={handleImageUpload}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                  />
                  <Camera size={16} /> {t("addWizard", "takePhoto")}
                </div>
              )}
              <div
                className={classes.addItemBtn}
                style={{ position: "relative", overflow: "hidden" }}
              >
                <input
                  type="file"
                  accept="image/*,.jfif"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                />
                <Plus size={16} /> {t("addWizard", "addMoreImages")}
              </div>
              <button
                type="button"
                className={classes.generateAiImageBtn}
                onClick={handleGenerateAiImage}
                disabled={uploadingImage || generatingAiImage}
              >
                {generatingAiImage ? (
                  <Loader2 size={16} className={classes.spinning} />
                ) : (
                  <Sparkles size={16} />
                )}
                {generatingAiImage
                  ? t("addWizard", "generatingAiImage")
                  : t("addWizard", "generateAiImage")}
              </button>
            </div>
          </>
        ) : (
          <div
            className={`${classes.imageUploadButtons} ${imageDragOver ? shared.dropActive : ""}`}
            onDragOver={(e) => {
              preventDragDefault(e);
              setImageDragOver(true);
            }}
            onDragLeave={() => setImageDragOver(false)}
            onDrop={handleImageDrop}
          >
            {isMobileDevice && (
              <div
                className={classes.imageOptionBtn}
                style={{ position: "relative", overflow: "hidden" }}
              >
                <input
                  type="file"
                  accept="image/*,.jfif"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handleImageUpload}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                />
                <Camera className={classes.imageOptionIcon} />
                <span>{t("addWizard", "takePhoto")}</span>
              </div>
            )}
            <div
              className={classes.imageOptionBtn}
              style={{ position: "relative", overflow: "hidden" }}
            >
              <input
                type="file"
                accept="image/*,.jfif"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  zIndex: 2,
                }}
              />
              <Upload className={classes.imageOptionIcon} />
              <span>{t("addWizard", "fromFile")}</span>
            </div>
            <button
              type="button"
              className={classes.generateAiImageBtn}
              onClick={handleGenerateAiImage}
              disabled={uploadingImage || generatingAiImage}
            >
              {generatingAiImage ? (
                <Loader2 size={16} className={classes.spinning} />
              ) : (
                <Sparkles size={16} />
              )}
              {generatingAiImage
                ? t("addWizard", "generatingAiImage")
                : t("addWizard", "generateAiImage")}
            </button>
            <p className={classes.imageHint}>
              {t("addWizard", "multipleImagesHint")}
            </p>
          </div>
        )}

        {(uploadingImage || generatingAiImage) && (
          <p className={classes.imageHint}>
            {uploadingImage
              ? t("recipes", "uploading")
              : t("addWizard", "generatingAiImage")}
          </p>
        )}
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
