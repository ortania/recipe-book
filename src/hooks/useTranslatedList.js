import { useState, useEffect } from "react";
import { useLanguage } from "../context";
import translations from "../utils/translations";
import { translateText } from "../utils/translateContent";

const COMMON_TRANSLATIONS = {
  cakes: { he: "עוגות", ru: "Торты", de: "Kuchen" },
  cookies: { he: "עוגיות", ru: "Печенье", de: "Kekse" },
  cake: { he: "עוגה", ru: "Торт", de: "Kuchen" },
  cookie: { he: "עוגייה", ru: "Печенье", de: "Keks" },
  soups: { he: "מרקים", ru: "Супы", de: "Suppen" },
  soup: { he: "מרק", ru: "Суп", de: "Suppe" },
  drinks: { he: "משקאות", ru: "Напитки", de: "Getränke" },
  snacks: { he: "חטיפים", ru: "Закуски", de: "Snacks" },
  breakfast: { he: "ארוחת בוקר", ru: "Завтрак", de: "Frühstück" },
  pasta: { he: "פסטה", ru: "Паста", de: "Pasta" },
  fish: { he: "דגים", ru: "Рыба", de: "Fisch" },
  meat: { he: "בשר", ru: "Мясо", de: "Fleisch" },
  chicken: { he: "עוף", ru: "Курица", de: "Hähnchen" },
  rice: { he: "אורז", ru: "Рис", de: "Reis" },
  sauces: { he: "רטבים", ru: "Соусы", de: "Soßen" },
  appetizers: { he: "מנות ראשונות", ru: "Закуски", de: "Vorspeisen" },
  smoothies: { he: "שייקים", ru: "Смузи", de: "Smoothies" },
};

const CATEGORY_KEY_MAP = {
  salads: "cat_salads",
  main: "cat_mainDishes",
  "side-dishes": "cat_sideDishes",
  desserts: "cat_desserts",
  bread: "cat_bread",
  veganism: "cat_veganism",
  healthy: "cat_healthy",
  kids: "cat_kids",
  try: "cat_try",
};

function useTranslatedList(items, key = "name") {
  const { language } = useLanguage();
  const [apiTranslations, setApiTranslations] = useState({});
  const [descTranslations, setDescTranslations] = useState({});

  useEffect(() => {
    if (!items || items.length === 0) return;

    let cancelled = false;

    const translateUnknown = async () => {
      const nameResults = {};
      const descResults = {};
      for (const item of items) {
        if (!item || typeof item === "string") continue;
        const id = item.id;
        const name = item[key];
        const desc = item.description;
        if (!name || id === "all" || id === "general") continue;

        if (!CATEGORY_KEY_MAP[id]) {
          const translated = await translateText(name, language);
          if (cancelled) return;
          if (translated !== name) {
            nameResults[id] = translated;
          }
        }

        if (desc) {
          const translatedDesc = await translateText(desc, language);
          if (cancelled) return;
          if (translatedDesc !== desc) {
            descResults[id] = translatedDesc;
          }
        }
      }
      if (!cancelled) {
        setApiTranslations(nameResults);
        setDescTranslations(descResults);
      }
    };

    setApiTranslations({});
    setDescTranslations({});
    translateUnknown();

    return () => {
      cancelled = true;
    };
  }, [items?.length, language, key]);

  const getTranslated = (item) => {
    if (!item) return "";
    const id = typeof item === "string" ? item : item.id;
    const originalName = typeof item === "string" ? item : item[key];

    // Virtual categories
    if (id === "all") {
      return translations.categories?.all?.[language] || originalName;
    }
    if (id === "general") {
      return translations.categories?.general?.[language] || originalName;
    }

    // Known default categories — use static translations
    const translationKey = CATEGORY_KEY_MAP[id];
    if (translationKey) {
      const entry = translations.categories?.[translationKey];
      if (entry && entry[language]) {
        return entry[language];
      }
    }

    // User-created categories — use API translation
    if (apiTranslations[id]) {
      return apiTranslations[id];
    }

    // Fallback: common English category names
    const commonKey = originalName?.toLowerCase?.();
    if (
      commonKey &&
      COMMON_TRANSLATIONS[commonKey] &&
      COMMON_TRANSLATIONS[commonKey][language]
    ) {
      return COMMON_TRANSLATIONS[commonKey][language];
    }

    return originalName;
  };

  const DESC_KEY_MAP = {
    all: "desc_all",
    general: "desc_general",
    salads: "desc_salads",
    main: "desc_mainDishes",
    "side-dishes": "desc_sideDishes",
    desserts: "desc_desserts",
    bread: "desc_bread",
    veganism: "desc_veganism",
    healthy: "desc_healthy",
    kids: "desc_kids",
    try: "desc_try",
  };

  const getTranslatedDesc = (item) => {
    if (!item || typeof item === "string") return "";
    const id = item.id;
    const originalDesc = item.description || "";
    if (!originalDesc) return originalDesc;

    // Known categories — use static translations
    const descKey = DESC_KEY_MAP[id];
    if (descKey) {
      const entry = translations.categories?.[descKey];
      if (entry && entry[language]) {
        return entry[language];
      }
    }

    // User-created categories — use API translation
    if (descTranslations[id]) return descTranslations[id];
    return originalDesc;
  };

  return { getTranslated, getTranslatedDesc };
}

export default useTranslatedList;
