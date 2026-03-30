import {
  LogOut,
  Calculator,
  Settings,
  Home,
  HelpCircle,
  CalendarDays,
  ShoppingCart,
  Globe,
  BookOpen,
  Menu,
  MessageSquareMore,
  Tags,
  Music,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { CloseButton } from "../controls/close-button";
import { useNavigation } from "./NavigationContext";

const iconMap = {
  Home: Home,
  Categories: BookOpen,
  MealPlanner: CalendarDays,
  ShoppingList: ShoppingCart,
  GlobalRecipes: Globe,
  Conversions: Calculator,
  Settings: Settings,
};

const navTranslationMap = {
  Home: "home",
  Categories: "recipes",
  MealPlanner: "mealPlanner",
  ShoppingList: "shoppingList",
  GlobalRecipes: "globalRecipesFull",
  Conversions: "conversions",
  Settings: "settings",
};

export default function NavigationSidebar() {
  const {
    isOpen,
    closeSidebar,
    navScrollableRef,
    filteredLinks,
    isGlobalRecipesPage,
    isSharerProfilePage,
    showRadio,
    toggleRadio,
    setShowChatHistory,
    setShowCategoriesSheet,
    setShowHelp,
    setShowTour,
    currentUser,
    handleLogout,
    classes,
    t,
  } = useNavigation();

  return (
    <nav className={`${classes.nav} ${isOpen ? classes.open : ""}`}>
      <div ref={navScrollableRef} className={classes.navScrollable}>
        <div className={classes.mobileCloseRow}>
          <CloseButton
            onClick={closeSidebar}
            type="plain"
            className={classes.sidebarCloseBtn}
          />
        </div>
        <div className={classes.desktopOnly}>
          <span className={classes.logo}>Cooki</span>
          <span className={classes.logoTail}>Pal</span>
        </div>

        <div className={classes.desktopOnly}>
          {filteredLinks.map((el) => {
            const Icon = iconMap[el.name];
            return (
              <NavLink
                key={el.name}
                to={el.link}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `${classes.navLink} ${isActive ? classes.active : ""}`
                }
              >
                {Icon && <Icon size={18} className={classes.icon} />}
                {t("nav", navTranslationMap[el.name] || el.name.toLowerCase())}
              </NavLink>
            );
          })}
        </div>

        <div className={classes.separator}></div>

        {!isGlobalRecipesPage && (
          <>
            <button
              className={classes.navLink}
              onClick={() => {
                if (isSharerProfilePage) {
                  window.dispatchEvent(new Event("open-categories-sheet"));
                } else {
                  setShowCategoriesSheet(true);
                }
                closeSidebar();
              }}
            >
              <Tags size={18} className={classes.icon} />
              {t("nav", "categories")}
            </button>
            <div className={classes.separator}></div>
          </>
        )}

        <button
          className={classes.navLink}
          onClick={() => {
            setShowChatHistory(true);
            closeSidebar();
          }}
        >
          <MessageSquareMore size={18} className={classes.icon} />
          {t("nav", "chatLog")}
        </button>
        <div className={classes.separator}></div>
      </div>

      <div className={classes.navGradient} />
      <div className={classes.navBottom}>
        <button
          className={`${classes.navLink} ${showRadio ? classes.active : ""}`}
          onClick={() => {
            toggleRadio();
            closeSidebar();
          }}
        >
          <Music size={18} className={classes.icon} />
          {t("radio", "title")}
        </button>

        <div className={classes.separator}></div>

        <button className={classes.navLink} onClick={() => setShowHelp(true)}>
          <HelpCircle size={18} className={classes.icon} />
          {t("nav", "help")}
        </button>
        <button
          className={classes.navLink}
          onClick={() => {
            closeSidebar();
            setShowTour(true);
          }}
        >
          <HelpCircle size={18} className={classes.icon} />
          {t("home", "showTutorial")}
        </button>

        <div className={classes.separator}></div>
        <NavLink
          to="/settings"
          onClick={closeSidebar}
          className={({ isActive }) =>
            `${classes.navLink} ${isActive ? classes.active : ""}`
          }
        >
          <Settings size={18} className={classes.icon} />
          {t("nav", "settings")}
        </NavLink>
        <div className={classes.separator}></div>
        <button className={classes.logoutButton} onClick={handleLogout}>
          <LogOut size={18} className={classes.icon} />
          <span className={classes.logoutText}>
            {t("nav", "logout")}
            {currentUser && (
              <span className={classes.userName}>
                {currentUser.displayName || currentUser.email}
              </span>
            )}
          </span>
        </button>
      </div>
    </nav>
  );
}
