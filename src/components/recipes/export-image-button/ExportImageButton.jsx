import React, { useState } from "react";
import {
  generateRecipeImage,
  saveImageToGallery,
  shareImageFile,
} from "../generateRecipeImage";
import classes from "./export-image-button.module.css";
import { useLanguage } from "../../../context";
import { Image as ImageIcon, Download, Share2 } from "lucide-react";
import Toast from "../../controls/toast/Toast";
import Modal from "../../modal/Modal";

function ExportImageButton({ recipe, asMenuItem = false }) {
  const { t, language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  // Holds the generated file info on native when we're waiting for the user
  // to choose Save-to-Gallery vs Share.
  const [pendingNativeFile, setPendingNativeFile] = useState(null);
  // Tracks which specific action is in progress inside the choice dialog, so
  // we can show a spinner on the right button.
  const [runningAction, setRunningAction] = useState(null); // "save" | "share" | null

  const isNative =
    typeof window !== "undefined" &&
    window.Capacitor?.isNativePlatform?.() === true;

  const handleExport = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const result = await generateRecipeImage(recipe, t, language);
      if (isNative && result?.uri) {
        // Show choice dialog — user picks Save to Gallery or Share.
        setPendingNativeFile(result);
      } else {
        // Web: generateRecipeImage already triggered the browser download.
        setSaved(true);
      }
    } catch (err) {
      console.error("Failed to generate recipe image:", err);
      alert("Export error: " + (err?.message || String(err)));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToGallery = async () => {
    if (!pendingNativeFile || runningAction) return;
    setRunningAction("save");
    try {
      await saveImageToGallery(pendingNativeFile);
      // Show the toast BEFORE unmounting the modal. The toast is portaled to
      // document.body with a higher z-index than the modal, so it appears
      // above. Then close the modal on the next tick so React doesn't batch
      // the two state updates into the same render (which was letting the
      // toast's open transition get swallowed by the modal's unmount).
      setSaved(true);
      setTimeout(() => setPendingNativeFile(null), 0);
    } catch (err) {
      console.error("Failed to save to gallery:", err);
      alert(
        (t ? t("recipes", "saveToGallery") : "Save to Gallery") +
          " — " +
          (err?.message || String(err)),
      );
    } finally {
      setRunningAction(null);
    }
  };

  const handleShare = async () => {
    if (!pendingNativeFile || runningAction) return;
    setRunningAction("share");
    try {
      await shareImageFile({
        uri: pendingNativeFile.uri,
        title: recipe?.name || "Recipe",
        dialogTitle: t ? t("recipes", "exportAsImage") : "Share recipe",
      });
      // Share sheet is its own confirmation, don't also show the toast.
      setPendingNativeFile(null);
    } catch (err) {
      console.error("Failed to share image:", err);
      alert(
        (t ? t("recipes", "shareImage") : "Share") +
          " — " +
          (err?.message || String(err)),
      );
    } finally {
      setRunningAction(null);
    }
  };

  const handleChoiceClose = () => {
    if (runningAction) return; // don't close mid-action
    setPendingNativeFile(null);
  };

  const labelText = isGenerating
    ? t("recipes", "generating")
    : t("recipes", "exportToImage");

  const choiceDialog = pendingNativeFile ? (
    <Modal onClose={handleChoiceClose} bottomSheet>
      <div className={classes.choiceDialog}>
        <h3 className={classes.choiceTitle}>
          {t("recipes", "exportChoiceTitle")}
        </h3>
        <button
          className={`${classes.choiceButton} ${classes.choiceButtonPrimary}`}
          onClick={handleSaveToGallery}
          disabled={!!runningAction}
          type="button"
        >
          {runningAction === "save" ? (
            <span className={classes.spinner} />
          ) : (
            <Download size={18} />
          )}
          <span>{t("recipes", "saveToGallery")}</span>
        </button>
        <button
          className={classes.choiceButton}
          onClick={handleShare}
          disabled={!!runningAction}
          type="button"
        >
          {runningAction === "share" ? (
            <span className={classes.spinner} />
          ) : (
            <Share2 size={18} />
          )}
          <span>{t("recipes", "shareImage")}</span>
        </button>
        <button
          className={`${classes.choiceButton} ${classes.choiceButtonCancel}`}
          onClick={handleChoiceClose}
          disabled={!!runningAction}
          type="button"
        >
          {t("recipes", "cancel")}
        </button>
      </div>
    </Modal>
  ) : null;

  if (asMenuItem) {
    return (
      <>
        <Toast open={saved} onClose={() => setSaved(false)} duration={3500}>
          {t("recipes", "savedToGallery")}
        </Toast>
        {choiceDialog}
        <button
          className={classes.menuItem}
          onClick={handleExport}
          disabled={isGenerating}
        >
          <span className={classes.menuItemLabel}>{labelText}</span>
          <span className={classes.menuItemIcon}>
            {isGenerating ? (
              <span className={classes.spinner} />
            ) : (
              <ImageIcon size={18} />
            )}
          </span>
        </button>
      </>
    );
  }

  return (
    <>
      <Toast open={saved} onClose={() => setSaved(false)} duration={3500}>
        {t("recipes", "savedToGallery")}
      </Toast>
      {choiceDialog}
      <button
        className={classes.exportButton}
        onClick={handleExport}
        disabled={isGenerating}
        title={t("recipes", "exportAsImage")}
      >
        {isGenerating ? (
          <span className={classes.spinner} />
        ) : (
          <ImageIcon size={18} />
        )}
        <span className={classes.label}>{labelText}</span>
      </button>
    </>
  );
}

export default ExportImageButton;
