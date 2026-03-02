import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Calculator,
  Settings,
  Home,
  HelpCircle,
  CalendarDays,
  ShoppingCart,
  Globe,
  BookOpenText,
  BookOpen,
  Menu,
  MessageSquareMore,
  Settings2,
  Tags,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ProductTour } from "../product-tour";
import { useRecipeBook, useLanguage } from "../../context";
import { CategoriesManagement } from "../categories-management";
import { Modal } from "../modal";
import { CloseButton } from "../controls/close-button";
import { BottomSheet } from "../controls/bottom-sheet";
import { CategoriesSheetContent } from "../categories-sheet-content";
import classes from "./navigation.module.css";

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
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [expandedChats, setExpandedChats] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showCategoriesSheet, setShowCategoriesSheet] = useState(false);
  const managementFromSheetRef = useRef(false);
  const [showTour, setShowTour] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isMobileNav, setIsMobileNav] = useState(window.innerWidth <= 768);
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

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsMobileNav(window.innerWidth <= 768);
    };
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

  const toggleChat = (chatId) => {
    setExpandedChats((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  const filteredLinks = links;

  const isAllSelected = selectedCategories.includes("all");
  const selectedCount = isAllSelected ? 0 : selectedCategories.length;
  const isRecipeDetailsPage = location.pathname.startsWith("/recipe/");
  const isGlobalRecipesPage = location.pathname === "/global-recipes";

  return (
    <>
      {!isRecipeDetailsPage && (
        <div className={classes.mobileTopBar}>
          <button className={classes.hamburger} onClick={toggleSidebar}>
            {isOpen ? null : <Menu size={22} />}
          </button>
          <div id="mobile-tabs-portal" className={classes.mobileTabsSlot} />
          <div
            id="mobile-header-actions-portal"
            className={classes.mobileActionsSlot}
          />
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

          <div className={classes.separator}></div>

          {!isGlobalRecipesPage && (
            <>
              <button
                className={classes.navLink}
                onClick={() => {
                  managementFromSheetRef.current = false;
                  setShowManagement(true);
                  closeSidebar();
                }}
              >
                <Settings2 size={18} className={classes.icon} />
                {t("categories", "manage")}
              </button>

              <button
                className={classes.navLink}
                onClick={() => {
                  setShowCategoriesSheet(true);
                  closeSidebar();
                }}
              >
                <Tags size={18} className={classes.icon} />
                {t("nav", "categories")}
              </button>
              <div className={classes.separator}></div>
            </>
          )}
          {/* Chat Log Section */}
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
          <div className={classes.separator}></div>

          {/* <div className={classes.separator}></div> */}

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
          <button className={classes.navLink} onClick={() => setShowHelp(true)}>
            <HelpCircle size={18} className={classes.icon} />
            {t("nav", "help")}
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

      {isOpen && <div className={classes.overlay} onClick={closeSidebar} />}

      {showManagement && (
        <CategoriesManagement
          categories={categories}
          onClose={() => {
            setShowManagement(false);
            if (managementFromSheetRef.current) {
              setShowCategoriesSheet(true);
            }
            managementFromSheetRef.current = false;
          }}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
          onSortAlphabetically={sortCategoriesAlphabetically}
          getGroupContacts={getGroupContacts}
        />
      )}

      {isMobile ? (
        <BottomSheet
          open={showCategoriesSheet}
          onClose={() => setShowCategoriesSheet(false)}
          title={t("nav", "categories")}
        >
          <CategoriesSheetContent
            onManage={() => {
              setShowCategoriesSheet(false);
              managementFromSheetRef.current = true;
              setShowManagement(true);
            }}
          />
        </BottomSheet>
      ) : (
        showCategoriesSheet && (
          <>
            <div
              className={classes.catPopupOverlay}
              onClick={() => setShowCategoriesSheet(false)}
            />
            <div className={classes.catPopup}>
              <div className={classes.catPopupHeader}>
                <span className={classes.catPopupTitle}>
                  {t("nav", "categories")}
                </span>
                <CloseButton
                  className={classes.catPopupClose}
                  onClick={() => setShowCategoriesSheet(false)}
                  size={25}
                />

              </div>
              <CategoriesSheetContent
                onManage={() => {
                  setShowCategoriesSheet(false);
                  managementFromSheetRef.current = true;
                  setShowManagement(true);
                }}
              />
            </div>
          </>
        )
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

      {isMobileNav ? (
        <BottomSheet
          open={showHelp}
          onClose={() => setShowHelp(false)}
          title={t("sidebarHelp", "title")}
        >
          <div
            style={{ padding: "1rem", direction: "rtl", textAlign: "right" }}
          >
            <p>{t("sidebarHelp", "description")}</p>
          </div>
        </BottomSheet>
      ) : (
        showHelp && (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 10199,
              }}
              onClick={() => setShowHelp(false)}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "var(--bg-primary)",
                borderRadius: "14px",
                padding: "1.5rem",
                width: "95vw",
                maxWidth: "400px",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
                zIndex: 10200,
                direction: "rtl",
                textAlign: "right",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <strong style={{ fontSize: "var(--large-font)" }}>
                  {t("sidebarHelp", "title")}
                </strong>
                <CloseButton onClick={() => setShowHelp(false)} />
              </div>
              <p>{t("sidebarHelp", "description")}</p>
            </div>
          </>
        )
      )}

      {showChatHistory &&
        (isMobile ? (
          <Modal onClose={() => setShowChatHistory(false)} maxWidth="480px">
            <div className={classes.chatHistoryContainer}>
              <div className={classes.chatHistoryHeader}>
                <h2 className={classes.chatHistoryTitle}>
                  {t("nav", "chatLog")}
                </h2>
                <CloseButton onClick={() => setShowChatHistory(false)} />
              </div>
              {chatHistory.length === 0 ? (
                <p className={classes.chatHistoryEmpty}>
                  {t("nav", "noChatHistory")}
                </p>
              ) : (
                <div className={classes.chatHistoryBody}>
                  {chatHistory.map((chat) => (
                    <div key={chat.id} className={classes.chatAccordionItem}>
                      <button
                        className={classes.chatHistoryItem}
                        onClick={() => toggleChat(chat.id)}
                      >
                        {chat.question}
                      </button>
                      {expandedChats.has(chat.id) && (
                        <div className={classes.chatAnswer}>
                          <p>{chat.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal>
        ) : (
          <>
            <div
              className={classes.catPopupOverlay}
              onClick={() => setShowChatHistory(false)}
            />
            <div className={classes.catPopup} style={{ maxWidth: "520px" }}>
              <div className={classes.catPopupHeader}>
                <span className={classes.catPopupTitle}>
                  {t("nav", "chatLog")}
                </span>
                <CloseButton
                  className={classes.catPopupClose}
                  onClick={() => setShowChatHistory(false)}
                  size={25}
                />
              </div>
              {chatHistory.length === 0 ? (
                <p className={classes.chatHistoryEmpty}>
                  {t("nav", "noChatHistory")}
                </p>
              ) : (
                <div className={classes.chatHistoryBody}>
                  {chatHistory.map((chat) => (
                    <div key={chat.id} className={classes.chatAccordionItem}>
                      <button
                        className={classes.chatHistoryItem}
                        onClick={() => toggleChat(chat.id)}
                      >
                        {chat.question}
                      </button>
                      {expandedChats.has(chat.id) && (
                        <div className={classes.chatAnswer}>
                          <p>{chat.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ))}
    </>
  );
}

export default Navigation;
