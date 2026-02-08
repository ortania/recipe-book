import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaList,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaComments,
  FaChevronDown,
  FaChevronUp,
  FaCalculator,
} from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import { RxHamburgerMenu } from "react-icons/rx";
import { FiHome } from "react-icons/fi";
import { MdOutlineChat } from "react-icons/md";
import { useRecipeBook, useLanguage } from "../../context";
import classes from "./navigation.module.css";

const iconMap = {
  // Home: FaHome,
  Home: FiHome,
  Categories: FaList,
  Conversions: FaCalculator,
  Settings: IoSettingsOutline,
};

const navTranslationMap = {
  Home: "home",
  Categories: "categories",
  Conversions: "conversions",
  Settings: "settings",
};

function Navigation({ onLogout, links }) {
  const navigate = useNavigate();
  const { logout, currentUser } = useRecipeBook();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

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
        <div>
          <span className={classes.logo}>Cook</span>
          <span className={classes.logoTail}>book</span>
        </div>

        {links.map((el) => {
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

        <div className={classes.chatLogSection}>
          <MdOutlineChat className={classes.icon} />
          {t("nav", "chatLog")}
        </div>

        {chatHistory.length > 0 && (
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

        <NavLink
          to="/settings"
          onClick={closeSidebar}
          className={({ isActive }) =>
            `${classes.navLink} ${classes.settingsLink} ${isActive ? classes.active : ""}`
          }
        >
          <IoSettingsOutline className={classes.icon} />
          {t("nav", "settings")}
        </NavLink>

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
      </nav>

      {isOpen && <div className={classes.overlay} onClick={closeSidebar} />}

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
              <button
                onClick={() => setSelectedChat(null)}
                className={classes.closePopup}
              >
                ✕
              </button>
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
