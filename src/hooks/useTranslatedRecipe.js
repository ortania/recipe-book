import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context";
import { translateRecipeContent } from "../utils/translateContent";

function useTranslatedRecipe(recipe) {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState(recipe);
  const [isTranslating, setIsTranslating] = useState(false);
  const recipeRef = useRef(recipe);

  // Keep ref updated
  useEffect(() => {
    recipeRef.current = recipe;
  }, [recipe]);

  useEffect(() => {
    if (!recipe) return;

    if (language === "he" || language === "mixed") {
      setTranslated(recipe);
      setIsTranslating(false);
      return;
    }

    let cancelled = false;
    setIsTranslating(true);

    translateRecipeContent(recipe, language)
      .then((result) => {
        if (!cancelled) {
          setTranslated(result);
          setIsTranslating(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTranslated(recipe);
          setIsTranslating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [recipe, language]);

  return { translated, isTranslating };
}

export default useTranslatedRecipe;
