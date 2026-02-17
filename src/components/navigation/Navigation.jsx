import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaCalculator,
} from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import { RxHamburgerMenu } from "react-icons/rx";
import {
  FiHome,
  FiHelpCircle,
  FiCalendar,
  FiShoppingCart,
  FiGlobe,
} from "react-icons/fi";
import { MdRestaurant, MdMenuBook } from "react-icons/md";
import { AnimatePresence } from "framer-motion";
import { ProductTour } from "../product-tour";
import { PiPlusLight } from "react-icons/pi";
import { useRecipeBook, useLanguage } from "../../context";
import { CategoriesManagement } from "../categories-management";
import useTranslatedList from "../../hooks/useTranslatedList";
import { CloseButton } from "../controls/close-button";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { SearchBox } from "../controls/search";
import classes from "./navigation.module.css";

const iconMap = {
  Home: FiHome,
  Categories: MdMenuBook,
  MealPlanner: FiCalendar,
  ShoppingList: FiShoppingCart,
  GlobalRecipes: FiGlobe,
  Conversions: FaCalculator,
  Settings: IoSettingsOutline,
};

const navTranslationMap = {
  Home: "home",
  Categories: "recipes",
  MealPlanner: "mealPlanner",
  ShoppingList: "shoppingList",
  GlobalRecipes: "globalRecipes",
  Conversions: "conversions",
  Settings: "settings",
};

