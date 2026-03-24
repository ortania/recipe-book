import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../../context";
import btnClasses from "../../../styles/shared/buttons.module.css";

function BackButton({ onClick, size = 30, color, className = "", title }) {
  const { t } = useLanguage();
  const isRTL = document.documentElement.dir === "rtl";
  const Icon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <button
      className={`${btnClasses.btnBase} ${btnClasses.backBtn} ${className}`}
      onClick={onClick}
      title={title || t("common", "back")}
      aria-label={title || t("common", "back")}
    >
      <Icon size={size} strokeWidth={2} {...(color ? { color } : {})} />
    </button>
  );
}

export default BackButton;
