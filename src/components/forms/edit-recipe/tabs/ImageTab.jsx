import React from "react";
import { X, Camera, Plus, Loader, Sparkles } from "lucide-react";
import { useEditRecipe } from "../EditRecipeContext";

const fileOverlayStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  cursor: "pointer",
  zIndex: 2,
};

export default function ImageTab() {
  const {
    editedRecipe,
    uploadingImage,
    generatingAiImage,
    editImageDragOver,
    setEditImageDragOver,
    handleImageUpload,
    handleRemoveImage,
    handleEditImageDrop,
    handleGenerateAiImage,
    fileInputRef,
    classes,
    shared,
    t,
  } = useEditRecipe();

  return (
    <>
      <h3 className={classes.sectionTitle}>{t("addWizard", "recipeImage")}</h3>
      {editedRecipe.images?.length > 0 ? (
        <>
          <div
            className={`${shared.imageGrid}${editImageDragOver ? ` ${shared.dropActive}` : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setEditImageDragOver(true);
            }}
            onDragLeave={() => setEditImageDragOver(false)}
            onDrop={handleEditImageDrop}
          >
            {editedRecipe.images.map((url, i) => (
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
          <div
            className={classes.addImageBtn}
            style={{ position: "relative", overflow: "hidden" }}
          >
            <input
              type="file"
              accept="image/*,.jfif"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={fileOverlayStyle}
            />
            <Plus size={16} /> {t("addWizard", "addMoreImages")}
          </div>
          <div className={classes.generateAiImageWrap}>
            <button
              type="button"
              className={classes.generateAiImageBtn}
              onClick={handleGenerateAiImage}
              disabled={uploadingImage || generatingAiImage}
            >
              {generatingAiImage ? (
                <Loader size={18} className={classes.spinIcon} />
              ) : (
                <Sparkles size={18} />
              )}
              {generatingAiImage
                ? t("addWizard", "generatingAiImage")
                : t("addWizard", "generateAiImage")}
            </button>
          </div>
        </>
      ) : (
        <div className={classes.generateAiImageWrap}>
          <div
            className={`${classes.imageUploadArea} ${editImageDragOver ? shared.dropActive : ""}`}
            style={{ position: "relative", overflow: "hidden" }}
            onDragOver={(e) => {
              e.preventDefault();
              setEditImageDragOver(true);
            }}
            onDragLeave={() => setEditImageDragOver(false)}
            onDrop={handleEditImageDrop}
          >
            <input
              type="file"
              accept="image/*,.jfif"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={fileOverlayStyle}
            />
            <Camera className={classes.imageUploadIcon} />
            <span className={classes.imageUploadText}>
              {uploadingImage || generatingAiImage
                ? uploadingImage
                  ? t("recipes", "uploading")
                  : t("addWizard", "generatingAiImage")
                : t("addWizard", "uploadImage")}
            </span>
          </div>
          <button
            type="button"
            className={classes.generateAiImageBtn}
            onClick={handleGenerateAiImage}
            disabled={uploadingImage || generatingAiImage}
          >
            {generatingAiImage ? (
              <Loader size={18} className={classes.spinIcon} />
            ) : (
              <Sparkles size={18} />
            )}
            {generatingAiImage
              ? t("addWizard", "generatingAiImage")
              : t("addWizard", "generateAiImage")}
          </button>
        </div>
      )}
    </>
  );
}
