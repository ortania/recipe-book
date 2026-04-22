import { useState } from "react";
import { MailCheck, RefreshCw, CircleCheck, TriangleAlert } from "lucide-react";
import Modal from "../../modal/Modal";
import modalClasses from "../../modal/modal.module.css";
import { useLanguage } from "../../../context";
import { resendVerificationEmail } from "../../../firebase/authService";
import { POST_SIGNUP_EMAIL_KEY } from "../../../pages/signup/Signup";
import buttonClasses from "../../../styles/shared/buttons.module.css";
import classes from "./post-signup-verify-modal.module.css";

/**
 * One-shot confirmation modal shown right after a brand new signup.
 *
 * Why this lives at the layout level and not inside Signup.jsx:
 *   Firebase's `createUserWithEmailAndPassword` auto-signs the user in,
 *   which fires `onAuthStateChanged`, which flips `isLoggedIn` to true,
 *   which in App.jsx immediately redirects /signup → /categories. Local
 *   React state inside the Signup form never gets to render a success
 *   screen. So Signup stashes the email in sessionStorage and we pick
 *   it up here, in a component that mounts once the user is already
 *   inside the protected layout.
 *
 * Lifecycle:
 *   - Mount: read the sessionStorage flag once; if present, show modal.
 *   - Dismiss (Continue / overlay click / back button / Esc): clear the
 *     flag. We deliberately do NOT clear it in a mount-effect, because
 *     StrictMode double-mounts and effect-cleanup would wipe the flag
 *     before the user ever sees the modal.
 *   - If the user reloads without dismissing, the flag survives and
 *     the modal re-appears — that's fine, they still need to verify.
 */
function PostSignupVerifyModal() {
  const { t } = useLanguage();
  const [email, setEmail] = useState(() => {
    try {
      return sessionStorage.getItem(POST_SIGNUP_EMAIL_KEY) || "";
    } catch {
      return "";
    }
  });
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null); // "ok" | "error" | null

  if (!email) return null;

  const handleClose = () => {
    try {
      sessionStorage.removeItem(POST_SIGNUP_EMAIL_KEY);
    } catch {}
    setEmail("");
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setResendStatus(null);
    try {
      await resendVerificationEmail();
      setResendStatus("ok");
    } catch (err) {
      console.warn("Resend verification (post-signup) failed:", err);
      setResendStatus("error");
    } finally {
      setResending(false);
    }
  };

  const message = t("auth", "signupSuccessMessage").replace("{email}", email);

  return (
    <Modal
      onClose={handleClose}
      maxWidth="480px"
      className={modalClasses.dialogCard}
    >
      <div className={classes.container}>
        <div className={classes.icon}>
          <MailCheck size={48} aria-hidden />
        </div>
        <h2 className={classes.title}>{t("auth", "signupSuccessTitle")}</h2>
        <p className={classes.message}>{message}</p>
        <p className={classes.hint}>{t("auth", "signupSuccessHint")}</p>

        {resendStatus === "ok" && (
          <p className={classes.resendOk}>
            <CircleCheck size={16} aria-hidden />{" "}
            {t("auth", "verifyEmailResent")}
          </p>
        )}
        {resendStatus === "error" && (
          <p className={classes.resendError}>
            <TriangleAlert size={16} aria-hidden />{" "}
            {t("auth", "verifyEmailResendError")}
          </p>
        )}

        <button
          type="button"
          className={`${buttonClasses.genButton} ${classes.continueBtn}`}
          onClick={handleClose}
        >
          {t("auth", "signupSuccessContinue")}
        </button>

        <button
          type="button"
          className={classes.resendBtn}
          onClick={handleResend}
          disabled={resending}
        >
          <RefreshCw
            size={14}
            className={resending ? classes.spinning : undefined}
            aria-hidden
          />
          <span>
            {resending
              ? t("auth", "verifyEmailResending")
              : t("auth", "verifyEmailResend")}
          </span>
        </button>
      </div>
    </Modal>
  );
}

export default PostSignupVerifyModal;
