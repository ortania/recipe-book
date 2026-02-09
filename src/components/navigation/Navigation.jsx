import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaCalculator,
} from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import { RxHamburgerMenu } from "react-icons/rx";
import { FiHome } from "react-icons/fi";
import { MdOutlineChat } from "react-icons/md";
import { PiPlusLight } from "react-icons/pi";
import { MdSettings } from "react-icons/md";
import { useRecipeBook, useLanguage } from "../../context";
import { CategoriesManagement } from "../categories-management";
import useTranslatedList from "../../hooks/useTranslatedList";
import { CloseButton } from "../controls/close-button";
import classes from "./navigation.module.css";

const iconMap = {
  Home: FiHome,
  Conversions: FaCalculator,
  Settings: IoSettingsOutline,
};

const navTranslationMap = {
  Home: "home",
  Conversions: "conversions",
  Settings: "settings",
};

function Navigation({ onLogout, links }) {
  const navigate = useNavigate();
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
  const [chatLogOpen, setChatLogOpen] = useState(false);
  const [showManagement, setShowManagement] = useState(false);

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

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
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

  // Filter out "Categories" from nav links since we show them inline
  const filteredLinks = links.filter((el) => el.name !== "Categories");

  const isAllSelected = selectedCategories.includes("all");
  const selectedCount = isAllSelected ? 0 : selectedCategories.length;

  return (
    <>
      <button className={classes.hamburger} onClick={toggleSidebar}>
        {isOpen ? <IoMdClose /> : <RxHamburgerMenu />}
      </button>

      <div className={classes.mobileLogo}>
        <span className={classes.logo}>Cook</span>
        <span className={classes.logoTail}>book</span>
      </div>

      <nav className={`${classes.nav} ${isOpen ? classes.open : ""}`}>
        <div className={classes.navScrollable}>
          <div>
            <span className={classes.logo}>Cook</span>
            <span className={classes.logoTail}>book</span>
          </div>

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
                {t("nav", navTranslationMap[el.name] || el.name.toLowerCase())}
              </NavLink>
            );
          })}

          <div className={classes.separator}></div>

          {/* Categories Section */}
          <button
            className={classes.sectionHeader}
            onClick={() => setCategoriesOpen(!categoriesOpen)}
          >
            <span>
              {t("nav", "categories").toUpperCase()}
              {selectedCount > 0 && (
                <span className={classes.sectionCount}>({selectedCount})</span>
              )}
            </span>
            {categoriesOpen ? (
              <FaChevronUp className={classes.chevron} />
            ) : (
              <FaChevronDown className={classes.chevron} />
            )}
          </button>

          {categoriesOpen && (
            <div className={classes.categoryList}>
              {categories.map((group) => {
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
                    {group.id === "all"
                      ? t("categories", "allRecipes")
                      : getTranslated(group)}
                    {isSelected && group.id !== "all" && (
                      <span
                        className={classes.categoryDot}
                        style={{ background: group.color }}
                      />
                    )}
                  </button>
                );
              })}

              <div className={classes.categoryActions}>
                {/* <button
                  className={classes.categoryActionBtn}
                  onClick={() => setShowManagement(true)}
                  title={t("categories", "add")}
                >
                  <PiPlusLight /> {t("categories", "add")}
                </button> */}
                <button
                  className={classes.categoryActionBtn}
                  onClick={() => setShowManagement(true)}
                  title={t("categories", "manage")}
                >
                  <MdSettings /> {t("categories", "manage")}
                </button>
              </div>
            </div>
          )}

          <div className={classes.separator}></div>

          {/* Chat Log Section */}
          <button
            className={classes.sectionHeader}
            onClick={() => setChatLogOpen(!chatLogOpen)}
          >
            <span>
              <MdOutlineChat className={classes.sectionIcon} />
              {t("nav", "chatLog")}
            </span>
            {chatLogOpen ? (
              <FaChevronUp className={classes.chevron} />
            ) : (
              <FaChevronDown className={classes.chevron} />
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
        </div>

        <div className={classes.navBottom}>
          <div className={classes.separator}></div>
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
