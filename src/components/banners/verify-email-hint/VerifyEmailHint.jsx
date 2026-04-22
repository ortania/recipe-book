import { useNavigate } from "react-router-dom";
import { MailWarning } from "lucide-react";
import { useLanguage, useRecipeBook } from "../../../context";
import classes from "./verify-email-hint.module.css";

/**
 * Inline "verify your email" hint, used next to any control that is blocked
 * by `currentUser.emailVerified === false` (comments, share-to-community).
 *
 * It does two things beyond a plain hint paragraph:
 *  1. Shows the exact address the verification link was sent to — the user
 *     can spot a typo at a glance (e.g. "tania@gnail.com" instead of
 *     "tania@gmail.com").
 *  2. Offers a "Change email" button that routes to Settings → Account
 *     with a proper back-reference, so dismissing the top banner doesn't
 *     hide the recovery path.
 *
 * The component is UI-only; the heavy lifting (reauth, verifyBeforeUpdateEmail)
 * lives in the Settings → Change email dialog.
 */
function VerifyEmailHint({ message }) {
  const { t } = useLanguage();
  const { currentUser } = useRecipeBook();
  const navigate = useNavigate();

  const handleChangeEmail = () => {
    navigate("/settings", {
      state: { from: window.location.pathname + window.location.search },
    });
  };

  return (
    <div className={classes.hint} role="note">
      <MailWarning size={16} className={classes.icon} aria-hidden />
      <div className={classes.body}>
        <div className={classes.main}>{message}</div>
        {currentUser?.email && (
          <div className={classes.sub}>
            {t("auth", "verifyEmailHintSentTo")}{" "}
            <span className={classes.emailAddr}>{currentUser.email}</span>.{" "}
            <span className={classes.wrong}>
              {t("auth", "verifyEmailHintWrongAddress")}
            </span>{" "}
            <button
              type="button"
              className={classes.changeBtn}
              onClick={handleChangeEmail}
            >
              {t("auth", "verifyEmailChangeEmail")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailHint;
