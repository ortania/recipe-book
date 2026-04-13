import { useLanguage } from "../../context";
import useEntitlements from "../../hooks/useEntitlements";
import { FEATURE_CONFIG } from "../../config/entitlements";
import classes from "./usage-indicator.module.css";

function getNextMonthLabel(language) {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const day = next.getDate();
  const month = next.getMonth() + 1;
  if (language === "he" || language === "mixed") return `${day}.${month}`;
  return `${month}/${day}`;
}

export default function UsageIndicator({ featureKey }) {
  const { hasFullAccess, canUse } = useEntitlements();
  const { t, language } = useLanguage();

  if (hasFullAccess) return null;

  const config = FEATURE_CONFIG[featureKey];
  if (!config || !config.freeLimit) return null;

  const result = canUse(featureKey);
  if (result.gate === null) return null;

  const remaining = result.remaining ?? 0;
  const limit = config.freeLimit;
  const isLow = remaining <= 1 && remaining > 0;
  const isDepleted = remaining <= 0;

  const depletedText = config.reset === "monthly"
    ? `${t("premium", "noUsesLeft")} · ${t("premium", "resetsOn") || "מתחדש"} ${getNextMonthLabel(language)}`
    : t("premium", "noUsesLeft");

  return (
    <span
      className={`${classes.indicator} ${isDepleted ? classes.depleted : ""} ${isLow ? classes.low : ""}`}
    >
      {isDepleted ? depletedText : `${remaining}/${limit}`}
    </span>
  );
}
