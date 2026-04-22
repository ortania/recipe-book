import { useState } from "react";
import { Mail } from "lucide-react";
import { Modal } from "../../modal";
import { CloseButton } from "../../controls/close-button";
import { useLanguage } from "../../../context";
import classes from "./change-email-dialog.module.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Modal dialog that collects a new email address plus the user's current
 * password for reauthentication, then delegates the actual Firebase call to
 * the parent via `onSubmit`. Self-contained: manages its own form state,
 * validation, submitting flag, and inline error message.
 *
 * The parent is expected to close the dialog and show a toast on success.
 *
 * @param {{
 *   currentEmail: string,
 *   onSubmit: (payload: { newEmail: string, password: string }) => Promise<void>,
 *   onClose: () => void,
 * }} props
 */
function ChangeEmailDialog({ currentEmail, onSubmit, onClose }) {
  const { t } = useLanguage();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const canSubmit =
    !submitting && newEmail.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!canSubmit) return;

    const trimmed = newEmail.trim();

    if (!EMAIL_REGEX.test(trimmed)) {
      setError(t("settings", "changeEmailInvalid"));
      return;
    }
    if (
      currentEmail &&
      trimmed.toLowerCase() === currentEmail.toLowerCase()
    ) {
      setError(t("settings", "changeEmailSameAsCurrent"));
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ newEmail: trimmed, password });
    } catch (err) {
      console.error("Change email failed:", err);
      if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setError(t("settings", "changeEmailWrongPassword"));
      } else if (err?.code === "auth/email-already-in-use") {
        setError(t("settings", "changeEmailEmailInUse"));
      } else if (err?.code === "auth/invalid-email") {
        setError(t("settings", "changeEmailInvalid"));
      } else if (err?.code === "auth/same-email") {
        setError(t("settings", "changeEmailSameAsCurrent"));
      } else {
        setError(t("settings", "changeEmailGenericError"));
      }
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={handleClose} maxWidth="460px">
      <div className={classes.header}>
        <h2 className={classes.title}>
          <Mail size={20} />
          <span>{t("settings", "changeEmailTitle")}</span>
        </h2>
        <CloseButton onClick={handleClose} />
      </div>

      <form className={classes.body} onSubmit={handleSubmit}>
        <p className={classes.subtitle}>
          {t("settings", "changeEmailDesc")}
        </p>

        {currentEmail && (
          <div className={classes.field}>
            <label className={classes.label}>
              {t("settings", "changeEmailCurrentLabel")}
            </label>
            <div className={classes.currentEmail}>{currentEmail}</div>
          </div>
        )}

        <div className={classes.field}>
          <label className={classes.label} htmlFor="change-email-new">
            {t("settings", "changeEmailNewLabel")}
          </label>
          <input
            id="change-email-new"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={classes.input}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t("settings", "changeEmailNewPlaceholder")}
            disabled={submitting}
          />
        </div>

        <div className={classes.field}>
          <label className={classes.label} htmlFor="change-email-pwd">
            {t("settings", "changeEmailPasswordLabel")}
          </label>
          <input
            id="change-email-pwd"
            type="password"
            autoComplete="current-password"
            className={classes.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          <span className={classes.hint}>
            {t("settings", "changeEmailPasswordHint")}
          </span>
        </div>

        {error && <p className={classes.error}>{error}</p>}

        <div className={classes.actions}>
          <button
            type="button"
            className={classes.cancelBtn}
            onClick={handleClose}
            disabled={submitting}
          >
            {t("common", "cancel")}
          </button>
          <button
            type="submit"
            className={classes.submitBtn}
            disabled={!canSubmit}
          >
            {submitting
              ? t("settings", "changeEmailSubmitting")
              : t("settings", "changeEmailSubmit")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ChangeEmailDialog;
