import { useState, useEffect } from "react";
import { useLanguage } from "../context";
import { translateText } from "../utils/translateContent";

function useTranslatedText(text) {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    if (!text) {
      setTranslated(text);
      return;
    }

    if (language === "he" || language === "mixed") {
      setTranslated(text);
      return;
    }

    let cancelled = false;

    translateText(text, language).then((result) => {
      if (!cancelled) {
        setTranslated(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [text, language]);

  return translated;
}

export default useTranslatedText;
