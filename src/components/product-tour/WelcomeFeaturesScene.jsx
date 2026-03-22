import FEATURES from "./productTourData";
import classes from "./productTour.module.css";

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

export default WelcomeFeaturesScene;
