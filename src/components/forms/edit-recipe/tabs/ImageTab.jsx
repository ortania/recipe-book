import React, { useRef } from "react";
import { X, Camera, Plus, Upload, Loader, Sparkles, Clipboard } from "lucide-react";
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

const hiddenPasteStyle = {
  position: "fixed",
  top: -9999,
  left: -9999,
  width: 1,
  height: 1,
  overflow: "hidden",
  opacity: 0,
};

export default function ImageTab() {
  const {
    editedRecipe,
    uploadingImage,
    generatingAiImage,
    isMobile,
    editImageDragOver,
    setEditImageDragOver,
    handleImageUpload,
    handleRemoveImage,
    handleEditImageDrop,
    handleGenerateAiImage,
    handlePasteImage,
    fileInputRef,
    classes,
    shared,
    t,
  } = useEditRecipe();

  const pasteAreaRef = useRef(null);

  const handlePasteFromArea = (e) => {
    const imageItem = Array.from(e.clipboardData?.items || []).find((item) =>
      item.type.startsWith("image/"),
    );
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) handlePasteImage(file);
  };

  const actionButtons = (
    <div className={classes.imageActionRow}>
      <div
        className={classes.imageActionBtn}
        style={{ position: "relative", overflow: "hidden" }}
      >
        <input
          type="file"
          accept="image/*,.jfif"
          {...(!isMobile && { multiple: true })}
          ref={fileInputRef}
          onChange={handleImageUpload}
          style={fileOverlayStyle}
        />
        <Plus size={16} />{" "}
        {isMobile
          ? t("addWizard", "addImage")
          : t("addWizard", "addMoreImages")}
      </div>
      <button
        type="button"
        className={classes.imageActionBtn}
        onClick={() => pasteAreaRef.current?.focus()}
        disabled={uploadingImage || generatingAiImage}
      >
        <Clipboard size={16} /> {t("addWizard", "pasteImage")}
      </button>
      <button
        type="button"
        className={classes.imageActionBtn}
        onClick={handleGenerateAiImage}
        disabled={uploadingImage || generatingAiImage}
      >
        {generatingAiImage ? (
          <Loader size={16} className={classes.spinIcon} />
        ) : (
          <Sparkles size={16} />
        )}
        {generatingAiImage
          ? t("addWizard", "generatingAiImage")
          : t("addWizard", "generateAiImage")}
      </button>
    </div>
  );

  return (
    <>
      <h3 className={classes.sectionTitle}>{t("addWizard", "recipeImage")}</h3>

      <div
        ref={pasteAreaRef}
        contentEditable
        suppressContentEditableWarning
        onPaste={handlePasteFromArea}
        style={hiddenPasteStyle}
        tabIndex={0}
        aria-hidden
      />

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
          {actionButtons}
        </>
      ) : (
        <>
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
              {...(!isMobile && { multiple: true })}
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
          {actionButtons}
        </>
      )}
    </>
  );
}
