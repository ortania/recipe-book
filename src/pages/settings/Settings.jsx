import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiSun, FiMoon } from "react-icons/fi";
import {
  Palette,
  Accessibility,
  ShieldCheck,
  Globe,
  ChevronDown,
  UserCog,
  LogOut,
  Trash2,
} from "lucide-react";
import { applyFontScale } from "../../utils/applyFontScale";
import { getStoredTheme, applyTheme } from "../../utils/theme";
import { useLanguage, useRecipeBook } from "../../context";
import {
  updateUserProfile,
  getPrimaryAuthProvider,
  deleteAccount,
} from "../../firebase/authService";
import { CloseButton } from "../../components/controls/close-button";
import { Modal } from "../../components/modal";
import { LANGUAGES, RTL_LANGUAGES } from "../../utils/translations";
import buttonClasses from "../../styles/shared/buttons.module.css";
import classes from "./settings.module.css";

const DEFAULT_SCALE = 1;
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.8;
const STEP = 0.1;

function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, logout } = useRecipeBook();
  const navigate = useNavigate();
  const [openSetting, setOpenSetting] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem("fontScale");
    return saved ? parseFloat(saved) : DEFAULT_SCALE;
  });

  const [theme, setTheme] = useState(getStoredTheme);

  const [publicProfile, setPublicProfile] = useState(
    () => currentUser?.publicProfile || false,
  );

  const handlePublicProfileToggle = async () => {
    const next = !publicProfile;
    setPublicProfile(next);
    if (currentUser?.uid) {
      try {
        await updateUserProfile(currentUser.uid, { publicProfile: next });
      } catch (err) {
        setPublicProfile(!next);
      }
    }
  };

  useEffect(() => {
    document.body.classList.add("hide-footer");
    return () => document.body.classList.remove("hide-footer");
  }, []);

  useEffect(() => {
    applyFontScale(scale);
    localStorage.setItem("fontScale", scale.toString());
  }, [scale]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleReset = () => {
    setScale(DEFAULT_SCALE);
  };

  const isRtl = RTL_LANGUAGES.includes(language);

  const currentLang = LANGUAGES.find((l) => l.code === language);
  const currentThemeLabel =
    theme === "dark" ? t("settings", "darkMode") : t("settings", "lightMode");

  const closePanel = () => setOpenSetting(null);

  const provider = getPrimaryAuthProvider();
  const isGoogleUser = provider === "google.com";
  const isPasswordUser = provider === "password";

  const openDeleteModal = () => {
    setDeleteConfirmText("");
    setDeletePassword("");
    setDeleteError("");
    setDeleting(false);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
  };

  const canConfirmDelete =
    deleteConfirmText.trim().toUpperCase() === "DELETE" &&
    (!isPasswordUser || deletePassword.length > 0);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!canConfirmDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount({
        password: isPasswordUser ? deletePassword : undefined,
      });
      setDeleteModalOpen(false);
      try {
        await logout();
      } catch {}
    } catch (err) {
      console.error("Delete account failed:", err);
      if (err?.code === "auth/wrong-password") {
        setDeleteError(t("settings", "deleteWrongPassword"));
      } else if (err?.code === "auth/missing-password") {
        setDeleteError(t("settings", "deleteWrongPassword"));
      } else {
        setDeleteError(
          err?.message
            ? `${t("settings", "deleteFailed")} (${err.message})`
            : t("settings", "deleteFailed"),
        );
      }
      setDeleting(false);
    }
  };

  const settingItems = [
    {
      id: "accessibility",
      icon: <Accessibility size={20} />,
      label: t("settings", "accessibility"),
      value: `×${scale.toFixed(1)}`,
    },
    {
      id: "privacy",
      icon: <ShieldCheck size={20} />,
      label: t("settings", "privacy"),
      value: publicProfile
        ? t("settings", "publicProfile")
        : t("settings", "privateProfileLabel"),
    },
    {
      id: "account",
      icon: <UserCog size={20} />,
      label: t("settings", "account"),
      value: currentUser?.email || "",
    },
  ];

  return (
    <div className={classes.settingsPage}>
      <div className={classes.header}>
        <h1 className={classes.title}>{t("settings", "title")}</h1>
        <CloseButton
          onClick={() => navigate(-1)}
          title={t("common", "close")}
        />
      </div>

      <div className={classes.settingsList}>
        {settingItems.map((item) => (
          <div key={item.id}>
            <button
              className={`${classes.settingItem} ${
                openSetting === item.id ? classes.settingItemOpen : ""
              }`}
              onClick={() =>
                setOpenSetting(openSetting === item.id ? null : item.id)
              }
            >
              <span className={classes.settingItemIcon}>{item.icon}</span>
              <span className={classes.settingItemContent}>
                <span className={classes.settingItemLabel}>{item.label}</span>
                <span className={classes.settingItemValue}>{item.value}</span>
              </span>
              <ChevronDown
                className={`${classes.settingItemChevron} ${
                  openSetting === item.id ? classes.chevronOpen : ""
                }`}
                size={20}
              />
            </button>

            {openSetting === "accessibility" && item.id === "accessibility" && (
              <div className={classes.expandedPanel}>
                <div className={classes.fontSizeControl}>
                  <div className={classes.fontSizeLabel}>
                    {t("settings", "fontSize")}
                  </div>
                  <div className={classes.fontSizeSlider}>
                    <span className={classes.sliderLabel}>א</span>
                    <input
                      type="range"
                      min={MIN_SCALE}
                      max={MAX_SCALE}
                      step={STEP}
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      className={classes.slider}
                    />
                    <span className={classes.sliderLabelLarge}>א</span>
                  </div>
                  <div className={classes.scaleValue}>×{scale.toFixed(1)}</div>
                  <div className={classes.previewBox}>
                    <div className={classes.previewTitle}>
                      {t("settings", "preview")}
                    </div>
                    <div className={classes.previewText}>
                      {t("settings", "previewText")}
                    </div>
                  </div>
                  {scale !== DEFAULT_SCALE && (
                    <button
                      className={classes.resetButton}
                      onClick={handleReset}
                    >
                      {t("settings", "resetFont")} (×1.0)
                    </button>
                  )}
                </div>
              </div>
            )}

            {openSetting === "privacy" && item.id === "privacy" && (
              <div className={classes.expandedPanel}>
                <label className={classes.privacyToggle}>
                  <input
                    type="checkbox"
                    checked={publicProfile}
                    onChange={handlePublicProfileToggle}
                    className={`${classes.privacyCheckbox} ${buttonClasses.checkBox}`}
                  />
                  <div className={classes.privacyContent}>
                    <span className={classes.privacyLabel}>
                      {t("settings", "publicProfile")}
                    </span>
                    <span className={classes.privacyDesc}>
                      {t("settings", "publicProfileDesc")}
                    </span>
                  </div>
                </label>
              </div>
            )}

            {openSetting === "account" && item.id === "account" && (
              <div className={classes.expandedPanel}>
                {currentUser?.email && (
                  <div className={classes.accountInfo}>
                    <span className={classes.accountInfoLabel}>
                      {t("settings", "signedInAs")}
                    </span>
                    <span className={classes.accountInfoEmail}>
                      {currentUser.email}
                    </span>
                  </div>
                )}
                <div className={classes.accountActions}>
                  <button
                    type="button"
                    className={classes.accountBtn}
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>{t("settings", "logOut")}</span>
                  </button>
                  <div className={classes.accountDivider} />
                  <button
                    type="button"
                    className={`${classes.accountBtn} ${classes.accountBtnDanger}`}
                    onClick={openDeleteModal}
                  >
                    <Trash2 size={18} />
                    <span>{t("settings", "deleteAccount")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={classes.privacyRow}>
        <Link to="/privacy" className={classes.privacyLink}>
          מדיניות פרטיות
        </Link>
        <span className={classes.privacySep}>·</span>
        <Link to="/terms" className={classes.privacyLink}>
          תנאי שימוש
        </Link>
      </div>

      {openSetting === "language" && (
        <Modal onClose={closePanel} maxWidth="420px">
          <div className={classes.modalHeader}>
            <h2 className={classes.modalTitle}>{t("settings", "language")}</h2>
            <CloseButton onClick={closePanel} />
          </div>
          <div className={classes.modalBody}>
            <div className={classes.languageGrid}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className={`${classes.languageButton} ${
                    language === lang.code ? classes.languageButtonActive : ""
                  }`}
                  onClick={() => setLanguage(lang.code)}
                >
                  <span className={classes.languageFlag}>{lang.flag}</span>
                  <span className={classes.languageName}>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {openSetting === "appearance" && (
        <Modal onClose={closePanel} maxWidth="420px">
          <div className={classes.modalHeader}>
            <h2 className={classes.modalTitle}>
              {t("settings", "appearance")}
            </h2>
            <CloseButton onClick={closePanel} />
          </div>
          <div className={classes.modalBody}>
            <div className={classes.themeToggle}>
              <button
                className={`${classes.themeBtn} ${
                  theme === "light" ? classes.themeBtnActive : ""
                }`}
                onClick={() => handleThemeChange("light")}
              >
                <FiSun />
                <span>{t("settings", "lightMode")}</span>
              </button>
              <button
                className={`${classes.themeBtn} ${
                  theme === "dark" ? classes.themeBtnActive : ""
                }`}
                onClick={() => handleThemeChange("dark")}
              >
                <FiMoon />
                <span>{t("settings", "darkMode")}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteModalOpen && (
        <Modal onClose={closeDeleteModal} maxWidth="420px">
          <div className={classes.modalHeader}>
            <h2 className={classes.modalTitle}>
              <Trash2 size={20} />
              <span>{t("settings", "deleteAccount")}</span>
            </h2>
            <CloseButton onClick={closeDeleteModal} />
          </div>
          <div className={classes.modalBody}>
            <div className={classes.deleteModalBody}>
              <p className={classes.deleteWarning}>
                {t("settings", "deleteAccountWarning")}
              </p>
              {isGoogleUser && (
                <p className={classes.deleteHint}>
                  {t("settings", "deleteAccountGoogleHint")}
                </p>
              )}

              <div className={classes.deleteField}>
                <label className={classes.deleteFieldLabel}>
                  {t("settings", "typeDeleteToConfirm")}
                </label>
                <input
                  type="text"
                  className={classes.deleteInput}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="DELETE"
                  disabled={deleting}
                />
              </div>

              {isPasswordUser && (
                <div className={classes.deleteField}>
                  <label className={classes.deleteFieldLabel}>
                    {t("settings", "currentPassword")}
                  </label>
                  <input
                    type="password"
                    className={classes.deleteInput}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={deleting}
                  />
                </div>
              )}

              {deleteError && (
                <p className={classes.deleteError}>{deleteError}</p>
              )}

              <div className={classes.deleteActions}>
                <button
                  type="button"
                  className={classes.accountBtn}
                  onClick={closeDeleteModal}
                  disabled={deleting}
                >
                  {t("settings", "cancel")}
                </button>
                <button
                  type="button"
                  className={`${classes.accountBtn} ${classes.accountBtnDanger}`}
                  onClick={handleDeleteAccount}
                  disabled={!canConfirmDelete || deleting}
                >
                  {deleting
                    ? t("settings", "deleteInProgress")
                    : t("settings", "confirmDelete")}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Settings;
