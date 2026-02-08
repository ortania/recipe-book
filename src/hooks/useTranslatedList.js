import { useState, useEffect } from "react";
import { useLanguage } from "../context";
import translations from "../utils/translations";
import { translateText } from "../utils/translateContent";

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
        if (!name || id === "all" || id === "other") continue;

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
    if (id === "other") {
      return translations.categories?.other?.[language] || originalName;
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

    return originalName;
  };

  const getTranslatedDesc = (item) => {
    if (!item || typeof item === "string") return "";
    const id = item.id;
    const originalDesc = item.description || "";
    if (!originalDesc) return originalDesc;
    if (descTranslations[id]) return descTranslations[id];
    return originalDesc;
  };

  return { getTranslated, getTranslatedDesc };
}

export default useTranslatedList;
