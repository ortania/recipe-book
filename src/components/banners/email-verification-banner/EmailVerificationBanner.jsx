import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MailWarning, X, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { useLanguage, useRecipeBook } from "../../../context";
import { resendVerificationEmail } from "../../../firebase/authService";
import classes from "./email-verification-banner.module.css";

const DISMISS_KEY = "emailVerifyBannerDismissed";

/**
 * Top-of-app banner that reminds a signed-in user to verify their email.
 *
 * Visibility rules:
 *  - Only shown when there is a signed-in user AND `emailVerified === false`
 *    AND the provider is `password` (Google users are already verified by
 *    Google; showing them the banner would be noise).
 *  - Dismissible per tab (session): we store a flag in `sessionStorage` so
 *    the banner is hidden for the rest of the session but comes back on
 *    next app load. This keeps the UX un-naggy without hiding the state
 *    permanently from a user who typed a bad email.
 *  - Auto-refreshes the verification state when the window regains focus
 *    (common flow: user opens inbox, clicks link, returns to our tab).
 *
 * All actions are best-effort: failures are shown inline, never thrown.
 */
function EmailVerificationBanner() {
  const { t } = useLanguage();
  const { currentUser, refreshAuthUser } = useRecipeBook();
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null); // "resent" | "resendError" | "stillUnverified" | "verified"

  const isPasswordUser = currentUser?.providerId === "password";
  const needsBanner =
    !!currentUser &&
    currentUser.emailVerified === false &&
    isPasswordUser &&
    !dismissed;

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
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setDismissed(true);
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
      <div className={classes.main}>
        <MailWarning size={18} className={classes.icon} aria-hidden />
        <div className={classes.textBlock}>
          <div className={classes.title}>{t("auth", "verifyEmailTitle")}</div>
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
        </div>
      </div>

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
    </div>
  );
}

export default EmailVerificationBanner;
