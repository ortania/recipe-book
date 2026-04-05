import { useNavigate } from "react-router-dom";
import { GitBranch, ChevronLeft, X } from "lucide-react";
import Modal from "../../modal/Modal";
import { CloseButton } from "../../controls/close-button";
import { useLanguage } from "../../../context";
import classes from "./recipe-variations.module.css";

const TYPE_LABELS = {
  healthier: "variationHealthier",
  protein: "variationProtein",
  quick: "variationQuick",
  kids: "variationKids",
  vegan: "variationVegan",
  glutenFree: "variationGlutenFree",
  custom: "variationCustom",
};

export default function RecipeVariationsList({
  variations,
  recipeName,
  onClose,
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const openVariation = (variationId) => {
    onClose();
    navigate(`/recipe/${variationId}`);
  };

  return (
    <Modal onClose={onClose} maxWidth="480px">
      <div className={classes.container}>
        <div className={classes.header}>
          {/* <button className={classes.closeBtn} onClick={onClose}>
            <X size={20} />
          </button> */}
          <CloseButton className={classes.closeBtn}  onClick={onClose} />
          <h3 className={classes.title}>
            <GitBranch size={18} />
            {t("recipes", "variations")}
          </h3>
          {recipeName && <p className={classes.baseName}>{recipeName}</p>}
        </div>

        {variations.length === 0 ? (
          <div className={classes.empty}>
            <p>{t("recipes", "noVariations")}</p>
            <p className={classes.emptyHint}>
              {t("recipes", "noVariationsHint")}
            </p>
          </div>
        ) : (
          <ul className={classes.list}>
            {variations.map((v) => (
              <li key={v.id} className={classes.item}>
                <button
                  className={classes.itemBtn}
                  onClick={() => openVariation(v.id)}
                >
                  <div className={classes.itemInfo}>
                    <span className={classes.itemName}>{v.name}</span>
                    {v.variationType && v.variationType !== "custom" && TYPE_LABELS[v.variationType] && (
                      <span className={classes.typeTag}>
                        {t("recipes", TYPE_LABELS[v.variationType])}
                      </span>
                    )}
                  </div>
                  <ChevronLeft size={18} className={classes.itemArrow} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
