import { NavLink } from "react-router-dom";
import { FaCalculator } from "react-icons/fa";
import { FiCalendar, FiShoppingCart, FiGlobe } from "react-icons/fi";
import { MdMenuBook } from "react-icons/md";
import { useLanguage } from "../../context";
import { links } from "../../app/data/navLinks";
import classes from "./footer.module.css";

const iconMap = {
  Categories: MdMenuBook,
  MealPlanner: FiCalendar,
  ShoppingList: FiShoppingCart,
  GlobalRecipes: FiGlobe,
  Conversions: FaCalculator,
};

const navTranslationMap = {
  Categories: "recipes",
  MealPlanner: "mealPlanner",
  ShoppingList: "shoppingList",
  GlobalRecipes: "globalRecipes",
  Conversions: "conversions",
};

/**
 * Footer component
 * @returns JSX of component
 */
export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className={classes.footer}>
      <nav className={classes.footerNav}>
        {links.map((el) => {
          const Icon = iconMap[el.name];
          return (
            <NavLink
              key={el.name}
              to={el.link}
              className={({ isActive }) =>
                `${classes.footerLink} ${isActive ? classes.active : ""}`
              }
            >
              {Icon && <Icon className={classes.footerIcon} />}
              <span className={classes.footerLabel}>
                {t("nav", navTranslationMap[el.name] || el.name.toLowerCase())}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </footer>
  );
}
