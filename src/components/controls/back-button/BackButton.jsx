import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../../context";
import classes from "./back-button.module.css";

function BackButton({ onClick, size = 28, color, className = "", title }) {
  const { t } = useLanguage();
  const isRTL = document.documentElement.dir === "rtl";
  const Icon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <button
      className={`${classes.backButton} ${className}`}
      onClick={onClick}
      title={title || t("common", "back")}
      aria-label={title || t("common", "back")}
    >
      <Icon size={size} strokeWidth={2} {...(color ? { color } : {})} />
    </button>
  );
}

export default BackButton;
