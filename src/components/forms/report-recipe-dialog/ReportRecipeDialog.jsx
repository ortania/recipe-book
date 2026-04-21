import { useState } from "react";
import { Flag } from "lucide-react";
import { Modal } from "../../modal";
import { CloseButton } from "../../controls/close-button";
import { useLanguage } from "../../../context";
import classes from "./report-recipe-dialog.module.css";

const REASONS = [
  "offensive",
  "infringement",
  "misleading",
  "spam",
  "other",
];

const REASON_LABEL_KEY = {
  offensive: "reportReasonOffensive",
  infringement: "reportReasonInfringement",
  misleading: "reportReasonMisleading",
  spam: "reportReasonSpam",
  other: "reportReasonOther",
};

/**
 * Simple modal to collect a report on a community recipe.
 * Self-contained: manages its own reason/details/submitting/error state.
 * Parent handles the actual Firestore write via `onSubmit` and the closing/toast.
 *
 * @param {{ onSubmit: (payload: { reason: string, details: string }) => Promise<void>, onClose: () => void }} props
 */
function ReportRecipeDialog({ onSubmit, onClose }) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const canSubmit = !!reason && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        reason,
        details: reason === "other" ? details : "",
      });
    } catch (err) {
      console.error("Report submit failed:", err);
      setError(t("report", "reportError"));
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={handleClose} maxWidth="480px">
      <div className={classes.header}>
        <h2 className={classes.title}>
          <Flag size={20} />
          <span>{t("report", "reportDialogTitle")}</span>
        </h2>
        <CloseButton onClick={handleClose} />
      </div>

      <div className={classes.body}>
        <p className={classes.subtitle}>{t("report", "reportSubtitle")}</p>

        <div className={classes.reasonList} role="radiogroup">
          {REASONS.map((r) => (
            <label key={r} className={classes.reasonItem}>
              <input
                type="radio"
                name="report-reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                disabled={submitting}
                className={classes.reasonRadio}
              />
              <span className={classes.reasonLabel}>
                {t("report", REASON_LABEL_KEY[r])}
              </span>
            </label>
          ))}
        </div>

        {reason === "other" && (
          <div className={classes.detailsField}>
            <label className={classes.detailsLabel}>
              {t("report", "reportDetailsLabel")}
            </label>
            <textarea
              className={classes.detailsInput}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("report", "reportDetailsPlaceholder")}
              maxLength={500}
              rows={3}
              disabled={submitting}
            />
          </div>
        )}

        {error && <p className={classes.error}>{error}</p>}

        <div className={classes.actions}>
          <button
            type="button"
            className={classes.cancelBtn}
            onClick={handleClose}
            disabled={submitting}
          >
            {t("report", "reportCancel")}
          </button>
          <button
            type="button"
            className={classes.submitBtn}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting
              ? t("report", "reportSubmitting")
              : t("report", "reportSubmit")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ReportRecipeDialog;
