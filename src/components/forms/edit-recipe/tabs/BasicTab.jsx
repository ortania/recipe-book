import { useState } from "react";
import { Heart, Globe, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { useEditRecipe } from "../EditRecipeContext";
import { useRecipeBook, useLanguage } from "../../../../context";
import { VerifyEmailHint } from "../../../banners/verify-email-hint";
import { ConfirmDialog } from "../../confirm-dialog";
import { UnshareDialog } from "../../unshare-dialog";
import { Toast } from "../../../controls";
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

  const { currentUser } = useRecipeBook();
  const { language } = useLanguage();
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
  // The panel reflects the user's *intended* state (editedRecipe), so
  // when they toggle share/unshare in the form, the UI flips
  // immediately even though no Firestore write happens yet. The
  // actual write is deferred to the Save Changes button (handled in
  // EditRecipe.handleSubmit by diffing recipe vs. editedRecipe).
  const isPersistedShared = recipe.shareToGlobal === true;
  const isIntendedShared = editedRecipe.shareToGlobal === true;
  const publishedAt =
    editedRecipe.publishedSnapshot?.publishedAt ||
    recipe.publishedSnapshot?.publishedAt ||
    "";
  // Pending transitions (intent vs. persisted) — used to surface
  // "will publish on save" / "will remove on save" hints to the user.
  const pendingPublish = !isPersistedShared && isIntendedShared;
  const pendingUnshare = isPersistedShared && !isIntendedShared;
  const pendingAnonymize =
    isPersistedShared &&
    isIntendedShared &&
    recipe.showMyName !== false &&
    editedRecipe.showMyName === false;
  // Show the "you have unpublished edits" warning when the owner has
  // changed content-fields since the last publish.
  const showDriftWarning =
    !pendingPublish &&
    !pendingUnshare &&
    hasUnpublishedChanges({
      ...editedRecipe,
      publishedSnapshot: editedRecipe.publishedSnapshot,
    });

  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showUnshareDialog, setShowUnshareDialog] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });

  // User ticks the "share" checkbox (from off → on). We don't flip the
  // state yet — first, explain the freeze semantics and get confirmation.
  const handleShareClick = () => {
    if (!canShareToCommunity) return;
    setShowPublishConfirm(true);
  };

  // Publish/unshare in this form are *intent* changes — they update
  // the form's local state but do NOT write to Firestore. The
  // resolved transition (private → shared, shared → private, share →
  // anonymize, etc.) is detected and persisted by the main Save
  // button via `EditRecipe.handleSubmit`. This way the user can
  // toggle and even change their mind freely without surprise
  // community-visible writes mid-edit.
  const confirmPublish = () => {
    const sharerName =
      currentUser?.displayName ||
      currentUser?.email?.split("@")[0] ||
      "";
    setEditedRecipe((prev) => ({
      ...prev,
      shareToGlobal: true,
      showMyName: true,
      sharerUserId: currentUser?.uid || "",
      sharerName,
      // Reset any stale snapshot — a fresh snapshot is built at
      // save time from the form's then-current content.
      publishedSnapshot: null,
    }));
    setShowPublishConfirm(false);
    setToast({
      open: true,
      message: t("recipes", "publishOnSaveHint"),
      variant: "neutral",
    });
  };

  const handleUnsharePick = (mode) => {
    if (mode === "remove") {
      setEditedRecipe((prev) => ({
        ...prev,
        shareToGlobal: false,
        showMyName: false,
        publishedSnapshot: null,
        sharerUserId: "",
        sharerName: "",
      }));
      setToast({
        open: true,
        message: t("recipes", "unshareRemoveOnSaveHint"),
        variant: "neutral",
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
      setToast({
        open: true,
        message: t("recipes", "unshareAnonymizeOnSaveHint"),
        variant: "neutral",
      });
    }
    setShowUnshareDialog(false);
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
          {isIntendedShared ? (
            /* ─── Currently shared (or pending publish) ─────────── */
            <div className={classes.sharedPanel}>
              <span className={classes.sharedBadge}>
                <CheckCircle2 size={14} aria-hidden />
                <span className={classes.sharedBadgeText}>
                  {pendingPublish
                    ? t("recipes", "pendingPublishBadge")
                    : publishedAt
                      ? `${t("recipes", "publishedOn")} ${formatPublishedDate(publishedAt, language)}`
                      : t("recipes", "publishedBadge")}
                </span>
              </span>
              <div className={classes.sharedMeta}>
                {t("recipes", "shareFreezeNote")}
              </div>
              {pendingPublish ? (
                <span className={classes.sharedMeta}>
                  {t("recipes", "publishOnSaveHint")}
                </span>
              ) : pendingAnonymize ? (
                <span className={classes.sharedWarning}>
                  <AlertCircle
                    size={14}
                    style={{ verticalAlign: "text-bottom", marginInlineEnd: 4 }}
                  />
                  {t("recipes", "unshareAnonymizeOnSaveHint")}
                </span>
              ) : showDriftWarning ? (
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
                onClick={() =>
                  pendingPublish
                    ? // Pending-publish: just cancel the intent locally,
                      // no dialog needed because nothing was persisted.
                      setEditedRecipe((prev) => ({
                        ...prev,
                        shareToGlobal: false,
                        showMyName: false,
                        publishedSnapshot: null,
                        sharerUserId: "",
                        sharerName: "",
                      }))
                    : setShowUnshareDialog(true)
                }
              >
                <Globe size={14} />{" "}
                {pendingPublish
                  ? t("common", "cancel")
                  : t("recipes", "unshareBtn")}
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
                      handleShareClick();
                    } else {
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
              {pendingUnshare ? (
                <small className={classes.sharedWarning}>
                  <AlertCircle
                    size={14}
                    style={{ verticalAlign: "text-bottom", marginInlineEnd: 4 }}
                  />
                  {t("recipes", "unshareRemoveOnSaveHint")}
                </small>
              ) : !canShareToCommunity && !editedRecipe.shareToGlobal ? (
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
          confirmText={t("recipes", "publishConfirmBtn")}
          cancelText={t("common", "cancel")}
          onConfirm={confirmPublish}
          onCancel={() => setShowPublishConfirm(false)}
        />
      )}

      {showUnshareDialog && (
        <UnshareDialog
          recipeName={editedRecipe.name || recipe.name}
          onPick={handleUnsharePick}
          onCancel={() => setShowUnshareDialog(false)}
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
