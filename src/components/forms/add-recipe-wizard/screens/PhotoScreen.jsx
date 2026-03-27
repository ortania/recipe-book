import React from "react";
import { ChevronRight, Camera } from "lucide-react";
import { CloseButton } from "../../../controls";
import { useWizard } from "../WizardContext";
import RecipeImageUpload from "../../RecipeImageUpload";

export default function PhotoScreen() {
  const {
    setScreen,
    setImportError,
    handleClose,
    isImporting,
    importError,
    photoDragOver,
    setPhotoDragOver,
    handleImportFromPhoto,
    handlePhotoDrop,
    handlePastePhotoImage,
    handleGenerateAiImage,
    generatingAiImage,
    photoFileInputRef,
    isMobileDevice,
    classes,
    t,
  } = useWizard();

  return (
    <div className={classes.wizardContainer}>
      <div className={classes.screenTopBar}>
        <button
          type="button"
          className={classes.backLink}
          onClick={() => {
            setScreen("method");
            setImportError("");
          }}
        >
          <ChevronRight /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton onClick={handleClose} size={25} />
      </div>

      <h2 className={classes.screenTitle}>
        {t("addWizard", "fromPhotoTitle")}
      </h2>
      <p className={classes.screenSubtitle}>
        {t("addWizard", "fromPhotoSubtitle")}
      </p>

      {isImporting ? (
        <div className={classes.photoUploadArea}>
          <Camera className={classes.photoUploadIcon} />
          <span className={classes.photoUploadText}>
            {t("addWizard", "analyzingPhoto")}
          </span>
          <p className={classes.aiProcessingHint}>
            {t("addWizard", "aiProcessingHint")}
          </p>
        </div>
      ) : (
        <RecipeImageUpload
          images={[]}
          uploadingImage={false}
          generatingAiImage={generatingAiImage}
          isDragOver={photoDragOver}
          setIsDragOver={setPhotoDragOver}
          onImageUpload={handleImportFromPhoto}
          onRemoveImage={() => {}}
          onDrop={handlePhotoDrop}
          onPasteImage={handlePastePhotoImage}
          onGenerateAiImage={handleGenerateAiImage}
          fileInputRef={photoFileInputRef}
          isMobile={isMobileDevice}
          t={t}
        />
      )}

      <div className={`${classes.tipBox} ${classes.tipBoxGreen}`}>
        <span className={classes.tipIcon}>
          <Camera size={16} />
        </span>
        <span>
          <span className={classes.tipBold}>{t("addWizard", "tip")}:</span>{" "}
          {t("addWizard", "photoTip")}
        </span>
      </div>

      {importError && <p className={classes.errorText}>{importError}</p>}
    </div>
  );
}
