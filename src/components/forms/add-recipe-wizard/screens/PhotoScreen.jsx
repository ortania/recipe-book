import React from "react";
import { ChevronRight, Camera, Upload } from "lucide-react";
import { CloseButton } from "../../../controls";
import { useWizard } from "../WizardContext";

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
    preventDragDefault,
    photoInputRef,
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
        <div
          className={`${classes.imageUploadButtons} ${photoDragOver ? "dropActive" : ""}`}
          onDragOver={(e) => {
            preventDragDefault(e);
            setPhotoDragOver(true);
          }}
          onDragLeave={() => setPhotoDragOver(false)}
          onDrop={handlePhotoDrop}
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
                ref={photoInputRef}
                onChange={handleImportFromPhoto}
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
              ref={photoFileInputRef}
              onChange={handleImportFromPhoto}
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
        </div>
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
