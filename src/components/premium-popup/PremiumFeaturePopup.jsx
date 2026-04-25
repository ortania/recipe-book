import { useState } from "react";
import { Crown } from "lucide-react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../context";
import { CloseButton } from "../controls/close-button";
import classes from "./premium-feature-popup.module.css";

const FREE_LIMITED = [
  "premiumFeature_chat",
  "premiumFeature_recipeChat",
  "premiumFeature_variations",
  "premiumFeature_photoImport",
  "premiumFeature_textImport",
  "premiumFeature_voiceImport",
];

const PREMIUM_ONLY = [
  "premiumFeature_nutrition",
  "premiumFeature_nutritionPhoto",
  "premiumFeature_voice",
  "premiumFeature_aiImage",
  "premiumFeature_aiSuggestions",
];

export default function PremiumFeaturePopup({ open, onClose, type }) {
  const { t } = useLanguage();
  const [view, setView] = useState("main");

  if (!open) return null;

  const isLimit = type === "limit";

  const handleClose = () => {
    setView("main");
    onClose();
  };

  if (view === "details") {
    return createPortal(
      <div className={classes.overlay} onClick={handleClose}>
        <div className={classes.popup} onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={handleClose} className={classes.closeBtn} />
          <div className={classes.icon}>
            <Crown size={24} />
          </div>
          <h4 className={classes.title}>{t("premium", "detailsTitle")}</h4>

          <div className={classes.section}>
            <h5 className={classes.sectionTitle}>{t("premium", "freeIncludesTitle")}</h5>
            <ul className={classes.featureList}>
              {FREE_LIMITED.map((key) => (
                <li key={key}>{t("premium", key)}</li>
              ))}
            </ul>
          </div>

          <div className={classes.section}>
            <h5 className={classes.sectionTitle}>{t("premium", "premiumOnlyTitle")}</h5>
            <ul className={classes.featureList}>
              {PREMIUM_ONLY.map((key) => (
                <li key={key}>
                  <Crown size={13} />
                  {t("premium", key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className={classes.overlay} onClick={handleClose}>
      <div className={classes.popup} onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleClose} className={classes.closeBtn} />
        <div className={classes.icon}>
          <Crown size={24} />
        </div>
        <h4 className={classes.title}>{t("premium", "upgradeTitle")}</h4>
        <p className={classes.message}>
          {isLimit
            ? t("premium", "limitReached")
            : t("premium", "premiumOnly")}
        </p>
        <button className={classes.cta} onClick={() => setView("details")}>
          {t("premium", "learnMore")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
