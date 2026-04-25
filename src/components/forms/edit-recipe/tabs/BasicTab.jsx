import { useState } from "react";
import { Heart, Globe, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEditRecipe } from "../EditRecipeContext";
import { useRecipeBook, useLanguage } from "../../../../context";
import { VerifyEmailHint } from "../../../banners/verify-email-hint";
import { ConfirmDialog } from "../../confirm-dialog";
import { UnshareDialog } from "../../unshare-dialog";
import { Toast } from "../../../controls";
import {
  publishRecipeToCommunity,
  unshareRecipeFromCommunity,
} from "../../../../firebase/recipeService";
import { hasUnpublishedChanges } from "../../../../utils/publishedSnapshot";

/**
 * Format a publishedAt ISO string for a short, localized display.
 * Falls back to the raw string if Date parsing fails.
 */
const formatPublishedDate = (iso, lang) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const locale =
      lang === "he" ? "he-IL" : lang === "ru" ? "ru-RU" : lang === "de" ? "de-DE" : "en-US";
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

export default function BasicTab() {
  const {
    editedRecipe,
    setEditedRecipe,
    recipe,
    handleServingsChange,
    toggleFavorite,
    classes,
    shared,
    buttonClasses,
    t,
  } = useEditRecipe();

  const { currentUser, setRecipes } = useRecipeBook();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  // Gate community sharing on verified email. If the recipe is already
  // shared and the user somehow becomes unverified, we still allow them
  // to uncheck the box — we only block turning sharing ON.
  const canShareToCommunity = currentUser?.emailVerified === true;

  // Lock the sourceUrl field when the recipe was imported from a URL.
  // Also treat legacy recipes (flag undefined but sourceUrl present) as
  // imported, so their attribution cannot be silently removed.
  const isSourceUrlLocked =
    editedRecipe.importedFromUrl === true ||
    (editedRecipe.importedFromUrl === undefined &&
      !!(editedRecipe.sourceUrl && editedRecipe.sourceUrl.trim()));

  // ── Share / unshare UI state ───────────────────────────────────
  // The source of truth for "is this recipe currently shared?" is the
  // persisted `recipe.shareToGlobal`, not the form state. That way the
  // checkbox vs. "already shared" panel doesn't flicker mid-edit.
  const isPersistedShared = recipe.shareToGlobal === true;
  const publishedAt =
    editedRecipe.publishedSnapshot?.publishedAt ||
    recipe.publishedSnapshot?.publishedAt ||
    "";
  // Show the "you have unpublished edits" warning when the owner has
  // changed content-fields since the last publish.
  const showDriftWarning = hasUnpublishedChanges({
    ...editedRecipe,
    publishedSnapshot: editedRecipe.publishedSnapshot,
  });

  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showUnshareDialog, setShowUnshareDialog] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unsharing, setUnsharing] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });

  // User ticks the "share" checkbox (from off → on). We don't flip the
  // state yet — first, explain the freeze semantics and get confirmation.
  const handleShareClick = () => {
    if (!canShareToCommunity) return;
    setShowPublishConfirm(true);
  };

  // Publishing is symmetrical with unshare: the moment the user confirms,
  // we write the snapshot + share flags to Firestore so the community can
  // see the recipe immediately — without requiring an extra Save click.
  // The snapshot is built from the recipe as it was last saved (the
  // `recipe` prop). If the user has unsaved content edits in the form,
  // those won't be part of the published version until they Save (and
  // the "unpublished edits" hint will surface).
  const confirmPublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const sharerName =
        currentUser?.displayName ||
        currentUser?.email?.split("@")[0] ||
        "";
      const snapshot = await publishRecipeToCommunity(recipe.id, recipe, {
        sharerUserId: currentUser?.uid,
        sharerName,
        showMyName: true,
      });

      setEditedRecipe((prev) => ({
        ...prev,
        shareToGlobal: true,
        showMyName: true,
        publishedSnapshot: snapshot,
        sharerUserId: snapshot.sharerUserId || "",
        sharerName: snapshot.sharerName || "",
      }));
      // Mutate the prop so the panel renders as "shared" and so the next
      // Save doesn't accidentally roll back the publish.
      recipe.shareToGlobal = true;
      recipe.showMyName = true;
      recipe.publishedSnapshot = snapshot;
      recipe.sharerUserId = snapshot.sharerUserId || "";
      recipe.sharerName = snapshot.sharerName || "";
      recipe.avgRating = 0;
      recipe.ratingCount = 0;

      // Trigger a React re-render of any consumers of the recipes list so
      // the share status is reflected immediately (categories page, public
      // profile, etc.) without requiring the user to hit Save afterwards.
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id
            ? {
                ...r,
                shareToGlobal: true,
                showMyName: true,
                publishedSnapshot: snapshot,
                sharerUserId: snapshot.sharerUserId || "",
                sharerName: snapshot.sharerName || "",
                avgRating: 0,
                ratingCount: 0,
              }
            : r,
        ),
      );

      // Invalidate any cached community-feed pages so the next visit
      // shows the freshly-published recipe (react-query keeps results
      // for ~5 minutes by default).
      queryClient.invalidateQueries({ queryKey: ["globalRecipes"] });

      setShowPublishConfirm(false);
      setToast({
        open: true,
        message: t("recipes", "publishSuccess"),
        variant: "success",
      });
    } catch (err) {
      console.error("Publish failed:", err);
      setToast({
        open: true,
        message: err.message || "Failed",
        variant: "error",
      });
    } finally {
      setPublishing(false);
    }
  };

  // User picks "anonymize" or "remove" in the unshare dialog. We write
  // to Firestore *immediately* so the community sees the change without
  // waiting for the main Save button. The form's local state is kept in
  // sync so the main Save doesn't roll the change back.
  const handleUnsharePick = async (mode) => {
    if (unsharing) return;
    setUnsharing(true);
    try {
      await unshareRecipeFromCommunity(recipe.id, mode);
      if (mode === "remove") {
        setEditedRecipe((prev) => ({
          ...prev,
          shareToGlobal: false,
          showMyName: false,
          publishedSnapshot: null,
          sharerUserId: "",
          sharerName: "",
        }));
        // Mutate the prop so spread-based save paths don't re-introduce
        // the stale snapshot. The parent refetches on next interaction.
        recipe.shareToGlobal = false;
        recipe.publishedSnapshot = null;
        recipe.sharerUserId = "";
        recipe.sharerName = "";
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipe.id
              ? {
                  ...r,
                  shareToGlobal: false,
                  showMyName: false,
                  publishedSnapshot: null,
                  sharerUserId: "",
                  sharerName: "",
                }
              : r,
          ),
        );
        setToast({
          open: true,
          message: t("recipes", "unshareSuccessRemove"),
          variant: "success",
        });
      } else {
        setEditedRecipe((prev) => ({
          ...prev,
          showMyName: false,
          sharerUserId: "",
          sharerName: "",
          publishedSnapshot: prev.publishedSnapshot
            ? {
                ...prev.publishedSnapshot,
                sharerUserId: "",
                sharerName: "",
              }
            : prev.publishedSnapshot,
        }));
        recipe.sharerUserId = "";
        recipe.sharerName = "";
        if (recipe.publishedSnapshot) {
          recipe.publishedSnapshot.sharerUserId = "";
          recipe.publishedSnapshot.sharerName = "";
        }
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipe.id
              ? {
                  ...r,
                  showMyName: false,
                  sharerUserId: "",
                  sharerName: "",
                  publishedSnapshot: r.publishedSnapshot
                    ? {
                        ...r.publishedSnapshot,
                        sharerUserId: "",
                        sharerName: "",
                      }
                    : r.publishedSnapshot,
                }
              : r,
          ),
        );
        setToast({
          open: true,
          message: t("recipes", "unshareSuccessAnonymize"),
          variant: "success",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["globalRecipes"] });
      setShowUnshareDialog(false);
    } catch (err) {
      console.error("Unshare failed:", err);
      setToast({
        open: true,
        message: err.message || "Failed",
        variant: "error",
      });
    } finally {
      setUnsharing(false);
    }
  };

  return (
    <>
      <h3 className={classes.sectionTitle}>{t("addWizard", "basicInfo")}</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <button
          type="button"
          className={`${classes.favoriteBtn} ${editedRecipe.isFavorite ? classes.favoriteBtnActive : ""}`}
          onClick={toggleFavorite}
        >
          {editedRecipe.isFavorite ? (
            <Heart size={22} fill="red" stroke="red" />
          ) : (
            <Heart size={22} />
          )}
          <span>
            {t(
              "recipes",
              editedRecipe.isFavorite
                ? "removeFromFavorites"
                : "addToFavorites",
            )}
          </span>
        </button>
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("recipes", "recipeName")}
          <span>*</span>
        </label>
        <input
          type="text"
          className={shared.formInput}
          value={editedRecipe.name}
          onChange={(e) =>
            setEditedRecipe((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>

      <div className={classes.formRowThree}>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("recipes", "rating")}
          </label>
          <div className={classes.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${classes.starBtn} ${star <= (editedRecipe.rating || 0) ? classes.starBtnActive : ""}`}
                onClick={() =>
                  setEditedRecipe((prev) => ({
                    ...prev,
                    rating: star === prev.rating ? 0 : star,
                  }))
                }
              >
                <Star
                  size={20}
                  fill={star <= (editedRecipe.rating || 0) ? "#ffc107" : "none"}
                />
              </button>
            ))}
          </div>
        </div>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("recipes", "servings")}
          </label>
          <input
            type="number"
            className={shared.formInput}
            value={editedRecipe.servings}
            onChange={handleServingsChange}
            min="1"
          />
        </div>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("recipes", "difficulty")}
          </label>
          <select
            className={shared.formSelect}
            value={editedRecipe.difficulty}
            onChange={(e) =>
              setEditedRecipe((prev) => ({
                ...prev,
                difficulty: e.target.value,
              }))
            }
          >
            <option value="Unknown">{t("difficulty", "Unknown")}</option>
            <option value="VeryEasy">{t("difficulty", "VeryEasy")}</option>
            <option value="Easy">{t("difficulty", "Easy")}</option>
            <option value="Medium">{t("difficulty", "Medium")}</option>
            <option value="Hard">{t("difficulty", "Hard")}</option>
          </select>
        </div>
      </div>

      <div className={shared.formRow}>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("recipes", "cookTime")} ({t("addWizard", "min")})
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            className={shared.formInput}
            value={editedRecipe.cookTime}
            onChange={(e) =>
              setEditedRecipe((prev) => ({
                ...prev,
                cookTime: e.target.value.replace(/[^0-9]/g, ""),
              }))
            }
          />
        </div>
        <div className={shared.formGroup}>
          <label className={shared.formLabel}>
            {t("recipes", "prepTime")} ({t("addWizard", "min")})
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            className={shared.formInput}
            value={editedRecipe.prepTime}
            onChange={(e) =>
              setEditedRecipe((prev) => ({
                ...prev,
                prepTime: e.target.value.replace(/[^0-9]/g, ""),
              }))
            }
          />
        </div>
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("addWizard", "recipeAuthor")} ({t("common", "optional")})
        </label>
        <input
          type="text"
          className={shared.formInput}
          placeholder={t("addWizard", "authorPlaceholder")}
          value={editedRecipe.author || ""}
          onChange={(e) =>
            setEditedRecipe((prev) => ({ ...prev, author: e.target.value }))
          }
        />
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("recipes", "notes")}
        </label>
        <textarea
          className={shared.formTextarea}
          value={editedRecipe.notes}
          onChange={(e) =>
            setEditedRecipe((prev) => ({ ...prev, notes: e.target.value }))
          }
        />
      </div>

      <div className={shared.formGroup}>
        <label className={shared.formLabel}>
          {t("recipes", "sourceUrl")}
        </label>
        <input
          type="url"
          className={shared.formInput}
          placeholder="https://..."
          value={editedRecipe.sourceUrl || ""}
          readOnly={isSourceUrlLocked}
          onChange={(e) =>
            setEditedRecipe((prev) => ({
              ...prev,
              sourceUrl: e.target.value,
            }))
          }
        />
        {isSourceUrlLocked ? (
          <small className={classes.shareRightsNote}>
            {t("recipes", "sourceUrlLockedNote")}
          </small>
        ) : null}
      </div>

      {!recipe.copiedFrom && (
        <div className={shared.formGroup}>
          {isPersistedShared ? (
            /* ─── Already-shared panel ─────────────────────────── */
            <div className={classes.sharedPanel}>
              <span className={classes.sharedBadge}>
                <CheckCircle2 size={14} aria-hidden />
                <span className={classes.sharedBadgeText}>
                  {publishedAt
                    ? `${t("recipes", "publishedOn")} ${formatPublishedDate(publishedAt, language)}`
                    : t("recipes", "publishedBadge")}
                </span>
              </span>
              <div className={classes.sharedMeta}>
                {t("recipes", "shareFreezeNote")}
              </div>
              {showDriftWarning ? (
                <span className={classes.sharedWarning}>
                  <AlertCircle
                    size={14}
                    style={{ verticalAlign: "text-bottom", marginInlineEnd: 4 }}
                  />
                  {t("recipes", "unpublishedEditsHint")}
                </span>
              ) : null}
              <button
                type="button"
                className={classes.unshareBtn}
                onClick={() => setShowUnshareDialog(true)}
                disabled={unsharing}
              >
                <Globe size={14} /> {t("recipes", "unshareBtn")}
              </button>
            </div>
          ) : (
            /* ─── Not shared: checkbox → publish confirmation ───── */
            <>
              <label
                className={`${classes.checkboxLabel} ${
                  !canShareToCommunity && !editedRecipe.shareToGlobal
                    ? classes.shareDisabled
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  name="shareToGlobal"
                  className={buttonClasses.checkBox}
                  checked={editedRecipe.shareToGlobal}
                  disabled={!canShareToCommunity && !editedRecipe.shareToGlobal}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Turning ON → open confirmation; actual flip
                      // happens in `confirmPublish`.
                      handleShareClick();
                    } else {
                      // Turning OFF (never-saved state only — once
                      // persisted-shared, the checkbox is replaced by
                      // the panel above). Simple local revert.
                      setEditedRecipe((prev) => ({
                        ...prev,
                        shareToGlobal: false,
                        showMyName: false,
                      }));
                    }
                  }}
                />
                <Globe size={16} />
                <span>{t("recipes", "shareToGlobal")}</span>
              </label>
              {!canShareToCommunity && !editedRecipe.shareToGlobal ? (
                <VerifyEmailHint message={t("auth", "verifyShareBlocked")} />
              ) : (
                <>
                  <small className={classes.shareRightsNote}>
                    {t("recipes", "shareRightsNote")}
                  </small>
                  <small className={classes.shareRightsNote}>
                    {t("recipes", "shareFreezeNote")}
                  </small>
                </>
              )}
            </>
          )}
        </div>
      )}

      {showPublishConfirm && (
        <ConfirmDialog
          title={t("recipes", "publishConfirmTitle")}
          message={t("recipes", "publishConfirmBody")}
          confirmText={
            publishing
              ? t("common", "loading")
              : t("recipes", "publishConfirmBtn")
          }
          cancelText={t("common", "cancel")}
          onConfirm={confirmPublish}
          onCancel={() =>
            publishing ? null : setShowPublishConfirm(false)
          }
        />
      )}

      {showUnshareDialog && (
        <UnshareDialog
          recipeName={editedRecipe.name || recipe.name}
          onPick={handleUnsharePick}
          onCancel={() => (unsharing ? null : setShowUnshareDialog(false))}
        />
      )}

      <Toast
        open={toast.open}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        variant={toast.variant}
        duration={4000}
      >
        {toast.message}
      </Toast>
    </>
  );
}
