import { Link, ClipboardList, Mic, ImagePlus, FilePenLine } from "lucide-react";
import fabClasses from "../../controls/fab/fab.module.css";

export default function AddRecipeMenu({ onSelect, t }) {
  return (
    <div className={fabClasses.menu}>
      <button className={fabClasses.menuItem} onClick={() => onSelect("photo")}>
        <span className={fabClasses.menuLabel}>
          {t("addWizard", "fromPhoto")}
        </span>
        <span className={fabClasses.menuIcon}>
          <ImagePlus size={20} />
        </span>
      </button>
      <button className={fabClasses.menuItem} onClick={() => onSelect("url")}>
        <span className={fabClasses.menuLabel}>
          {t("addWizard", "fromUrl")}
        </span>
        <span className={fabClasses.menuIcon}>
          <Link size={20} />
        </span>
      </button>
      <button className={fabClasses.menuItem} onClick={() => onSelect("text")}>
        <span className={fabClasses.menuLabel}>
          {t("addWizard", "fromText")}
        </span>
        <span className={fabClasses.menuIcon}>
          <ClipboardList size={20} />
        </span>
      </button>
      <button
        className={fabClasses.menuItem}
        onClick={() => onSelect("recording")}
      >
        <span className={fabClasses.menuLabel}>
          {t("addWizard", "fromRecording")}
        </span>
        <span className={fabClasses.menuIcon}>
          <Mic size={20} />
        </span>
      </button>
      <button
        className={fabClasses.menuItem}
        onClick={() => onSelect("manual")}
      >
        <span className={fabClasses.menuLabel}>{t("addWizard", "manual")}</span>
        <span className={fabClasses.menuIcon}>
          <FilePenLine size={20} />
        </span>
      </button>
    </div>
  );
}