function Navigation({ onLogout, links }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    logout,
    currentUser,
    categories,
    recipes,
    selectedCategories,
    toggleCategory,
    clearCategorySelection,
    addCategory,
    editCategory,
    deleteCategory,
    reorderCategories,
  } = useRecipeBook();
  const { t } = useLanguage();
  const { getTranslated } = useTranslatedList(categories, "name");
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [chatLogOpen, setChatLogOpen] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const getGroupContacts = (groupId) => {
    if (groupId === "all") return recipes;
    if (groupId === "general") {
      return recipes.filter(
        (recipe) => !recipe.categories || recipe.categories.length === 0,
      );
    }
    return recipes.filter(
      (recipe) => recipe.categories && recipe.categories.includes(groupId),
    );
  };

  const loadChatHistory = () => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      const messages = JSON.parse(savedMessages);
      const userQuestions = messages
        .filter((msg) => msg.role === "user")
        .map((msg, index) => ({
          id: index,
          question: msg.content,
          answer: messages[messages.indexOf(msg) + 1]?.content || "",
        }));
      setChatHistory(userQuestions);
    } else {
      setChatHistory([]);
    }
  };

  useEffect(() => {
    loadChatHistory();

    const handleStorageChange = (e) => {
      if (e.key === "chatMessages") {
        loadChatHistory();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(loadChatHistory, 1000);

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);

    // Swipe gesture for hamburger menu on mobile
    let touchStartX = 0;
    let touchStartY = 0;
    const SWIPE_THRESHOLD = 60;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (window.innerWidth > 768) return;
      // Disable hamburger swipe on recipe detail/cooking pages (tabs use swipe there)
      if (window.location.pathname.startsWith("/recipe/")) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = Math.abs(touchEndY - touchStartY);
      if (diffY > Math.abs(diffX)) return; // vertical scroll, ignore

      const isRTL = document.documentElement.dir === "rtl";
      if (isRTL) {
        // RTL: swipe left opens, swipe right closes
        if (diffX < -SWIPE_THRESHOLD && touchStartX > window.innerWidth - 40) {
          setIsOpen(true);
          document.body.classList.add("sidebar-open");
        } else if (diffX > SWIPE_THRESHOLD) {
          setIsOpen(false);
          document.body.classList.remove("sidebar-open");
        }
      } else {
        // LTR: swipe right opens, swipe left closes
        if (diffX > SWIPE_THRESHOLD && touchStartX < 40) {
          setIsOpen(true);
          document.body.classList.add("sidebar-open");
        } else if (diffX < -SWIPE_THRESHOLD) {
          setIsOpen(false);
          document.body.classList.remove("sidebar-open");
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/login");
  };

  const toggleSidebar = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
  };

  const closeSidebar = () => {
    setIsOpen(false);
    document.body.classList.remove("sidebar-open");
  };

  const filteredLinks = links;

  const isAllSelected = selectedCategories.includes("all");
  const selectedCount = isAllSelected ? 0 : selectedCategories.length;
  const isRecipeDetailsPage = location.pathname.startsWith("/recipe/");

  return (
    <>
      {!isRecipeDetailsPage && (
        <div className={classes.mobileTopBar}>
          <button className={classes.hamburger} onClick={toggleSidebar}>
            {isOpen ? <IoMdClose /> : <RxHamburgerMenu />}
          </button>
          <div className={classes.mobileLogo}>
            <span className={classes.logo}>Cook</span>
            <span className={classes.logoTail}>book</span>
          </div>
        </div>
      )}

      <nav className={`${classes.nav} ${isOpen ? classes.open : ""}`}>
        <div className={classes.navScrollable}>
          <div className={classes.desktopOnly}>
            <span className={classes.logo}>Cook</span>
            <span className={classes.logoTail}>book</span>
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
                  {Icon && <Icon className={classes.icon} />}
                  {t(
                    "nav",
                    navTranslationMap[el.name] || el.name.toLowerCase(),
                  )}
                </NavLink>
              );
            })}
          </div>

          {(isMobile || location.pathname === "/categories") && (
            <>
              <div className={classes.separator}></div>

              <div className={classes.categoryActions}>
                <button
                  className={classes.categoryActionBtn}
                  onClick={() => setShowManagement(true)}
                  title={t("categories", "manage")}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 3.5H5.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 8.5H2.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.5 5C4.32843 5 5 4.32843 5 3.5C5 2.67157 4.32843 2 3.5 2C2.67157 2 2 2.67157 2 3.5C2 4.32843 2.67157 5 3.5 5Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>{" "}
                  {t("categories", "manage")}
                </button>
              </div>

              {/* Categories Section */}
              <div className={classes.sectionHeader}>
                <button
                  className={classes.sectionHeaderBtn}
                  onClick={() =>
                    !isMobile && setCategoriesOpen(!categoriesOpen)
                  }
                >
                  <span>
                    {t("nav", "categories").toUpperCase()}
                    {!categorySearch && selectedCount > 0 && (
                      <span className={classes.sectionCount}>
                        ({selectedCount})
                      </span>
                    )}
                  </span>
                  {!isMobile &&
                    (categoriesOpen ? (
                      <FaChevronUp className={classes.chevron} />
                    ) : (
                      <FaChevronDown className={classes.chevron} />
                    ))}
                </button>
                {!isAllSelected && selectedCount > 0 && (
                  <button
                    className={classes.clearCategoriesBtn}
                    onClick={clearCategorySelection}
                    title={t("categories", "clearAllFilters")}
                  >
                    ✕
                  </button>
                )}
              </div>

              {(categoriesOpen || isMobile) && (
                <div className={classes.categoryList}>
                  <div className={classes.categorySearchWrap}>
                    <SearchBox
                      searchTerm={categorySearch}
                      onSearchChange={(val) => {
                        setCategorySearch(val);
                        if (!val) clearCategorySelection();
                      }}
                      placeholder={t("categories", "searchCategory")}
                      size="small"
                      className={classes.categorySearchBox}
                    />
                  </div>
                  {categories
                    .filter((group) => {
                      if (!categorySearch.trim()) return true;
                      const term = categorySearch.trim().toLowerCase();
                      const name =
                        group.id === "all"
                          ? t("categories", "allRecipes").toLowerCase()
                          : (getTranslated(group) || "").toLowerCase();
                      return name.includes(term);
                    })
                    .map((group) => {
                      const isSelected = selectedCategories.includes(group.id);
                      return (
                        <button
                          key={group.id}
                          className={`${classes.categoryItem} ${isSelected ? classes.categoryActive : ""}`}
                          onClick={() => toggleCategory(group.id)}
                          style={{
                            borderColor: group.color,
                            backgroundColor: isSelected
                              ? `${group.color}22`
                              : "transparent",
                            color: isSelected ? group.color : undefined,
                          }}
                        >
                          <span className={classes.categoryLabel}>
                            {(() => {
                              const IconComp =
                                group.id === "all"
                                  ? MdRestaurant
                                  : getCategoryIcon(group.icon);
                              return (
                                <span
                                  className={classes.categoryIconWrap}
                                  style={{
                                    backgroundColor: `${group.color}22`,
                                    color: group.color,
                                  }}
                                >
                                  <IconComp />
                                </span>
                              );
                            })()}
                            {group.id === "all"
                              ? t("categories", "allRecipes")
                              : getTranslated(group)}
                          </span>
                          <span className={classes.categoryCount}>
                            {getGroupContacts(group.id).length}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>

        <div className={classes.navBottom}>
          <div className={classes.separator}></div>

          {/* Chat Log Section */}
          <button
            className={classes.navLink}
            onClick={() => setChatLogOpen(!chatLogOpen)}
          >
            <svg
              width="24"
              height="20"
              viewBox="0 0 24 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={classes.icon}
            >
              <path
                d="M20 12.2V13.9C20 17.05 18.2 18.4 15.5 18.4H6.5C3.8 18.4 2 17.05 2 13.9V8.5C2 5.35 3.8 4 6.5 4H9.2C9.07 4.38 9 4.8 9 5.25V9.15002C9 10.12 9.32 10.94 9.89 11.51C10.46 12.08 11.28 12.4 12.25 12.4V13.79C12.25 14.3 12.83 14.61 13.26 14.33L16.15 12.4H18.75C19.2 12.4 19.62 12.33 20 12.2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 5.25V9.15002C22 10.64 21.24 11.76 20 12.2C19.62 12.33 19.2 12.4 18.75 12.4H16.15L13.26 14.33C12.83 14.61 12.25 14.3 12.25 13.79V12.4C11.28 12.4 10.46 12.08 9.89 11.51C9.32 10.94 9 10.12 9 9.15002V5.25C9 4.8 9.07 4.38 9.2 4C9.64 2.76 10.76 2 12.25 2H18.75C20.7 2 22 3.3 22 5.25Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 18.4004V22.0004"
                stroke="currentColor"
                strokeWidth="2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.4961 7.25H18.5051"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15.6953 7.25H15.7043"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.8945 7.25H12.9035"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("nav", "chatLog")}
            {chatLogOpen ? (
              <FaChevronUp
                className={classes.chevron}
                style={{ marginInlineStart: "auto" }}
              />
            ) : (
              <FaChevronDown
                className={classes.chevron}
                style={{ marginInlineStart: "auto" }}
              />
            )}
          </button>

          {chatLogOpen && chatHistory.length > 0 && (
            <div className={classes.chatHistoryList}>
              {chatHistory.slice(0, 5).map((chat) => (
                <button
                  key={chat.id}
                  className={classes.chatHistoryItem}
                  onClick={() => setSelectedChat(chat)}
                >
                  {chat.question.substring(0, 40)}...
                </button>
              ))}
            </div>
          )}

          <button
            className={classes.navLink}
            onClick={() => {
              closeSidebar();
              setShowTour(true);
            }}
          >
            <FiHelpCircle className={classes.icon} />
            {t("home", "showTutorial")}
          </button>
          <NavLink
            to="/settings"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `${classes.navLink} ${isActive ? classes.active : ""}`
            }
          >
            <IoSettingsOutline className={classes.icon} />
            {t("nav", "settings")}
          </NavLink>
          <div className={classes.separator}></div>
          <button className={classes.logoutButton} onClick={handleLogout}>
            <FaSignOutAlt className={classes.icon} />
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

      {isOpen && <div className={classes.overlay} onClick={closeSidebar} />}

      {showManagement && (
        <CategoriesManagement
          categories={categories}
          onClose={() => setShowManagement(false)}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
          getGroupContacts={getGroupContacts}
        />
      )}

      <AnimatePresence>
        {showTour && (
          <ProductTour
            onClose={() => {
              setShowTour(false);
              localStorage.setItem("tourCompleted", "true");
            }}
          />
        )}
      </AnimatePresence>

      {selectedChat && (
        <div
          className={classes.chatPopupOverlay}
          onClick={() => setSelectedChat(null)}
        >
          <div
            className={classes.chatPopup}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={classes.chatPopupHeader}>
              <h3>{t("nav", "chatHistory")}</h3>
              <CloseButton
                onClick={() => setSelectedChat(null)}
                type="plain"
                className={classes.closePopup}
              />
            </div>
            <div className={classes.chatPopupContent}>
              <div className={classes.chatQuestion}>
                <strong>Question:</strong>
                <p>{selectedChat.question}</p>
              </div>
              <div className={classes.chatAnswer}>
                <strong>Answer:</strong>
                <p>{selectedChat.answer}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navigation;
