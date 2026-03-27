import React, { useRef } from "react";
import { X, Camera, Upload, Loader2, Sparkles, Clipboard } from "lucide-react";
import imgClasses from "../../styles/shared/image-upload.module.css";
import shared from "../../styles/shared/form-shared.module.css";

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

function ActionCard({ onClick, disabled, style, children }) {
  const Tag = onClick !== undefined && disabled !== undefined ? "button" : "div";
  return (
    <Tag
      {...(Tag === "button" ? { type: "button", disabled } : {})}
      className={imgClasses.imageActionCard}
      style={{ position: "relative", overflow: "hidden", ...style }}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}

export default function RecipeImageUpload({
  images = [],
  uploadingImage,
  generatingAiImage,
  isDragOver,
  setIsDragOver,
  onImageUpload,
  onRemoveImage,
  onDrop,
  onPasteImage,
  onGenerateAiImage,
  fileInputRef,
  isMobile,
  t,
}) {
  const pasteAreaRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handlePasteFromArea = (e) => {
    const imageItem = Array.from(e.clipboardData?.items || []).find((item) =>
      item.type.startsWith("image/"),
    );
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) onPasteImage(file);
  };

  const busy = uploadingImage || generatingAiImage;
  const hasImages = images.length > 0;

  const actionCards = (
    <div className={imgClasses.imageActionRow}>
      {isMobile && (
        <ActionCard>
          <input
            type="file"
            accept="image/*,.jfif"
            capture="environment"
            ref={cameraInputRef}
            onChange={onImageUpload}
            style={fileOverlayStyle}
          />
          <Camera className={imgClasses.imageOptionIcon} />
          <span>{t("addWizard", "takePhoto")}</span>
        </ActionCard>
      )}
      <ActionCard>
        <input
          type="file"
          accept="image/*,.jfif"
          {...(!isMobile && { multiple: true })}
          ref={fileInputRef}
          onChange={onImageUpload}
          style={fileOverlayStyle}
        />
        <Upload className={imgClasses.imageOptionIcon} />
        <span>{t("addWizard", "fromFile")}</span>
      </ActionCard>
      <ActionCard
        onClick={() => pasteAreaRef.current?.focus()}
        style={{ cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1 }}
      >
        <Clipboard className={imgClasses.imageOptionIcon} />
        <span>{t("addWizard", "pasteImage")}</span>
      </ActionCard>
      <ActionCard onClick={onGenerateAiImage} disabled={busy}>
        {generatingAiImage ? (
          <Loader2 className={`${imgClasses.imageOptionIcon} ${imgClasses.spinning}`} />
        ) : (
          <Sparkles className={imgClasses.imageOptionIcon} />
        )}
        <span>
          {generatingAiImage
            ? t("addWizard", "generatingAiImage")
            : t("addWizard", "generateAiImage")}
        </span>
      </ActionCard>
    </div>
  );

  return (
    <>
      <div
        ref={pasteAreaRef}
        contentEditable
        suppressContentEditableWarning
        onPaste={handlePasteFromArea}
        style={hiddenPasteStyle}
        tabIndex={0}
        aria-hidden
      />

      {hasImages && (
        <div
          className={`${shared.imageGrid} ${isDragOver ? shared.dropActive : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
        >
          {images.map((url, i) => (
            <div key={i} className={shared.imageGridItem}>
              <img src={url} alt={`${i + 1}`} className={shared.imageGridPreview} />
              <button
                type="button"
                className={imgClasses.imageRemoveBtn}
                onClick={() => onRemoveImage(i)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={!hasImages ? `${imgClasses.imageUploadButtons} ${isDragOver ? shared.dropActive : ""}` : undefined}
        {...(!hasImages && {
          onDragOver: (e) => { e.preventDefault(); setIsDragOver(true); },
          onDragLeave: () => setIsDragOver(false),
          onDrop: onDrop,
        })}
      >
        {actionCards}
        {!hasImages && (
          <p className={imgClasses.imageHint}>{t("addWizard", "multipleImagesHint")}</p>
        )}
      </div>

      {busy && (
        <p className={imgClasses.imageHint}>
          {uploadingImage
            ? t("recipes", "uploading")
            : t("addWizard", "generatingAiImage")}
        </p>
      )}
    </>
  );
}
