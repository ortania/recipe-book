import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMicrophone,
  FaLink,
  FaCopy,
  FaFire,
  FaFolderOpen,
  FaUtensils,
  FaStop,
} from "react-icons/fa6";
import { FaMicrophoneSlash, FaSearch } from "react-icons/fa";
import { FaRegEdit } from "react-icons/fa";
import { BsTrash3 } from "react-icons/bs";
import { TbChefHat, TbUsers, TbScale } from "react-icons/tb";
import { IoCopyOutline, IoTimeOutline } from "react-icons/io5";
import { FiCamera } from "react-icons/fi";
import { VscDebugRestart } from "react-icons/vsc";
import { IoLanguageOutline } from "react-icons/io5";
import { useLanguage } from "../../context";
import RecipeBookTourIcon from "../icons/RecipeBookIcon/RecipeBookTourIcon";
import { SaveBookIcon } from "../icons/SaveBookIcon";
import classes from "./productTour.module.css";

const FEATURES = [
  {
    key: "smartChat",
    desc: "smartChatDesc",
    icon: FaMicrophone,
    color: "#0066cc",
  },
  {
    key: "cookingMode",
    desc: "cookingModeDesc",
    icon: FaUtensils,
    color: "#c62828",
  },
  {
    key: "importMethods",
    desc: "importMethodsDesc",
    icon: FaLink,
    color: "#7c3aed",
  },
  { key: "nutrition", desc: "nutritionDesc", icon: FaFire, color: "#e65100" },
  {
    key: "copyRecipes",
    desc: "copyRecipesDesc",
    icon: FaCopy,
    color: "#2e7d32",
  },
  {
    key: "organize",
    desc: "organizeDesc",
    icon: FaFolderOpen,
    color: "#0277bd",
  },
  {
    key: "searchFilter",
    desc: "searchFilterDesc",
    icon: FaSearch,
    color: "#6366f1",
  },
  {
    key: "servingsCalc",
    desc: "servingsCalcDesc",
    icon: TbScale,
    color: "#0891b2",
  },
  {
    key: "mealPlanner",
    desc: "mealPlannerDesc",
    icon: FaUtensils,
    color: "#f59e0b",
  },
  {
    key: "languageSupport",
    desc: "languageSupportDesc",
    icon: IoLanguageOutline,
    color: "#6d28d9",
  },
];

/* ============ Onboarding Scenes (shown first in the tour) ============ */
const ONBOARDING_SCREENS = [
  {
    key: "welcome",
    icon: <RecipeBookTourIcon />,
    titleKey: "welcomeTitle",
    subtitleKey: "welcomeSubtitle",
  },
  {
    key: "save",
    icon: <SaveBookIcon />,
    titleKey: "saveTitle",
    bullets: ["saveBullet1", "saveBullet2", "saveBullet3", "saveBullet4"],
    tipLabel: "howToStart",
    tipKey: "saveTip",
  },
  {
    key: "search",
    emoji: "🔍",
    titleKey: "searchTitle",
    bullets: ["searchBullet1", "searchBullet2", "searchBullet3"],
    tipLabel: "howToUse",
    tipKey: "searchTip",
  },
  {
    key: "cook",
    emoji: "🍳",
    titleKey: "cookTitle",
    subtitleKey: "cookSubtitle",
    tipLabel: "howToActivate",
    tipKey: "cookTip",
  },
  {
    key: "chat",
    emoji: "💬",
    titleKey: "chatTitle",
    subtitleKey: "chatSubtitle",
    tipLabel: "howToActivate",
    tipKey: "chatTip",
  },
  {
    key: "nutrition",
    emoji: "🔥",
    titleKey: "nutritionTitle",
    subtitleKey: "nutritionSubtitle",
    tipLabel: "howToActivate",
    tipKey: "nutritionTip",
  },
  {
    key: "plan",
    emoji: "🛒",
    titleKey: "planTitle",
    subtitleKey: "planSubtitle",
    tipLabel: "howToActivate",
    tipKey: "planTip",
  },
];

