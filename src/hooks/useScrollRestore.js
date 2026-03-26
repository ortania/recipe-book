import { useEffect, useRef } from "react";
import { useNavigationType } from "react-router-dom";

const SCROLL_KEY_PREFIX = "scrollPos:";

function getMainEl() {
  return document.querySelector("main");
}

function tryRestore(main, scrollTop, windowY, attemptsLeft) {
  if (attemptsLeft <= 0) return;

  if (main) main.scrollTop = scrollTop;
  window.scrollTo(0, windowY);

  const actual = main ? main.scrollTop : window.scrollY;
  const target = main ? scrollTop : windowY;

  if (target > 0 && actual < target - 5) {
    setTimeout(() => tryRestore(main, scrollTop, windowY, attemptsLeft - 1), 100);
  }
}

export default function useScrollRestore(pageKey) {
  const navType = useNavigationType();
  const restoredRef = useRef(false);

  useEffect(() => {
    const main = getMainEl();
    const storageKey = SCROLL_KEY_PREFIX + pageKey;

    if (navType === "POP" && !restoredRef.current) {
      restoredRef.current = true;
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const { scrollTop, windowY } = JSON.parse(saved);
          setTimeout(() => tryRestore(main, scrollTop, windowY, 10), 50);
        }
      } catch {}
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify({
              scrollTop: main ? main.scrollTop : 0,
              windowY: window.scrollY,
            })
          );
        } catch {}
      });
    };

    if (main) main.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (main) main.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pageKey, navType]);
}
