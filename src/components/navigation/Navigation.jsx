import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useRecipeBook, useLanguage, useRadio } from "../../context";
import classes from "./navigation.module.css";

import { NavigationContext } from "./NavigationContext";
import NavigationSidebar from "./NavigationSidebar";
const NavigationModals = lazy(() => import("./NavigationModals"));

function Navigation({ onLogout, links }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    logout, currentUser, categories, recipes,
    selectedCategories, toggleCategory, clearCategorySelection,
    addCategory, editCategory, deleteCategory, reorderCategories,
    sortCategoriesAlphabetically,
  } = useRecipeBook();
  const { t } = useLanguage();
  const { toggleRadio, showRadio } = useRadio();

  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [expandedChats, setExpandedChats] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showCategoriesSheet, setShowCategoriesSheet] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isMobileNav, setIsMobileNav] = useState(window.innerWidth <= 768);
  const managementFromSheetRef = useRef(false);
  const navScrollableRef = useRef(null);

  const validGroupIds = new Set(
    categories.filter((g) => g.id !== "all" && g.id !== "general").map((g) => g.id),
  );

  const getGroupContacts = (groupId) => {
    if (groupId === "all") {
      const seen = new Set();
      return recipes.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
    }
    if (groupId === "general") {
      return recipes.filter(
        (r) =>
          !r.categories ||
          r.categories.length === 0 ||
          !r.categories.some((catId) => validGroupIds.has(catId)),
      );
    }
    return recipes.filter((r) => r.categories && r.categories.includes(groupId));
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
      if (e.key === "chatMessages") loadChatHistory();
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(loadChatHistory, 1000);

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsMobileNav(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);

    let touchStartX = 0;
    let touchStartY = 0;
    const SWIPE_THRESHOLD = 60;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (window.innerWidth > 768) return;
      if (window.location.pathname.startsWith("/recipe/")) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = Math.abs(touchEndY - touchStartY);
      if (diffY > Math.abs(diffX)) return;

      const isRTL = document.documentElement.dir === "rtl";
      if (isRTL) {
        if (diffX < -SWIPE_THRESHOLD && touchStartX > window.innerWidth - 40) {
          setIsOpen(true);
          document.body.classList.add("sidebar-open");
        } else if (diffX > SWIPE_THRESHOLD) {
          setIsOpen(false);
          document.body.classList.remove("sidebar-open");
        }
      } else {
        if (diffX > SWIPE_THRESHOLD && touchStartX < 40) {
          setIsOpen(true);
          document.body.classList.add("sidebar-open");
        } else if (diffX < -SWIPE_THRESHOLD) {
          setIsOpen(false);
          document.body.classList.remove("sidebar-open");
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    const handleToggleSidebar = () => {
      setIsOpen((prev) => {
        const next = !prev;
        if (next) document.body.classList.add("sidebar-open");
        else document.body.classList.remove("sidebar-open");
        return next;
      });
    };
    window.addEventListener("toggle-sidebar", handleToggleSidebar);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("toggle-sidebar", handleToggleSidebar);
      document.body.classList.remove("sidebar-open");
    };
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) document.body.classList.add("sidebar-open");
    else document.body.classList.remove("sidebar-open");
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

  const isAllSelected = selectedCategories.includes("all");
  const selectedCount = isAllSelected ? 0 : selectedCategories.length;
  const isRecipeDetailsPage = location.pathname.startsWith("/recipe/");
  const isGlobalRecipesPage = location.pathname === "/global-recipes";
  const isSharerProfilePage = location.pathname.startsWith("/sharer/");
  const isSettingsPage = location.pathname === "/settings";

  const contextValue = {
    isOpen, closeSidebar, toggleSidebar, navScrollableRef,
    filteredLinks: links,
    isMobile, isMobileNav,
    showChatHistory, setShowChatHistory,
    showManagement, setShowManagement,
    showCategoriesSheet, setShowCategoriesSheet,
    showTour, setShowTour,
    showHelp, setShowHelp,
    chatHistory, expandedChats, toggleChat,
    managementFromSheetRef,
    isAllSelected, selectedCount,
    isRecipeDetailsPage, isGlobalRecipesPage, isSharerProfilePage, isSettingsPage,
    handleLogout, toggleRadio, showRadio,
    currentUser,
    categories, addCategory, editCategory, deleteCategory,
    reorderCategories, sortCategoriesAlphabetically, getGroupContacts,
    classes, t,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {!isRecipeDetailsPage && !isSettingsPage && (
        <div id="mobile-top-bar" className={classes.mobileTopBar}>
          <button className={classes.hamburger} onClick={toggleSidebar}>
            {isOpen ? null : <Menu size={22} />}
          </button>
          <div id="mobile-tabs-portal" className={classes.mobileTabsSlot} />
          <div id="mobile-header-actions-portal" className={classes.mobileActionsSlot} />
        </div>
      )}

      <NavigationSidebar />

      {isOpen && <div className={classes.overlay} onClick={closeSidebar} />}

      <Suspense fallback={null}><NavigationModals /></Suspense>
    </NavigationContext.Provider>
  );
}

export default Navigation;
