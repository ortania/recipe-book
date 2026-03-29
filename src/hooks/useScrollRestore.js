import { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigationType } from "react-router-dom";

const SCROLL_KEY_PREFIX = "scrollPos:";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function getMainEl() {
  return document.querySelector("main");
}

export default function useScrollRestore(pageKey) {
  const navType = useNavigationType();
  const storageKey = SCROLL_KEY_PREFIX + pageKey;
  const isPop = navType === "POP";

  // posRef: current scroll position, updated by scroll events and by
  // successful restore operations.
  const posRef = useRef({ scrollTop: 0, windowY: 0 });

  // savedRef: set to true in useLayoutEffect cleanup to block any pending rAF
  // scroll-save callbacks from overwriting the correct saved position after
  // navigation has started.
  const savedRef = useRef(false);

  // Read the saved position once at render time for the restore effects.
  const mountScrollRef = useRef(null);
  if (isPop && mountScrollRef.current === null) {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) mountScrollRef.current = JSON.parse(raw);
    } catch {}
  }

  // Synchronous pre-paint restore — fires before the browser paints,
  // so the page never flashes at position 0 when navigating back.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!isPop) return;
    const saved = mountScrollRef.current;
    if (!saved) return;
    const { scrollTop, windowY } = saved;
    const main = getMainEl();
    if (main && scrollTop > 0) {
      main.scrollTop = scrollTop;
      posRef.current.scrollTop = main.scrollTop; // reflect actual (possibly clamped) value
    }
    if (windowY > 0) {
      window.scrollTo(0, windowY);
      posRef.current.windowY = window.scrollY;
    }
  }, []); // intentionally only on mount

  // Post-paint retry — in case content wasn't tall enough for the layout effect
  // (e.g. SharerProfile still loading from Firebase).
  useEffect(() => {
    if (!isPop) return;
    const saved = mountScrollRef.current;
    if (!saved) return;
    const { scrollTop, windowY } = saved;
    if (!scrollTop && !windowY) return;

    let attempts = 0;
    function tryRestore() {
      if (attempts++ >= 30) return;
      const main = getMainEl();
      if (main && scrollTop > 0) {
        main.scrollTop = scrollTop;
        posRef.current.scrollTop = main.scrollTop; // keep posRef in sync
      }
      if (windowY > 0) {
        window.scrollTo(0, windowY);
        posRef.current.windowY = window.scrollY;
      }
      const m = getMainEl();
      const mainOk = !scrollTop || !m || Math.abs(m.scrollTop - scrollTop) < 5;
      const winOk = !windowY || Math.abs(window.scrollY - windowY) < 5;
      if (!mainOk || !winOk) setTimeout(tryRestore, 80);
    }

    requestAnimationFrame(() => requestAnimationFrame(tryRestore));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  // Save in useLayoutEffect cleanup — runs synchronously during React's commit
  // phase, BEFORE async scroll events from the browser's scrollTop auto-
  // adjustment can fire. Also resets savedRef on (re)mount so rAF saves work
  // normally while the user is on the page.
  //
  // THE KEY BUG THIS FIXES: when React commits new (shorter) page content,
  // the browser fires a scroll event to adjust scrollTop. That event queues a
  // rAF callback which would overwrite sessionStorage with the wrong position.
  // Setting savedRef=true here (synchronously, before that rAF can run) causes
  // the rAF to bail out, preserving the correct position we just saved.
  useLayoutEffect(() => {
    savedRef.current = false; // allow rAF saves while on this page
    return () => {
      savedRef.current = true; // block any pending rAF saves from this point on
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(posRef.current));
      } catch {}
    };
  }, [storageKey]);

  // Track scroll position in posRef on every scroll event.
  useEffect(() => {
    const main = getMainEl();
    if (main) posRef.current.scrollTop = main.scrollTop;
    posRef.current.windowY = window.scrollY;

    let ticking = false;
    const onScroll = () => {
      const m = getMainEl();
      posRef.current.scrollTop = m ? m.scrollTop : 0;
      posRef.current.windowY = window.scrollY;

      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (savedRef.current) return; // navigation in progress — skip write
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(posRef.current));
        } catch {}
      });
    };

    const mainEl = getMainEl();
    if (mainEl) mainEl.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (mainEl) mainEl.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [storageKey]);
}
