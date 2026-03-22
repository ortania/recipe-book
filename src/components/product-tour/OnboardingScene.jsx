import { Plus } from "lucide-react";
import ONBOARDING_SCREENS from "../../pages/onboarding/onboardingScreens";
import classes from "./productTour.module.css";

function OnboardingScene({ screenKey, t }) {
  const data = ONBOARDING_SCREENS.find((s) => s.key === screenKey);
  if (!data) return null;

  return (
    <div className={classes.obContent}>
      <div className={classes.onboardingIcon}>{data.icon}</div>
      <h2 className={classes.obTitle}>{t("onboarding", data.titleKey)}</h2>
      {data.subtitleKey && (
        <p className={classes.obSubtitle}>
          {t("onboarding", data.subtitleKey)}
        </p>
      )}
      {data.bullets && (
        <div className={classes.obBulletsContainer}>
          {data.bullets.map((bKey) => (
            <div key={bKey} className={classes.obBulletItem}>
              {t("onboarding", bKey)}
            </div>
          ))}
        </div>
      )}
      {data.tipKey && (
        <div className={classes.obTip}>
          <span className={classes.obTipLabel}>
            {t("onboarding", data.tipLabel)}
          </span>
          <span className={classes.obTipText}>
            {t("onboarding", data.tipKey)
              .split("{icon}")
              .map((part, i, arr) =>
                i < arr.length - 1 ? (
                  <span key={i}>
                    {part}
                    <Plus
                      size={22}
                      style={{ verticalAlign: "middle", display: "inline" }}
                    />
                  </span>
                ) : (
                  part
                ),
              )}
          </span>
        </div>
      )}
    </div>
  );
}

export default OnboardingScene;
