import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import translations, { RTL_LANGUAGES } from "../utils/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "he";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    const dir = RTL_LANGUAGES.includes(language) ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = language === "mixed" ? "he" : language;
  }, [language]);

  const t = useCallback(
    (section, key) => {
      const entry = translations[section]?.[key];
      if (!entry) return key;
      return entry[language] || entry["en"] || key;
    },
    [language],
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
