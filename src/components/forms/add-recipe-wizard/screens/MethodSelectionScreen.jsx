import React from "react";
import { Camera, Link, ClipboardList, Mic, Pencil } from "lucide-react";
import { CloseButton } from "../../../controls";
import { useWizard } from "../WizardContext";

export default function MethodSelectionScreen() {
  const { setScreen, handleClose, classes, t } = useWizard();

  return (
    <div className={classes.wizardContainer}>
      <CloseButton
        className={classes.methodCloseBtn}
        onClick={handleClose}
      />

      <h1 className={classes.methodTitle}>{t("addWizard", "title")}</h1>
      <p className={classes.methodSubtitle}>{t("addWizard", "subtitle")}</p>

      <div className={classes.methodCards}>
        <div
          className={`${classes.methodCard} ${classes.methodCardPhoto}`}
          onClick={() => setScreen("photo")}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconPhoto}`}>
            <Camera size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromPhoto")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromPhotoDesc")}
            </p>
          </div>
        </div>

        <div
          className={`${classes.methodCard} ${classes.methodCardUrl}`}
          onClick={() => setScreen("url")}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconUrl}`}>
            <Link size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromUrl")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromUrlDesc")}
            </p>
          </div>
        </div>

        <div
          className={`${classes.methodCard} ${classes.methodCardText}`}
          onClick={() => setScreen("text")}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconText}`}>
            <ClipboardList size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromText")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromTextDesc")}
            </p>
          </div>
        </div>

        <div
          className={`${classes.methodCard} ${classes.methodCardRecording}`}
          onClick={() => setScreen("recording")}
        >
          <div
            className={`${classes.methodIcon} ${classes.methodIconRecording}`}
          >
            <Mic size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "fromRecording")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "fromRecordingDesc")}
            </p>
          </div>
        </div>

        <div
          className={`${classes.methodCard} ${classes.methodCardManual}`}
          onClick={() => setScreen("manual")}
        >
          <div className={`${classes.methodIcon} ${classes.methodIconManual}`}>
            <Pencil size={24} />
          </div>
          <div className={classes.methodCardContent}>
            <h3 className={classes.methodCardTitle}>
              {t("addWizard", "manual")}
            </h3>
            <p className={classes.methodCardDesc}>
              {t("addWizard", "manualDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
