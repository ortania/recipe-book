import { useLanguage } from "../../context";
import useEntitlements from "../../hooks/useEntitlements";
import { FEATURE_CONFIG } from "../../config/entitlements";
import classes from "./usage-indicator.module.css";

export default function UsageIndicator({ featureKey }) {
  const { hasFullAccess, canUse } = useEntitlements();
  const { t } = useLanguage();

  if (hasFullAccess) return null;

  const config = FEATURE_CONFIG[featureKey];
  if (!config || !config.freeLimit) return null;

  const result = canUse(featureKey);
  if (result.gate === null) return null;

  const remaining = result.remaining ?? 0;
  const limit = config.freeLimit;
  const isLow = remaining <= 1 && remaining > 0;
  const isDepleted = remaining <= 0;

  return (
    <span
      className={`${classes.indicator} ${isDepleted ? classes.depleted : ""} ${isLow ? classes.low : ""}`}
    >
      {isDepleted
        ? t("premium", "noUsesLeft")
        : `${remaining}/${limit}`}
    </span>
  );
}
