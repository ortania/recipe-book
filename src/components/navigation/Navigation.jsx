import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  ChevronDown,
  ChevronUp,
  Calculator,
  Settings,
  Home,
  HelpCircle,
  CalendarDays,
  ShoppingCart,
  Globe,
  BookOpen,
  BookOpenText,
  UtensilsCrossed,
  LayoutGrid,
  Menu,
  MessageSquareMore,
  Settings2,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ProductTour } from "../product-tour";
import { useRecipeBook, useLanguage } from "../../context";
import { CategoriesManagement } from "../categories-management";
import useTranslatedList from "../../hooks/useTranslatedList";
import { CloseButton } from "../controls/close-button";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { SearchBox } from "../controls/search";
import classes from "./navigation.module.css";

const iconMap = {
  Home: Home,
  Categories: BookOpenText,
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
    sortCategoriesAlphabetically,
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
  const navScrollableRef = useRef(null);

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
      document.body.classList.remove("sidebar-open");
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
            {isOpen ? null : <Menu size={22} />}
          </button>
          <div className={classes.mobileLogo}>
            <span className={classes.logo}>Cooki</span>
            <span className={classes.logoTail}>Pal</span>
          </div>
        </div>
      )}

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

              {location.pathname !== "/global-recipes" && (
                <>
                  <div className={classes.categoryActions}>
                    <button
                      className={classes.categoryActionBtn}
                      onClick={() => setShowManagement(true)}
                      title={t("categories", "manage")}
                    >
                      <Settings2 size={16} className={classes.icon} />

                      {t("categories", "manage")}
                    </button>
                  </div>

                  <div className={classes.sectionHeader}>
                    <button
                      className={classes.sectionHeaderBtn}
                      onClick={() =>
                        !isMobile && setCategoriesOpen(!categoriesOpen)
                      }
                    >
                      <span>
                        <LayoutGrid size={16} />
                        {t("nav", "categories").toUpperCase()}
                        {!categorySearch && selectedCount > 0 && (
                          <span className={classes.sectionCount}>
                            ({selectedCount})
                          </span>
                        )}
                      </span>
                      {!isMobile &&
                        (categoriesOpen ? (
                          <ChevronUp size={14} className={classes.chevron} />
                        ) : (
                          <ChevronDown size={14} className={classes.chevron} />
                        ))}
                    </button>
                    {!isAllSelected && selectedCount > 0 && (
                      <button
                        className={classes.clearCategoriesBtn}
                        onClick={clearCategorySelection}
                        title={t("categories", "clearAllFilters")}
                      >
                        {t("categories", "clear")}
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
                          const isSelected = selectedCategories.includes(
                            group.id,
                          );
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
                                      ? UtensilsCrossed
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
            </>
          )}
        </div>

        <div className={classes.navGradient} />
        <div className={classes.navBottom}>
          <div className={classes.separator}></div>

          {/* Chat Log Section */}
          <button
            className={classes.navLink}
            onClick={() => setChatLogOpen(!chatLogOpen)}
          >
            <MessageSquareMore size={18} className={classes.icon} />
            {t("nav", "chatLog")}
            {chatLogOpen ? (
              <ChevronUp
                size={14}
                className={classes.chevron}
                style={{ marginInlineStart: "auto" }}
              />
            ) : (
              <ChevronDown
                size={14}
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
            <HelpCircle size={18} className={classes.icon} />
            {t("home", "showTutorial")}
          </button>
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

      {isOpen && <div className={classes.overlay} onClick={closeSidebar} />}

      {showManagement && (
        <CategoriesManagement
          categories={categories}
          onClose={() => setShowManagement(false)}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
          onSortAlphabetically={sortCategoriesAlphabetically}
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
