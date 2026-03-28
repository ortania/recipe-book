import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_KEY_PREFIX = "scrollPos:";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function getMainEl() {
  return document.querySelector("main");
}

function tryRestore(scrollTop, windowY, attemptsLeft, pageKey) {
  if (attemptsLeft <= 0) {
    console.log(`[ScrollRestore:${pageKey}] FAILED after all retries`);
    return;
  }

  const main = getMainEl();
  if (main) main.scrollTop = scrollTop;
  window.scrollTo(0, windowY);

  const mainOk =
    scrollTop <= 0 || !main || Math.abs(main.scrollTop - scrollTop) < 5;
  const windowOk = windowY <= 0 || Math.abs(window.scrollY - windowY) < 5;

  console.log(`[ScrollRestore:${pageKey}] attempt ${31 - attemptsLeft}: scrollTop=${scrollTop} actual=${main?.scrollTop} scrollHeight=${main?.scrollHeight} mainOk=${mainOk}`);

  if (!mainOk || !windowOk) {
    setTimeout(() => tryRestore(scrollTop, windowY, attemptsLeft - 1, pageKey), 80);
  } else {
    console.log(`[ScrollRestore:${pageKey}] SUCCESS`);
  }
}

export default function useScrollRestore(pageKey) {
  const location = useLocation();

  useEffect(() => {
    const storageKey = SCROLL_KEY_PREFIX + pageKey;
    const currentLocationKey = location.key;

    console.log(`[ScrollRestore:${pageKey}] mount, locationKey=${currentLocationKey}`);

    // Restore only when returning to the same history entry
    try {
      const saved = sessionStorage.getItem(storageKey);
      console.log(`[ScrollRestore:${pageKey}] saved=`, saved);
      if (saved) {
        const { scrollTop, windowY, locationKey } = JSON.parse(saved);
        console.log(`[ScrollRestore:${pageKey}] saved.locationKey=${locationKey}, current=${currentLocationKey}, match=${locationKey === currentLocationKey}`);
        if (locationKey === currentLocationKey) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              tryRestore(scrollTop, windowY, 30, pageKey);
            });
          });
        }
      }
    } catch {}

    const savePosition = () => {
      const main = getMainEl();
      try {
        const data = {
          scrollTop: main ? main.scrollTop : 0,
          windowY: window.scrollY,
          locationKey: currentLocationKey,
        };
        sessionStorage.setItem(storageKey, JSON.stringify(data));
        console.log(`[ScrollRestore:${pageKey}] saved`, data);
      } catch {}
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        savePosition();
      });
    };

    const main = getMainEl();
    if (main) main.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (main) main.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      savePosition();
    };
  }, [pageKey, location.key]);
}
