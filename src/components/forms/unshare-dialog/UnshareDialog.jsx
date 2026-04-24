import { UserX, Trash2 } from "lucide-react";
import { Modal } from "../../modal";
import { useLanguage } from "../../../context";
import modalClasses from "../../modal/modal.module.css";
import classes from "./unshare-dialog.module.css";

/**
 * Two-option confirmation shown when the sharer toggles a previously
 * published recipe off:
 *
 *   - "anonymize": default / recommended. Keep the community post, just
 *                  drop the sharer's name/id.
 *   - "remove"   : fully pull the recipe from the community.
 *
 * The caller owns the actual Firestore write (see
 * `unshareRecipeFromCommunity` in `recipeService.js`).
 */
function UnshareDialog({ onPick, onCancel, recipeName }) {
  const { t } = useLanguage();

  return (
    <Modal
      onClose={onCancel}
      maxWidth="500px"
      className={modalClasses.dialogCard}
    >
      <div className={classes.dialog}>
        <h3>{t("recipes", "unshareTitle")}</h3>
        {recipeName ? <p className={classes.recipeName}>“{recipeName}”</p> : null}
        <p className={classes.intro}>{t("recipes", "unshareIntro")}</p>

        <div className={classes.options}>
          <button
            type="button"
            className={`${classes.option} ${classes.primary}`}
            onClick={() => onPick("anonymize")}
          >
            <span className={classes.icon}>
              <UserX size={22} />
            </span>
            <span className={classes.text}>
              <strong>{t("recipes", "unshareAnonymizeTitle")}</strong>
              <small>{t("recipes", "unshareAnonymizeDesc")}</small>
            </span>
          </button>

          <button
            type="button"
            className={`${classes.option} ${classes.danger}`}
            onClick={() => onPick("remove")}
          >
            <span className={classes.icon}>
              <Trash2 size={22} />
            </span>
            <span className={classes.text}>
              <strong>{t("recipes", "unshareRemoveTitle")}</strong>
              <small>{t("recipes", "unshareRemoveDesc")}</small>
            </span>
          </button>
        </div>

        <button type="button" className={classes.cancel} onClick={onCancel}>
          {t("common", "cancel")}
        </button>
      </div>
    </Modal>
  );
}

export default UnshareDialog;
