import { motion, AnimatePresence } from "framer-motion";
import { FaMicrophone } from "react-icons/fa6";
import { FaMicrophoneSlash } from "react-icons/fa";
import { TbUsers } from "react-icons/tb";
import { VscDebugRestart } from "react-icons/vsc";
import classes from "./productTour.module.css";

function CookingModeScene({ cursorTargetRef, onMicClicked, micPhase, t }) {
  return (
    <div className={classes.cookingCard}>
      <div className={classes.cookingHeader}>
        <div className={classes.headerLeft}>
          <span className={classes.infoButton}>?</span>
          <button
            ref={cursorTargetRef}
            className={`${classes.voiceChatIcon} ${micPhase >= 1 ? classes.voiceChatActive : ""}`}
            onClick={micPhase === 0 ? onMicClicked : undefined}
          >
            {micPhase >= 1 ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>
        </div>
        <h3 className={classes.cookingHeaderTitle}>
          {t("productTour", "cookingModeLabel")}
        </h3>
        <div className={classes.headerRight}>
          <span className={classes.closeBtn}>✕</span>
        </div>
      </div>

      <div className={classes.servingSelector}>
        <div className={classes.servingControls}>
          <span className={classes.servingBtn}>+</span>
          <span className={classes.servingCount}>1</span>
          <span className={classes.servingBtn}>-</span>
        </div>
        <span className={classes.servingLabel}>
          <TbUsers /> {t("productTour", "servings")}
        </span>
      </div>

      <div className={classes.cookingTabs}>
        <span className={classes.cookingTab}>
          {t("productTour", "ingredients")}
        </span>
        <span className={`${classes.cookingTab} ${classes.cookingTabActive}`}>
          {t("productTour", "instructions")}
        </span>
      </div>

      <div className={classes.stepContent}>
        <p className={classes.stepText}>
          לערבב את כל המצרכים יחד בקערה, להרטיב טיפה את הידיים וליצור כדורים
          בידיים לחות
        </p>
      </div>

      <div className={classes.progressSection}>
        <div className={classes.progressHeader}>
          <span className={classes.stepInfo}>
            {t("productTour", "step")} 1 {t("productTour", "of")} 4
          </span>
          <span className={classes.progressBadge}>25%</span>
        </div>
        <div className={classes.progressTrack}>
          <div className={classes.progressFill} style={{ width: "25%" }} />
        </div>
        <div className={classes.navRow}>
          <span className={classes.navBtnCooking}>
            ← {t("productTour", "previous")}
          </span>
          <span className={classes.navBtnCookingReset}>
            <VscDebugRestart /> {t("productTour", "reset")}
          </span>
          <span className={classes.navBtnCookingNext}>
            {t("productTour", "nextStep")} →
          </span>
        </div>
      </div>

      <div className={classes.timerSection}>
        <div className={classes.timerRow}>
          <span className={classes.timerLabel}>
            🔥 {t("productTour", "timer")}
          </span>
          <div className={classes.timerControls}>
            <span className={classes.servingBtn}>-</span>
            <span className={classes.timerDisplay}>00</span>
            <span className={classes.servingBtn}>+</span>
          </div>
          <span className={classes.timerStart}>
            ▶ {t("productTour", "start")}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {micPhase >= 1 && (
          <motion.div
            className={classes.statusArea}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {micPhase === 1 && (
              <div className={classes.statusText}>
                {t("productTour", "listening")}
              </div>
            )}
            {micPhase >= 2 && (
              <>
                <div className={classes.statusText}>
                  {t("productTour", "listening")}
                </div>
                <div className={classes.responseText}>
                  {t("productTour", "voiceResponse")}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CookingModeScene;
