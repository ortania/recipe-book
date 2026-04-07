import { useState } from "react";
import { Crown, X } from "lucide-react";
import { useLanguage } from "../../context";
import useEntitlements from "../../hooks/useEntitlements";
import classes from "./premium-gate.module.css";

export default function PremiumGate({ featureKey, children, fallback }) {
  const { canUse } = useEntitlements();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  const result = canUse(featureKey);

  if (result.allowed) return children;

  if (dismissed && fallback) return fallback;
  if (dismissed) return null;

  const isUsageGate = result.gate === "usage" || result.gate === "soft";

  return (
    <div className={classes.container}>
      <button
        className={classes.dismissBtn}
        onClick={() => setDismissed(true)}
        aria-label={t("common", "close")}
      >
        <X size={16} />
      </button>
      <div className={classes.icon}>
        <Crown size={22} />
      </div>
      <h4 className={classes.title}>{t("premium", "upgradeTitle")}</h4>
      <p className={classes.message}>
        {isUsageGate
          ? t("premium", "limitReached")
          : t("premium", "premiumOnly")}
      </p>
      <button className={classes.cta}>
        {t("premium", "learnMore")}
      </button>
    </div>
  );
}
