import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { applyFontScale } from "../../utils/applyFontScale";
import { useLanguage } from "../../context";
import { CloseButton } from "../../components/controls/close-button";
import { LANGUAGES } from "../../utils/translations";
import classes from "./settings.module.css";

const DEFAULT_SCALE = 1;
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.8;
const STEP = 0.1;

function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem("fontScale");
    return saved ? parseFloat(saved) : DEFAULT_SCALE;
  });

  useEffect(() => {
    applyFontScale(scale);
    localStorage.setItem("fontScale", scale.toString());
  }, [scale]);

  const handleReset = () => {
    setScale(DEFAULT_SCALE);
  };

  return (
    <div className={classes.settingsPage}>
      <div className={classes.header}>
        <h1 className={classes.title}>{t("settings", "title")}</h1>
        <CloseButton
          onClick={() => navigate(-1)}
          title={t("common", "close")}
        />
      </div>

      <div className={classes.section}>
        <div className={classes.sectionTitle}>
          <span className={classes.sectionIcon}>🌐</span>
          {t("settings", "language")}
        </div>

        <div className={classes.languageGrid}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`${classes.languageButton} ${
                language === lang.code ? classes.languageButtonActive : ""
              }`}
              onClick={() => setLanguage(lang.code)}
            >
              <span className={classes.languageFlag}>{lang.flag}</span>
              <span className={classes.languageName}>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={classes.section}>
        <div className={classes.sectionTitle}>
          <span className={classes.sectionIcon}>♿</span>
          {t("settings", "accessibility")}
        </div>

        <div className={classes.fontSizeControl}>
          <div className={classes.fontSizeLabel}>
            {t("settings", "fontSize")}
          </div>

          <div className={classes.fontSizeSlider}>
            <span className={classes.sliderLabel}>א</span>
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={STEP}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className={classes.slider}
            />
            <span className={classes.sliderLabelLarge}>א</span>
          </div>

          <div className={classes.scaleValue}>×{scale.toFixed(1)}</div>

          <div className={classes.previewBox}>
            <div className={classes.previewTitle}>
              {t("settings", "preview")}
            </div>
            <div className={classes.previewText}>
              {t("settings", "previewText")}
            </div>
          </div>

          {scale !== DEFAULT_SCALE && (
            <button className={classes.resetButton} onClick={handleReset}>
              {t("settings", "resetFont")} (×1.0)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
