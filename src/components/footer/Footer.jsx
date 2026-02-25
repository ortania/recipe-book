import { NavLink } from "react-router-dom";
import { Calculator, CalendarDays, ShoppingCart, Globe, BookOpen } from "lucide-react";
import { useLanguage } from "../../context";
import { links } from "../../app/data/navLinks";
import classes from "./footer.module.css";

const iconMap = {
  Categories: BookOpen,
  MealPlanner: CalendarDays,
  ShoppingList: ShoppingCart,
  GlobalRecipes: Globe,
  Conversions: Calculator,
};

const navTranslationMap = {
  Categories: "recipesShort",
  MealPlanner: "mealPlannerShort",
  ShoppingList: "shoppingListShort",
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
              {Icon && <Icon size={20} className={classes.footerIcon} />}
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
