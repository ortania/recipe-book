import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSun, FiMoon, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { applyFontScale } from "../../utils/applyFontScale";
import { getStoredTheme, applyTheme } from "../../utils/theme";
import { useLanguage } from "../../context";
import { CloseButton } from "../../components/controls/close-button";
import { Modal } from "../../components/modal";
import { LANGUAGES, RTL_LANGUAGES } from "../../utils/translations";
import classes from "./settings.module.css";

const DEFAULT_SCALE = 1;
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.8;
const STEP = 0.1;

function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [openSetting, setOpenSetting] = useState(null);

  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem("fontScale");
    return saved ? parseFloat(saved) : DEFAULT_SCALE;
  });

  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyFontScale(scale);
    localStorage.setItem("fontScale", scale.toString());
  }, [scale]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleReset = () => {
    setScale(DEFAULT_SCALE);
  };

  const isRtl = RTL_LANGUAGES.includes(language);
  const ChevronIcon = isRtl ? FiChevronLeft : FiChevronRight;

  const currentLang = LANGUAGES.find((l) => l.code === language);
  const currentThemeLabel =
    theme === "dark" ? t("settings", "darkMode") : t("settings", "lightMode");

  const settingItems = [
    {
      id: "language",
      icon: "🌐",
      label: t("settings", "language"),
      value: currentLang ? `${currentLang.flag} ${currentLang.label}` : "",
    },
    {
      id: "appearance",
      icon: "🎨",
      label: t("settings", "appearance"),
      value: currentThemeLabel,
    },
    {
      id: "accessibility",
      icon: "♿",
      label: t("settings", "accessibility"),
      value: `×${scale.toFixed(1)}`,
    },
  ];

  return (
    <div className={classes.settingsPage}>
      <div className={classes.header}>
        <h1 className={classes.title}>{t("settings", "title")}</h1>
        <CloseButton
          onClick={() => navigate(-1)}
          title={t("common", "close")}
        />
      </div>

      <div className={classes.settingsList}>
        {settingItems.map((item) => (
          <button
            key={item.id}
            className={classes.settingItem}
            onClick={() => setOpenSetting(item.id)}
          >
            <span className={classes.settingItemIcon}>{item.icon}</span>
            <span className={classes.settingItemContent}>
              <span className={classes.settingItemLabel}>{item.label}</span>
              <span className={classes.settingItemValue}>{item.value}</span>
            </span>
            <ChevronIcon className={classes.settingItemChevron} />
          </button>
        ))}
      </div>

      {openSetting === "language" && (
        <Modal onClose={() => setOpenSetting(null)} maxWidth="420px">
          <div className={classes.modalHeader}>
            <h2 className={classes.modalTitle}>
              <span className={classes.sectionIcon}>🌐</span>
              {t("settings", "language")}
            </h2>
            <CloseButton onClick={() => setOpenSetting(null)} />
          </div>
          <div className={classes.modalBody}>
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
        </Modal>
      )}

      {openSetting === "appearance" && (
        <Modal onClose={() => setOpenSetting(null)} maxWidth="420px">
          <div className={classes.modalHeader}>
            <h2 className={classes.modalTitle}>
              <span className={classes.sectionIcon}>🎨</span>
              {t("settings", "appearance")}
            </h2>
            <CloseButton onClick={() => setOpenSetting(null)} />
          </div>
          <div className={classes.modalBody}>
            <div className={classes.themeToggle}>
              <button
                className={`${classes.themeBtn} ${theme === "light" ? classes.themeBtnActive : ""}`}
                onClick={() => handleThemeChange("light")}
              >
                <FiSun />
                <span>{t("settings", "lightMode")}</span>
              </button>
              <button
                className={`${classes.themeBtn} ${theme === "dark" ? classes.themeBtnActive : ""}`}
                onClick={() => handleThemeChange("dark")}
              >
                <FiMoon />
                <span>{t("settings", "darkMode")}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {openSetting === "accessibility" && (
        <Modal onClose={() => setOpenSetting(null)} maxWidth="420px">
          <div className={classes.modalHeader}>
            <h2 className={classes.modalTitle}>
              <span className={classes.sectionIcon}>♿</span>
              {t("settings", "accessibility")}
            </h2>
            <CloseButton onClick={() => setOpenSetting(null)} />
          </div>
          <div className={classes.modalBody}>
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
        </Modal>
      )}
    </div>
  );
}

export default Settings;
