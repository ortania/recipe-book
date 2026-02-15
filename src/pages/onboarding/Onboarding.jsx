import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context";
import classes from "./onboarding.module.css";

const SCREENS = [
  {
    key: "welcome",
    emoji: "👨‍🍳",
    titleKey: "welcomeTitle",
    subtitleKey: "welcomeSubtitle",
  },
  {
    key: "save",
    emoji: "📋",
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

function Onboarding({ onFinish }) {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isLast = current === SCREENS.length - 1;

  const handleNext = () => {
    if (isLast) {
      finishOnboarding();
    } else {
      setCurrent((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const finishOnboarding = () => {
    localStorage.setItem("onboardingDone", "true");
    if (onFinish) {
      onFinish();
    } else {
      navigate("/login");
    }
  };

  const screen = SCREENS[current];

  return (
    <div className={classes.container}>
      <div className={classes.card}>
        <button className={classes.skipBtn} onClick={handleSkip}>
          {t("onboarding", "skip")}
        </button>

        <div className={classes.content}>
          <div className={classes.emoji}>{screen.emoji}</div>
          <h1 className={classes.title}>{t("onboarding", screen.titleKey)}</h1>

          {screen.subtitleKey && (
            <p className={classes.subtitle}>
              {t("onboarding", screen.subtitleKey)}
            </p>
          )}

          {screen.bullets && (
            <ul className={classes.bullets}>
              {screen.bullets.map((bKey) => (
                <li key={bKey} className={classes.bulletItem}>
                  {t("onboarding", bKey)}
                </li>
              ))}
            </ul>
          )}

          {screen.tipKey && (
            <div className={classes.tip}>
              <span className={classes.tipLabel}>
                {t("onboarding", screen.tipLabel)}
              </span>
              <span className={classes.tipText}>
                {t("onboarding", screen.tipKey)}
              </span>
            </div>
          )}
        </div>

        <div className={classes.footer}>
          <div className={classes.dots}>
            {SCREENS.map((_, i) => (
              <span
                key={i}
                className={`${classes.dot} ${i === current ? classes.dotActive : ""}`}
              />
            ))}
          </div>

          <button className={classes.nextBtn} onClick={handleNext}>
            {isLast ? t("onboarding", "getStarted") : t("onboarding", "next")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
