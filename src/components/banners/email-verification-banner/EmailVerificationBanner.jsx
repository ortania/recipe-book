import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MailWarning, X, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { useLanguage, useRecipeBook } from "../../../context";
import { resendVerificationEmail } from "../../../firebase/authService";
import classes from "./email-verification-banner.module.css";

/**
 * localStorage key that holds the epoch timestamp (ms) the user last
 * dismissed the banner. We use localStorage (not sessionStorage) with a
 * 24-hour window so dismissal survives tab/app restarts — otherwise a
 * user who taps X would see the banner again on every launch, which is
 * naggy — but after a day it comes back on its own so it can't be
 * forgotten forever.
 */
const DISMISS_KEY = "emailVerifyBannerDismissedAt";
const DISMISS_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

const readDismissedAt = () => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

const isDismissalActive = (ts) =>
  ts > 0 && Date.now() - ts < DISMISS_WINDOW_MS;

/**
 * Top-of-app banner that reminds a signed-in user to verify their email.
 *
 * Visibility rules:
 *  - Only shown when there is a signed-in user AND `emailVerified === false`
 *    AND the provider is `password` (Google users are already verified by
 *    Google; showing them the banner would be noise).
 *  - Dismissible for 24 hours: we store a timestamp in `localStorage` and
 *    re-show once it expires, so a user who taps X can't mute the reminder
 *    forever on this device.
 *  - Auto-refreshes the verification state when the window regains focus
 *    (common flow: user opens inbox, clicks link, returns to our tab).
 *
 * All actions are best-effort: failures are shown inline, never thrown.
 */
function EmailVerificationBanner() {
  const { t } = useLanguage();
  const { currentUser, refreshAuthUser } = useRecipeBook();
  const navigate = useNavigate();

  const [dismissedAt, setDismissedAt] = useState(() => readDismissedAt());
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null); // "resent" | "resendError" | "stillUnverified" | "verified"

  const isPasswordUser = currentUser?.providerId === "password";
  const dismissedActive = isDismissalActive(dismissedAt);
  const needsBanner =
    !!currentUser &&
    currentUser.emailVerified === false &&
    isPasswordUser &&
    !dismissedActive;

  // When the tab regains focus, quietly re-check verification. If the user
  // clicked the link in another tab, the banner disappears on its own.
  useEffect(() => {
    if (!needsBanner) return undefined;
    const onFocus = () => {
      refreshAuthUser?.().catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [needsBanner, refreshAuthUser]);

  // Re-evaluate dismissal once the window expires, without waiting for a
  // re-render trigger from elsewhere. Keeps the banner honest: if a user
  // leaves the tab open for 25+ hours after dismissing, it'll reappear.
  useEffect(() => {
    if (!dismissedActive) return undefined;
    const remaining = DISMISS_WINDOW_MS - (Date.now() - dismissedAt);
    const id = window.setTimeout(() => {
      setDismissedAt(0);
    }, Math.max(remaining, 0) + 1000);
    return () => window.clearTimeout(id);
  }, [dismissedActive, dismissedAt]);

  if (!needsBanner) return null;

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setStatus(null);
    try {
      await resendVerificationEmail();
      setStatus("resent");
    } catch (err) {
      console.warn("Resend verification failed:", err);
      setStatus("resendError");
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    if (checking) return;
    setChecking(true);
    setStatus(null);
    try {
      const verified = await refreshAuthUser?.();
      setStatus(verified ? "verified" : "stillUnverified");
    } catch {
      setStatus("stillUnverified");
    } finally {
      setChecking(false);
    }
  };

  const handleDismiss = () => {
    const now = Date.now();
    try {
      localStorage.setItem(DISMISS_KEY, String(now));
    } catch {}
    setDismissedAt(now);
  };

  const handleChangeEmail = () => {
    navigate("/settings", {
      state: { from: window.location.pathname + window.location.search },
    });
  };

  const message = t("auth", "verifyEmailMessage").replace(
    "{email}",
    currentUser.email || "",
  );

  return (
    <div className={classes.banner} role="status" aria-live="polite">
      {/* Header row: icon + title on one side, dismiss X on the opposite.
       * Message, status and action buttons live below it in the body. */}
      <div className={classes.header}>
        <div className={classes.titleBlock}>
          <MailWarning size={18} className={classes.icon} aria-hidden />
          <div className={classes.title}>{t("auth", "verifyEmailTitle")}</div>
        </div>
        <button
          type="button"
          className={classes.dismissBtn}
          onClick={handleDismiss}
          aria-label={t("auth", "verifyEmailDismiss")}
          title={t("auth", "verifyEmailDismiss")}
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className={classes.message}>{message}</div>

      {status && (
        <div
          className={`${classes.status} ${
            status === "resendError" || status === "stillUnverified"
              ? classes.statusError
              : classes.statusOk
          }`}
        >
          {status === "resent" && t("auth", "verifyEmailResent")}
          {status === "resendError" && t("auth", "verifyEmailResendError")}
          {status === "stillUnverified" &&
            t("auth", "verifyEmailStillNotVerified")}
          {status === "verified" && t("auth", "verifyEmailVerified")}
        </div>
      )}

      <div className={classes.actions}>
        <button
          type="button"
          className={classes.actionBtn}
          onClick={handleResend}
          disabled={resending}
        >
          <RefreshCw size={14} aria-hidden />
          <span>
            {resending
              ? t("auth", "verifyEmailResending")
              : t("auth", "verifyEmailResend")}
          </span>
        </button>
        <button
          type="button"
          className={classes.actionBtn}
          onClick={handleCheck}
          disabled={checking}
        >
          {t("auth", "verifyEmailCheckAgain")}
        </button>
        <button
          type="button"
          className={classes.actionBtn}
          onClick={handleChangeEmail}
        >
          <SettingsIcon size={14} aria-hidden />
          <span>{t("auth", "verifyEmailChangeEmail")}</span>
        </button>
      </div>
    </div>
  );
}

export default EmailVerificationBanner;
