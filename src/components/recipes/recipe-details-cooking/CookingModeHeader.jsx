import {
  Lightbulb, Users, Type, List, ListOrdered,
  Music, Mic, Timer, Volume2, Smartphone, UtensilsCrossed,
} from "lucide-react";
import { CookingVoiceChat } from "../../cooking-voice-chat";
import { BackButton } from "../../controls/back-button";
import { ChatHelpButton } from "../../controls/chat-help-button";
import { useCookingMode } from "./CookingModeContext";

export default function CookingModeHeader() {
  const {
    recipe, onClose, showCompletion, activeTab,
    setShowHelp, showHelp,
    ingredientsArray, instructionsArray, currentStep, servings,
    handleNextStepRef, handlePrevStepRef,
    startTimer, stopAll, setCustomTimerInput,
    switchTab, isTimerRunning, radioRef,
    setCurrentStep, setShowCompletion,
    cycleFontSize, classes, t,
  } = useCookingMode();

  return (
    <div className={classes.headerButtonsCooking}>
      <div className={classes.headerLeft}>
        <BackButton onClick={onClose} />
        {!(showCompletion && activeTab === "instructions") && (
          <ChatHelpButton
            title={t("cookingMode", "howToUse")}
            items={[
              {
                content: (
                  <>
                    <Lightbulb size="2em"  />
                    {t("cookingMode", "helpVolume")}
                  </>
                ),
              },
              {
                content: (
                  <>
                    <Smartphone size="1.2em"  />
                    {t("cookingMode", "screenOn")}
                  </>
                ),
              },
              t("cookingMode", "navTabs"),
              t("cookingMode", "navSteps"),
              {
                content: (
                  <>
                    <Timer size="4.5em"  />
                    {t("cookingMode", "timerTitle")} — {t("cookingMode", "timerText")}
                  </>
                ),
              },
              {
                content: (
                  <>
                    <Music size="2em"  />
                    {t("cookingMode", "radioTitle")} — {t("cookingMode", "radioText")}
                  </>
                ),
              },
              {
                content: (
                  <>
                    <Mic size="1.7em"  />
                    {t("cookingMode", "chatTitle")} — {t("cookingMode", "chatText")}
                  </>
                ),
              },
              { section: t("cookingMode", "voiceSectionSteps"), icon: <ListOrdered size={18} /> },
              { examples: t("cookingMode", "voiceStepsExamples") },
              { section: t("cookingMode", "voiceSectionIngredients"), icon: <UtensilsCrossed size={18} /> },
              { examples: t("cookingMode", "voiceIngredientsExamples") },
              { section: t("cookingMode", "voiceSectionTimer"), icon: <Timer size={18} /> },
              { examples: t("cookingMode", "voiceTimerExamples") },
              { section: t("cookingMode", "voiceSectionRadio"), icon: <Music size={18} /> },
              { examples: t("cookingMode", "voiceRadioExamples") },
            ]}
            onToggle={setShowHelp}
          />
        )}
      </div>
      <h3 className={classes.headerTitle}>{t("recipes", "cookingMode")}</h3>
      <div className={classes.headerRight}>
        <button className={classes.fontSizeBtn} onClick={cycleFontSize} title="גודל פונט">
          <Type size={20} />
        </button>
        <div className={classes.helpWrapper}>
          <CookingVoiceChat
            recipe={recipe}
            ingredients={ingredientsArray}
            instructions={instructionsArray}
            currentStep={currentStep}
            servings={servings}
            activeTab={activeTab}
            onNextStep={() => handleNextStepRef.current()}
            onPrevStep={() => handlePrevStepRef.current()}
            onGotoStep={(step) => {
              setCurrentStep(step);
              setShowCompletion(false);
            }}
            onStartTimer={(minutes, opts) => startTimer(minutes, opts)}
            onStopTimer={() => {
              stopAll();
              setCustomTimerInput("");
            }}
            onSwitchTab={(tab) => { switchTab(tab); }}
            isTimerRunning={isTimerRunning}
            radioRef={radioRef}
          />
          {showHelp && <div className={classes.helpArrow} />}
        </div>
      </div>
    </div>
  );
}
