import React from "react";
import { useEditRecipe } from "../EditRecipeContext";
import RecipeImageUpload from "../../RecipeImageUpload";

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
    t,
  } = useEditRecipe();

  return (
    <>
      <h3 className={classes.sectionTitle}>{t("addWizard", "recipeImage")}</h3>
      <RecipeImageUpload
        images={editedRecipe.images || []}
        uploadingImage={uploadingImage}
        generatingAiImage={generatingAiImage}
        isDragOver={editImageDragOver}
        setIsDragOver={setEditImageDragOver}
        onImageUpload={handleImageUpload}
        onRemoveImage={handleRemoveImage}
        onDrop={handleEditImageDrop}
        onPasteImage={handlePasteImage}
        onGenerateAiImage={handleGenerateAiImage}
        fileInputRef={fileInputRef}
        isMobile={isMobile}
        t={t}
      />
    </>
  );
}
