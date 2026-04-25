import React from "react";
import {
  ChevronRight,
  ShieldAlert,
  Mic,
  Camera,
  Link as LinkIcon,
  Pencil,
} from "lucide-react";
import { CloseButton } from "../../../controls";
import { useWizard } from "../WizardContext";

// "From Video" is implemented as a router rather than a single import path.
// Instagram and YouTube intentionally don't expose video content to outside
// apps, and our original constraints forbid scraping / login bypass / video
// download. So instead of pretending we can read the video, this screen
// helps the user pick the right existing flow (recording / photo / blog
// URL / manual) and stashes the video link for attribution before
// jumping there. The chosen flow runs unchanged; the video URL and the
// importedFromVideo flag survive via the existing setRecipe(prev=>...)
// patterns in each handler.
export default function VideoScreen() {
  const {
    setScreen,
    setImportError,
    handleClose,
    recipeVideoUrl,
    setRecipeVideoUrl,
    handleStartFromVideo,
    classes,
    shared,
    t,
  } = useWizard();

  return (
    <div className={classes.wizardContainer}>
      <div className={classes.screenTopBar}>
        <button
          type="button"
          className={classes.backLink}
          onClick={() => {
            setScreen("method");
            setImportError("");
          }}
        >
          <ChevronRight /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton onClick={handleClose} size={25} />
      </div>

      <h2 className={classes.screenTitle}>
        {t("addWizard", "fromVideoTitle")}
      </h2>
      <p className={classes.screenSubtitle}>
        {t("addWizard", "fromVideoSubtitle")}
      </p>

      <label className={classes.fieldLabel}>
        {t("addWizard", "videoUrlLabel")}
      </label>
      <input
        type="url"
        className={shared.formInput}
        placeholder={t("addWizard", "videoUrlPlaceholder")}
        value={recipeVideoUrl}
        onChange={(e) => setRecipeVideoUrl(e.target.value)}
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        dir="ltr"
      />

      <h3 className={`${classes.fieldLabel} ${classes.methodsHeading}`}>
        {t("addWizard", "fromVideoMethodsTitle")}
      </h3>

      <div className={classes.methodCards}>
        <div
          className={classes.methodCard}
          onClick={() => handleStartFromVideo("recording")}
        >
          <div className={classes.methodIcon}>
            <Mic size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "videoMethodRecording")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "videoMethodRecordingDesc")}
            </p>
          </div>
        </div>

        <div
          className={classes.methodCard}
          onClick={() => handleStartFromVideo("photo")}
        >
          <div className={classes.methodIcon}>
            <Camera size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "videoMethodPhoto")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "videoMethodPhotoDesc")}
            </p>
          </div>
        </div>

        <div
          className={classes.methodCard}
          onClick={() => handleStartFromVideo("url")}
        >
          <div className={classes.methodIcon}>
            <LinkIcon size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "videoMethodBlog")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "videoMethodBlogDesc")}
            </p>
          </div>
        </div>

        <div
          className={classes.methodCard}
          onClick={() => handleStartFromVideo("manual")}
        >
          <div className={classes.methodIcon}>
            <Pencil size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "videoMethodManual")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "videoMethodManualDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className={classes.tipBox}>
        <span className={classes.tipIcon}>
          <ShieldAlert size={16} />
        </span>
        <span>{t("addWizard", "videoImageRightsHint")}</span>
      </div>
    </div>
  );
}
