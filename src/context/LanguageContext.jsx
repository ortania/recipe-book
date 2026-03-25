import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const RTL_LANGUAGES = ["he", "ar", "fa", "ur", "mixed"];

// Start loading translations immediately (non-blocking)
let _translations = null;
const _translationsPromise = import("../utils/translations").then((m) => {
  _translations = m.default;
});

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "he";
  });
  const [translations, setTranslations] = useState(() => _translations);

  useEffect(() => {
    if (!_translations) {
      _translationsPromise.then(() => setTranslations(_translations));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
    const dir = RTL_LANGUAGES.includes(language) ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = language === "mixed" ? "he" : language;
  }, [language]);

  const t = useCallback(
    (section, key) => {
      if (!translations) return key;
      const entry = translations[section]?.[key];
      if (!entry) return key;
      return entry[language] || entry["en"] || key;
    },
    [language, translations],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
