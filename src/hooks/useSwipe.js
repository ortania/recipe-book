import { useRef } from "react";

const SWIPE_THRESHOLD = 50;

function useSwipe(onSwipeLeft, onSwipeRight) {
  const touchStart = useRef(null);

  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;

    if (Math.abs(diff) < SWIPE_THRESHOLD) return;

    if (diff > 0) {
      onSwipeRight?.();
    } else {
      onSwipeLeft?.();
    }
  };

  return { onTouchStart, onTouchEnd };
}

export default useSwipe;