function OnboardingScene({ screenKey, t }) {
  const data = ONBOARDING_SCREENS.find((s) => s.key === screenKey);
  if (!data) return null;

  const baseStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "1.5rem 1rem",
    minHeight: 260,
  };
  const titleStyle = {
    fontSize: "1.9rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
    textAlign: "center",
  };
  const subtitleStyle = {
    fontSize: "1.7rem",
    color: "var(--text-secondary)",
    margin: 0,
    textAlign: "center",
    maxWidth: 340,
    lineHeight: 1.6,
    whiteSpace: "pre-line",
  };
  const bulletStyle = {
    fontSize: "1.7rem",
    color: "var(--text-primary)",
    padding: "0.4rem 0.8rem",
    background: "var(--bg-tertiary)",
    borderRadius: 8,
    textAlign: "center",
  };
  const tipBoxStyle = {
    marginTop: "1rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.2rem",
    padding: "0.6rem 0.8rem",
    background: "rgba(0,102,204,0.08)",
    borderRadius: 10,
    maxWidth: 340,
    width: "100%",
  };

  return (
    <div style={baseStyle}>
      <div style={{ fontSize: "4rem", lineHeight: 1 }}>
        {data.icon || data.emoji}
      </div>
      <h2 style={titleStyle}>{t("onboarding", data.titleKey)}</h2>
      {data.subtitleKey && (
        <p style={subtitleStyle}>{t("onboarding", data.subtitleKey)}</p>
      )}
      {data.bullets && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            width: "100%",
            maxWidth: 280,
          }}
        >
          {data.bullets.map((bKey) => (
            <div key={bKey} style={bulletStyle}>
              {t("onboarding", bKey)}
            </div>
          ))}
        </div>
      )}
      {data.tipKey && (
        <div style={tipBoxStyle}>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--clr-blue-3)",
            }}
          >
            {t("onboarding", data.tipLabel)}
          </span>
          <span
            style={{
              fontSize: "1.5rem",
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            {t("onboarding", data.tipKey)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ============ Screen 0: Welcome / Features (moved from Home page) ============ */
function WelcomeFeaturesScene({ t }) {
  return (
    <div className={classes.featuresGrid}>
      {FEATURES.map((f, i) => {
        const Icon = f.icon;
        return (
          <div
            key={f.key}
            className={classes.featureCard}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div
              className={classes.featureIconWrap}
              style={{ background: `${f.color}14`, color: f.color }}
            >
              <Icon />
            </div>
            <h3 className={classes.featureTitle}>{t("productTour", f.key)}</h3>
            <p className={classes.featureDesc}>{t("productTour", f.desc)}</p>
          </div>
        );
      })}
      <p className={classes.andMore}>{t("productTour", "andMore")}</p>
    </div>
  );
}

/* ============ Screen 1: Recipe Detail View (mirrors screenshot 3) ============ */
function RecipeDetailScene({ cursorTargetRef, onGoNext, t }) {
  return (
    <div className={classes.recipeCard}>
      <div className={classes.imageContainer}>
        <img
          className={classes.recipeImage}
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&h=300&fit=crop"
          alt="Recipe"
          loading="lazy"
        />
      </div>

      <div className={classes.actionBar}>
        <span className={classes.actionButton}>
          <FaRegEdit size={14} /> {t("productTour", "edit")}
        </span>
        <span className={`${classes.actionButton} ${classes.actionDelete}`}>
          <BsTrash3 size={14} /> {t("productTour", "delete")}
        </span>
        <span className={classes.actionButton}>
          <IoCopyOutline size={14} /> {t("productTour", "copy")}
        </span>
        <span className={classes.actionButton}>
          <FiCamera size={14} /> {t("productTour", "exportImage")}
        </span>
      </div>

      <div className={classes.recipeContent}>
        <div className={classes.nameRow}>
          <div
            ref={cursorTargetRef}
            className={classes.cookingModeBtn}
            onClick={onGoNext}
          >
            <TbChefHat />
          </div>
          <h2 className={classes.recipeName}>כדורי שקדים חמאת בוטנים ומייפל</h2>
        </div>

        <div className={classes.recipeInfo}>
          <span className={classes.infoItem}>
            <IoTimeOutline className={classes.infoIcon} /> 10 min
          </span>
          <span className={classes.infoDot}>·</span>
          <span className={classes.infoItem}>Easy</span>
        </div>

        <div className={classes.categoryTags}>
          <span className={classes.categoryTag}>קימחים</span>
          <span className={classes.categoryTag}>טבעוניות</span>
          <span className={classes.categoryTag}>לנסות</span>
          <span className={classes.categoryTag}>עוגות</span>
        </div>

        <div className={classes.sourceLink}>
          {t("productTour", "sourceLink")}:{" "}
          <span className={classes.sourceLinkUrl}>happyvegan.co.il/...</span>
        </div>

        <div className={classes.servingSelectorRecipe}>
          <span className={classes.servingBtn}>+</span>
          <span className={classes.servingCount}>1</span>
          <span className={classes.servingBtn}>-</span>
          <span className={classes.servingLabelRecipe}>
            <TbUsers /> {t("productTour", "servings")} (1)
          </span>
        </div>

        <div className={classes.tabs}>
          <span className={`${classes.tab} ${classes.activeTab}`}>
            {t("productTour", "ingredients")}
          </span>
          <span className={classes.tab}>
            {t("productTour", "instructions")}
          </span>
          <span className={classes.tab}>{t("productTour", "notes")}</span>
          <span className={classes.tab}>{t("productTour", "chat")}</span>
        </div>

        <ul className={classes.ingredientsList}>
          <li className={classes.ingredientItem}>
            0.5 כוס אגוזים לא קלויים טחונים דק
          </li>
          <li className={classes.ingredientItem}>
            0.5 כוס קמח שקדים או שקדים טחונים
          </li>
          <li className={classes.ingredientItem}>2 כפות חמאת בוטנים</li>
          <li className={classes.ingredientItem}>2-3 כפיות מייפל</li>
          <li className={classes.ingredientItem}>לציפוי: קוקוס טחון</li>
        </ul>
      </div>
    </div>
  );
}

/* ============ Screen 2: Cooking Mode (mirrors screenshots 1 & 2) ============ */
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
    {
      id: "welcome",
      title: t("productTour", "whatCanYouDo"),
      tooltip: "",
      description: "",
      hasCursor: false,
    },
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
      <div className={classes.sceneContainer}>
        {/* Stepper progress bar */}
        <div className={classes.stepperBar}>
          <div className={classes.stepperHeader}>
            <span className={classes.stepperCount}>
              {screen + 1} / {SCREENS.length}
            </span>
            <button
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
            >
              ✕
            </button>
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
              {current.id === "welcome" && <WelcomeFeaturesScene t={t} />}
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
            className={`${classes.navBtn} ${classes.navBtnSecondary}`}
            onClick={goBack}
            disabled={screen === 0}
            style={{ opacity: screen === 0 ? 0.3 : 1 }}
          >
            {t("productTour", "back")}
          </button>

          <button
            className={`${classes.navBtn} ${classes.navBtnPrimary}`}
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
