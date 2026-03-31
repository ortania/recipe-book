import React from "react";
import { ChevronRight, Mic, Sparkles, MessageCircle, Lightbulb } from "lucide-react";
import { CloseButton } from "../../../controls";
import { useWizard } from "../WizardContext";

export default function RecordingScreen() {
  const {
    setScreen,
    setImportError,
    handleClose,
    isRecording,
    recordingText,
    setRecordingText,
    isImporting,
    importError,
    handleStartRecording,
    handleStopRecording,
    handleImportFromRecording,
    doImportWithAI,
    accumulatedTextRef,
    recordingTextRef,
    setRecipeText,
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
            handleStopRecording();
            setRecordingText("");
            setScreen("method");
            setImportError("");
          }}
        >
          <ChevronRight /> {t("addWizard", "backToMethod")}
        </button>
        <CloseButton onClick={handleClose} size={25} />
      </div>

      <h2 className={classes.screenTitle}>
        {t("addWizard", "fromRecordingTitle")}
      </h2>
      <p className={classes.screenSubtitle}>
        {t("addWizard", "fromRecordingSubtitle")}
      </p>

      <div className={classes.recordingArea}>
        {!isRecording && (
          <button
            type="button"
            className={classes.recordBtn}
            onClick={handleStartRecording}
          >
            <Mic size={28} />
            <span>
              {recordingText.trim()
                ? t("addWizard", "continueRecording")
                : t("addWizard", "startRecording")}
            </span>
          </button>
        )}

        {isRecording && (
          <>
            <div className={classes.recordingPulse} />
            <button
              type="button"
              className={classes.stopRecordBtn}
              onClick={handleStopRecording}
            >
              <span className={classes.stopIcon} />
              <span>{t("addWizard", "stopRecording")}</span>
            </button>
          </>
        )}
      </div>

      {!isRecording && recordingText.trim() && (
        <div className={classes.recordingPreview}>
          <label className={classes.fieldLabel}>
            {t("addWizard", "recordedText")}:
          </label>
          <textarea
            className={shared.formTextarea}
            value={recordingText}
            onChange={(e) => setRecordingText(e.target.value)}
            rows={6}
          />
          <p className={classes.fieldHint}>
            {t("addWizard", "recordedTextHint")}
          </p>
        </div>
      )}

      <div className={`${classes.tipBox} ${classes.tipBoxPurple}`}>
        <span className={classes.tipIcon}>
          <Mic size={16} />
        </span>
        <span>
          <span className={classes.tipBold}>{t("addWizard", "tip")}:</span>{" "}
          {t("addWizard", "recordingTip")
            .split("\\n")
            .map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
        </span>
      </div>

      <div className={`${classes.tipBox} ${classes.tipBoxGreen}`}>
        <span className={classes.tipIcon}>
          <Lightbulb size={16} />
        </span>
        <span>{t("addWizard", "recordingExample")}</span>
      </div>

      <div className={`${classes.tipBox} ${classes.tipBoxBlue}`}>
        <span className={classes.tipIcon}>
          <MessageCircle size={16} />
        </span>
        <span>{t("addWizard", "freeSpeechNote")}</span>
      </div>

      {importError && <p className={classes.errorText}>{importError}</p>}

      {!isRecording && recordingText.trim() && (
        <div className={classes.recordingActions}>
          {isImporting && (
            <p className={classes.aiProcessingHint}>
              {t("addWizard", "aiProcessingHint")}
            </p>
          )}
          <button
            type="button"
            className={classes.continueBtn}
            onClick={handleImportFromRecording}
            disabled={isImporting}
          >
            {isImporting
              ? t("addWizard", "importing")
              : t("addWizard", "parseAndImport")}
          </button>
          <button
            type="button"
            className={classes.aiParseBtn}
            onClick={doImportWithAI}
            disabled={isImporting}
          >
            {isImporting ? (
              t("addWizard", "importing")
            ) : (
              <>
                <Sparkles size={16} />
                {t("addWizard", "aiParse")}
              </>
            )}
          </button>
          <button
            type="button"
            className={classes.secondaryBtn}
            onClick={() => {
              setRecordingText("");
              setImportError("");
              accumulatedTextRef.current = "";
              recordingTextRef.current = "";
              setRecipeText("");
              handleStartRecording();
            }}
          >
            {t("addWizard", "reRecord")}
          </button>
        </div>
      )}
    </div>
  );
}
