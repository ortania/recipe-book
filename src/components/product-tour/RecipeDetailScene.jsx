import { FaRegEdit } from "react-icons/fa";
import { BsTrash3 } from "react-icons/bs";
import { TbChefHat, TbUsers } from "react-icons/tb";
import { IoCopyOutline, IoTimeOutline } from "react-icons/io5";
import { FiCamera } from "react-icons/fi";
import classes from "./productTour.module.css";

function RecipeDetailScene({ cursorTargetRef, onGoNext, t }) {
  return (
    <div className={classes.recipeCard}>
      <div className={classes.imageContainer}>
        <img
          className={classes.recipeImage}
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&h=300&fit=crop"
          alt="Recipe"
          loading="lazy"
        />
      </div>

      <div className={classes.actionBar}>
        <span className={classes.actionButton}>
          <FaRegEdit size={14} /> {t("productTour", "edit")}
        </span>
        <span className={`${classes.actionButton} ${classes.actionDelete}`}>
          <BsTrash3 size={14} /> {t("productTour", "delete")}
        </span>
        <span className={classes.actionButton}>
          <IoCopyOutline size={14} /> {t("productTour", "copy")}
        </span>
        <span className={classes.actionButton}>
          <FiCamera size={14} /> {t("productTour", "exportImage")}
        </span>
      </div>

      <div className={classes.recipeContent}>
        <div className={classes.nameRow}>
          <div
            ref={cursorTargetRef}
            className={classes.cookingModeBtn}
            onClick={onGoNext}
          >
            <TbChefHat />
          </div>
          <h2 className={classes.recipeName}>כדורי שקדים חמאת בוטנים ומייפל</h2>
        </div>

        <div className={classes.recipeInfo}>
          <span className={classes.infoItem}>
            <IoTimeOutline className={classes.infoIcon} /> 10 min
          </span>
          <span className={classes.infoDot}>·</span>
          <span className={classes.infoItem}>Easy</span>
        </div>

        <div className={classes.categoryTags}>
          <span className={classes.categoryTag}>קימחים</span>
          <span className={classes.categoryTag}>טבעוניות</span>
          <span className={classes.categoryTag}>לנסות</span>
          <span className={classes.categoryTag}>עוגות</span>
        </div>

        <div className={classes.sourceLink}>
          {t("productTour", "sourceLink")}:{" "}
          <span className={classes.sourceLinkUrl}>happyvegan.co.il/...</span>
        </div>

        <div className={classes.servingSelectorRecipe}>
          <span className={classes.servingBtn}>+</span>
          <span className={classes.servingCount}>1</span>
          <span className={classes.servingBtn}>-</span>
          <span className={classes.servingLabelRecipe}>
            <TbUsers /> {t("productTour", "servings")} (1)
          </span>
        </div>

        <div className={classes.tabs}>
          <span className={`${classes.tab} ${classes.activeTab}`}>
            {t("productTour", "ingredients")}
          </span>
          <span className={classes.tab}>
            {t("productTour", "instructions")}
          </span>
          <span className={classes.tab}>{t("productTour", "notes")}</span>
          <span className={classes.tab}>{t("productTour", "chat")}</span>
        </div>

        <ul className={classes.ingredientsList}>
          <li className={classes.ingredientItem}>
            0.5 כוס אגוזים לא קלויים טחונים דק
          </li>
          <li className={classes.ingredientItem}>
            0.5 כוס קמח שקדים או שקדים טחונים
          </li>
          <li className={classes.ingredientItem}>2 כפות חמאת בוטנים</li>
          <li className={classes.ingredientItem}>2-3 כפיות מייפל</li>
          <li className={classes.ingredientItem}>לציפוי: קוקוס טחון</li>
        </ul>
      </div>
    </div>
  );
}

export default RecipeDetailScene;
