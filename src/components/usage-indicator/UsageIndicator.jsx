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

  let text;
  if (isDepleted) {
    const allUsed = t("premium", "allUsesExhausted")
      .replace("{limit}", String(limit));
    text = config.reset === "monthly"
      ? `${allUsed} · ${t("premium", "resetsOn") || "מתחדש"} ${getNextMonthLabel(language)}`
      : allUsed;
  } else if (isLow) {
    text = t("premium", "lastQuestionLeft");
  } else {
    text = `${remaining} ${t("premium", "outOf")} ${limit}`;
  }

  return (
    <span
      className={`${classes.indicator} ${isDepleted ? classes.depleted : ""} ${isLow ? classes.low : ""}`}
    >
      {text}
    </span>
  );
}
