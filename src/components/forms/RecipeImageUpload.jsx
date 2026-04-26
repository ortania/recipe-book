import React, { useRef, useState, useEffect } from "react";
import { X, Camera, Upload, Loader2, Sparkles, Clipboard, GripVertical } from "lucide-react";
import imgClasses from "../../styles/shared/image-upload.module.css";
import shared from "../../styles/shared/form-shared.module.css";
import recipePlaceholder from "../../assets/recipe-placeholder.png";

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
  onReorderImages,
  fileInputRef,
  isMobile,
  hideHint = false,
  t,
}) {
  const pasteAreaRef = useRef(null);
  const cameraInputRef = useRef(null);
  const gridRef = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const isReorderingRef = useRef(false);
  const touchDragIdxRef = useRef(null);

  // Non-passive touchmove on the grid to prevent scroll during touch-reorder
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !onReorderImages) return;

    const onTouchMove = (e) => {
      if (touchDragIdxRef.current === null) return;
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const item = el?.closest("[data-img-idx]");
      if (item) {
        const idx = parseInt(item.dataset.imgIdx, 10);
        if (!isNaN(idx)) setOverIdx(idx);
      }
    };

    grid.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => grid.removeEventListener("touchmove", onTouchMove);
  }, [onReorderImages]);

  // Mouse drag handlers
  const handleItemDragStart = (e, i) => {
    isReorderingRef.current = true;
    setDragIdx(i);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleItemDragOver = (e, i) => {
    e.preventDefault();
    e.stopPropagation();
    if (overIdx !== i) setOverIdx(i);
  };

  const handleItemDrop = (e, i) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIdx !== null && dragIdx !== i) {
      onReorderImages?.(dragIdx, i);
    }
    setDragIdx(null);
    setOverIdx(null);
    isReorderingRef.current = false;
  };

  const handleItemDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
    isReorderingRef.current = false;
  };

  // Touch drag handlers
  const handleTouchStart = (i) => {
    touchDragIdxRef.current = i;
    setDragIdx(i);
    setOverIdx(null);
  };

  const handleTouchEnd = () => {
    const from = touchDragIdxRef.current;
    setOverIdx((currentOver) => {
      if (from !== null && currentOver !== null && from !== currentOver) {
        onReorderImages?.(from, currentOver);
      }
      return null;
    });
    touchDragIdxRef.current = null;
    setDragIdx(null);
  };

  const handlePasteFromArea = (e) => {
    const imageItem = Array.from(e.clipboardData?.items || []).find((item) =>
      item.type.startsWith("image/"),
    );
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) onPasteImage(file);
  };

  const handlePasteClick = async () => {
    if (busy) return;
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((type) => type.startsWith("image/"));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], "pasted-image.png", { type: imageType });
            onPasteImage(file);
            return;
          }
        }
      }
    } catch {
      // permission denied or API unavailable — fall back to manual paste
    }
    pasteAreaRef.current?.focus();
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
        onClick={handlePasteClick}
        disabled={busy}
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
          ref={gridRef}
          className={`${shared.imageGrid} ${isDragOver ? shared.dropActive : ""}`}
          onDragOver={(e) => {
            if (isReorderingRef.current) return;
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => {
            if (isReorderingRef.current) return;
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            if (isReorderingRef.current) return;
            onDrop(e);
          }}
        >
          {images.map((url, i) => (
            <div
              key={i}
              data-img-idx={i}
              className={`${shared.imageGridItem} ${dragIdx === i ? shared.imageGridItemDragging : ""} ${overIdx === i && dragIdx !== i ? shared.imageGridItemOver : ""}`}
              draggable={!!onReorderImages}
              onDragStart={(e) => handleItemDragStart(e, i)}
              onDragOver={(e) => handleItemDragOver(e, i)}
              onDrop={(e) => handleItemDrop(e, i)}
              onDragEnd={handleItemDragEnd}
              onTouchStart={() => onReorderImages && handleTouchStart(i)}
              onTouchEnd={() => onReorderImages && handleTouchEnd()}
            >
              <img src={url} alt={`${i + 1}`} className={shared.imageGridPreview} />
              <button
                type="button"
                className={imgClasses.imageRemoveBtn}
                onClick={() => onRemoveImage(i)}
              >
                <X size={14} />
              </button>
              {onReorderImages && (
                <div className={imgClasses.imageDragHandle}>
                  <GripVertical size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!hasImages && !busy && !hideHint && (
        <div className={imgClasses.imagePlaceholder}>
          <img
            src={recipePlaceholder}
            alt={t("addWizard", "noRecipeImageYet")}
            className={imgClasses.imagePlaceholderImg}
          />
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
        {!hasImages && !hideHint && (
          <p className={imgClasses.imageHint}>{t("addWizard", "multipleImagesHint")}</p>
        )}
        {!hideHint && (
          <p className={imgClasses.imageRightsNote}>
            {t("addWizard", "imageRightsNote")}
          </p>
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
