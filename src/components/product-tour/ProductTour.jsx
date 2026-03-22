import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context";
import useSwipe from "../../hooks/useSwipe";
import ONBOARDING_SCREENS from "../../pages/onboarding/onboardingScreens";
import OnboardingScene from "./OnboardingScene";
import { CloseButton } from "../controls/close-button";
import buttonClasses from "../controls/gen-button.module.css";
import classes from "./productTour.module.css";

/* ============ Main ProductTour ============ */
function ProductTour({ onClose }) {
  const { t } = useLanguage();
  const [screen, setScreen] = useState(0);
  const [phase, setPhase] = useState(0);
  const [showRipple, setShowRipple] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [micPhase, setMicPhase] = useState(0);
  const cursorTargetRef = useRef(null);
  const sceneBodyRef = useRef(null);

  const SCREENS = [
    ...ONBOARDING_SCREENS.map((s) => ({
      id: `onboarding-${s.key}`,
      title: t("onboarding", s.titleKey),
      tooltip: "",
      description: t("onboarding", s.subtitleKey),
      hasCursor: false,
      isOnboarding: true,
      onboardingKey: s.key,
    })),
  ];

  const current = SCREENS[screen];

  const handleMicClick = () => {
    if (micPhase !== 0) return;
    setMicPhase(1);
    setTimeout(() => setMicPhase(2), 2000);
  };

  useEffect(() => {
    setPhase(0);
    setShowRipple(false);
    setCursorPos({ x: 0, y: 0 });
    setMicPhase(0);

    if (SCREENS[screen]?.id === "cooking") {
      const timers = [
        setTimeout(() => setPhase(1), 600),
        setTimeout(() => setShowRipple(true), 1200),
      ];
      return () => timers.forEach(clearTimeout);
    }

    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setShowRipple(true), 1200),
      setTimeout(() => setPhase(2), 2000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [screen]);

  useEffect(() => {
    const update = () => {
      if (cursorTargetRef.current && sceneBodyRef.current) {
        const t = cursorTargetRef.current.getBoundingClientRect();
        const b = sceneBodyRef.current.getBoundingClientRect();
        setCursorPos({
          x: t.left - b.left + t.width / 2,
          y: t.top - b.top + t.height / 2,
        });
      }
    };
    const timer = setTimeout(update, 400);
    const interval = setInterval(update, 150);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [screen, phase]);

  const goNext = () => {
    if (screen < SCREENS.length - 1) setScreen((s) => s + 1);
    else onClose?.();
  };

  const goBack = () => {
    if (screen > 0) setScreen((s) => s - 1);
  };

  const swipeHandlers = useSwipe(
    () => {
      if (screen > 0) setScreen((s) => s - 1);
    },
    () => {
      if (screen < SCREENS.length - 1) setScreen((s) => s + 1);
    },
  );

  const handleStepClick = (i) => {
    if (i <= screen) setScreen(i);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") goNext();
      else if (e.key === "ArrowRight") goBack();
      else if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen]);

  return (
    <motion.div
      className={classes.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleOverlayClick}
    >
      <div className={classes.sceneContainer} {...swipeHandlers}>
        {/* Stepper progress bar */}
        <div className={classes.stepperBar}>
          <div className={classes.stepperHeader}>
            <span className={classes.stepperCount}>
              {SCREENS.length} / {screen + 1}
            </span>
            <CloseButton
              className={classes.skipBtn}
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClose?.();
              }}
            />
          </div>
          <div className={classes.segmentedBar}>
            {SCREENS.map((_, i) => (
              <div
                key={i}
                className={`${classes.segment} ${
                  i <= screen ? classes.segmentActive : ""
                } ${i === screen ? classes.segmentCurrent : ""}`}
                onClick={() => handleStepClick(i)}
                style={{ cursor: i <= screen ? "pointer" : "default" }}
              />
            ))}
          </div>
        </div>

        {!current.isOnboarding && (
          <div className={classes.sceneHeader}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className={classes.sceneTitle}>{current.title}</h2>
                <p className={classes.sceneDescription}>
                  {current.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <div className={classes.sceneBody} ref={sceneBodyRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              className={classes.sceneInner}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              {current.isOnboarding && (
                <OnboardingScene screenKey={current.onboardingKey} t={t} />
              )}
            </motion.div>
          </AnimatePresence>

          {current.hasCursor &&
            cursorPos.x > 0 &&
            phase >= 1 &&
            !(current.id === "cooking" && micPhase >= 1) && (
              <>
                <motion.div
                  className={classes.virtualCursor}
                  animate={{ left: cursorPos.x, top: cursorPos.y }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div className={classes.cursorDot} />
                </motion.div>

                <div
                  className={classes.pulseTarget}
                  style={{ left: cursorPos.x, top: cursorPos.y }}
                />

                <AnimatePresence>
                  {showRipple && (
                    <motion.div
                      className={classes.ripple}
                      style={{ left: cursorPos.x, top: cursorPos.y }}
                      initial={{ scale: 0.3, opacity: 0.8 }}
                      animate={{ scale: 2, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      onAnimationComplete={() => setShowRipple(false)}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  className={classes.tooltip}
                  style={{
                    left: Math.max(10, cursorPos.x - 100),
                    top: Math.max(10, cursorPos.y - 55),
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  {current.tooltip}
                </motion.div>
              </>
            )}
        </div>

        <div className={classes.navButtons}>
          <button
            className={`${classes.navBtn} ${classes.navBtnSecondary} ${buttonClasses.genButton}`}
            onClick={goBack}
            disabled={screen === 0}
            style={{ opacity: screen === 0 ? 0.3 : 1 }}
          >
            {t("productTour", "back")}
          </button>

          <button
            className={`${classes.navBtn} ${classes.navBtnPrimary} ${buttonClasses.genButton}`}
            onClick={goNext}
          >
            {screen === SCREENS.length - 1
              ? t("productTour", "finish")
              : t("productTour", "next")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ProductTour;
