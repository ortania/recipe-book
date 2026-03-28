import { useRef, useCallback, useEffect } from "react";

export function useTouchDragDrop(onReorder) {
  const dragState = useRef({
    active: false,
    field: null,
    startIndex: null,
    currentIndex: null,
    startY: 0,
    clone: null,
    items: [],
    itemRects: [],
    listEl: null,
    scrollInterval: null,
    scrollOffset: 0,
  });

  const onReorderRef = useRef(onReorder);
  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  const cleanUp = useCallback(() => {
    const s = dragState.current;
    if (s.clone && s.clone.parentNode) {
      s.clone.parentNode.removeChild(s.clone);
    }
    if (s.indicator && s.indicator.parentNode) {
      s.indicator.parentNode.removeChild(s.indicator);
    }
    if (s.scrollInterval) {
      clearInterval(s.scrollInterval);
    }
    s.items.forEach((item) => {
      item.style.transform = "";
      item.style.transition = "";
      item.style.opacity = "";
      item.classList.remove("touch-drag-over");
    });
    if (s.sourceItem) {
      s.sourceItem.style.opacity = "";
      s.sourceItem.style.background = "";
      s.sourceItem.style.userSelect = "";
      s.sourceItem.style.webkitUserSelect = "";
      s.sourceItem = null;
    }
    document.removeEventListener("touchmove", s._onMove);
    document.removeEventListener("touchend", s._onEnd);
    document.removeEventListener("touchcancel", s._onEnd);

    if (s._disabledEls) {
      const els = s._disabledEls;
      const blockClick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      document.addEventListener("click", blockClick, true);
      setTimeout(() => {
        els.forEach((el) => { el.style.pointerEvents = ""; });
        document.removeEventListener("click", blockClick, true);
      }, 350);
      s._disabledEls = null;
    }

    s.active = false;
    s.clone = null;
    s.indicator = null;
    s.items = [];
    s.itemRects = [];
    s.listEl = null;
    s.scrollInterval = null;
    s.scrollOffset = 0;
    s._onMove = null;
    s._onEnd = null;
  }, []);

  const handleTouchStart = useCallback(
    (e, index, field, listRef) => {
      const handle = e.currentTarget;
      const item = handle.closest("[data-drag-item]");
      if (!item) return;

      const list = listRef?.current || item.parentNode;
      const items = Array.from(list.querySelectorAll("[data-drag-item]"));
      const rect = item.getBoundingClientRect();
      const touch = e.touches[0];

      const clone = item.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.zIndex = "99999";
      clone.style.opacity = "0.9";
      clone.style.boxShadow = "0 6px 24px rgba(0,0,0,0.18)";
      clone.style.borderRadius = "12px";
      clone.style.pointerEvents = "none";
      clone.style.transition = "none";
      clone.style.background = "var(--clr-bg-card, #fff)";
      clone.style.border = "1px solid var(--clr-brown-500, #948585)";
      clone.style.transform = "scale(1.03)";
      document.body.appendChild(clone);

      const indicator = document.createElement("div");
      indicator.style.position = "fixed";
      indicator.style.height = "4px";
      indicator.style.background = "#948585";
      indicator.style.zIndex = "100000";
      indicator.style.display = "none";
      indicator.style.pointerEvents = "none";
      indicator.style.boxShadow =
        "0 0 8px 1px rgba(99,85,85,0.45), -6px 0 0 0 #948585, 6px 0 0 0 #948585";
      document.body.appendChild(indicator);

      item.style.opacity = "0.3";
      item.style.background = "var(--clr-brown-50, #faf7f7)";

      const s = dragState.current;
      s.active = true;
      s.field = field;
      s.startIndex = index;
      s.currentIndex = index;
      s.startY = touch.clientY;
      s.clone = clone;
      s.indicator = indicator;
      s.sourceItem = item;
      s.items = items;
      s.listEl = list;
      s.itemHeight = rect.height;
      s.initialTop = rect.top;
      s.itemRects = items.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      });
      s.scrollOffset = 0;

      const onMove = (ev) => {
        const st = dragState.current;
        if (!st.active) return;

        ev.preventDefault();
        const t = ev.touches[0];
        const deltaY = t.clientY - st.startY;

        st.clone.style.top = `${st.initialTop + deltaY}px`;

        const scrollContainer = findScrollParent(st.listEl);
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const edgeZone = 50;

          if (st.scrollInterval) {
            clearInterval(st.scrollInterval);
            st.scrollInterval = null;
          }

          if (t.clientY < containerRect.top + edgeZone) {
            st.scrollInterval = setInterval(() => {
              const before = scrollContainer.scrollTop;
              scrollContainer.scrollTop -= 6;
              st.scrollOffset += scrollContainer.scrollTop - before;
            }, 16);
          } else if (t.clientY > containerRect.bottom - edgeZone) {
            st.scrollInterval = setInterval(() => {
              const before = scrollContainer.scrollTop;
              scrollContainer.scrollTop += 6;
              st.scrollOffset += scrollContainer.scrollTop - before;
            }, 16);
          }
        }

        const fingerY = t.clientY + st.scrollOffset;
        let newIndex = st.startIndex;
        for (let i = 0; i < st.itemRects.length; i++) {
          const midY = st.itemRects[i].top + st.itemRects[i].height / 2;
          if (fingerY > midY) {
            newIndex = i;
          }
        }

        if (newIndex !== st.currentIndex) {
          st.currentIndex = newIndex;
          const srcH = st.itemRects[st.startIndex].height;
          st.items.forEach((itm, i) => {
            if (i === st.startIndex) return;
            const shift =
              i > st.startIndex && i <= newIndex
                ? -srcH
                : i < st.startIndex && i >= newIndex
                  ? srcH
                  : 0;
            itm.style.transition = "transform 0.2s ease";
            itm.style.transform = shift ? `translateY(${shift}px)` : "";
          });
        }

        if (st.indicator && newIndex !== st.startIndex) {
          const listRect = st.listEl.getBoundingClientRect();
          const cachedY =
            newIndex > st.startIndex
              ? st.itemRects[newIndex].bottom
              : st.itemRects[newIndex].top;
          const viewportY = cachedY - st.scrollOffset;
          st.indicator.style.display = "block";
          st.indicator.style.top = `${viewportY - 2}px`;
          st.indicator.style.left = `${listRect.left}px`;
          st.indicator.style.width = `${listRect.width}px`;
        } else if (st.indicator) {
          st.indicator.style.display = "none";
        }
      };

      const onEnd = () => {
        const st = dragState.current;
        if (!st.active) return;

        const fromIndex = st.startIndex;
        const toIndex = st.currentIndex;

        cleanUp();

        justFinishedRef.current = true;
        setTimeout(() => {
          justFinishedRef.current = false;
        }, 300);

        if (fromIndex !== toIndex && st.field != null) {
          onReorderRef.current(fromIndex, toIndex, st.field);
        }
      };

      s._onMove = onMove;
      s._onEnd = onEnd;

      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd);
      document.addEventListener("touchcancel", onEnd);
    },
    [cleanUp],
  );

  const longPressRef = useRef(null);

  const cancelLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current.timer);
      if (longPressRef.current.moveHandler) {
        document.removeEventListener("touchmove", longPressRef.current.moveHandler);
        document.removeEventListener("touchend", longPressRef.current.endHandler);
        document.removeEventListener("touchcancel", longPressRef.current.endHandler);
      }
      if (longPressRef.current.item) {
        longPressRef.current.item.style.transition = "";
        longPressRef.current.item.style.transform = "";
        longPressRef.current.item.style.userSelect = "";
        longPressRef.current.item.style.webkitUserSelect = "";
        if (longPressRef.current.contextMenuHandler) {
          longPressRef.current.item.removeEventListener("contextmenu", longPressRef.current.contextMenuHandler);
        }
      }
      if (longPressRef.current.disabledEls) {
        longPressRef.current.disabledEls.forEach((el) => {
          el.style.pointerEvents = "";
        });
      }
      longPressRef.current = null;
    }
  }, []);

  const handleLongPressStart = useCallback(
    (e, index, field, listRef) => {
      if (dragState.current.active) return;
      cancelLongPress();

      const item = e.currentTarget.closest
        ? e.currentTarget.closest("[data-drag-item]") || e.currentTarget
        : e.currentTarget;
      if (!item.hasAttribute("data-drag-item")) return;

      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      const focusable = item.querySelectorAll("input, textarea, select, [contenteditable]");
      const allInteractive = item.querySelectorAll("input, textarea, select, [contenteditable], button, a");
      focusable.forEach((el) => { el.style.pointerEvents = "none"; });
      if (document.activeElement && item.contains(document.activeElement)) {
        document.activeElement.blur();
      }

      item.style.userSelect = "none";
      item.style.webkitUserSelect = "none";

      item.style.transition = "transform 0.2s ease";
      item.style.transform = "scale(0.98)";

      const lp = {
        item, index, field, listRef, timer: null, moveHandler: null, endHandler: null,
        disabledEls: Array.from(focusable),
        allInteractive: Array.from(allInteractive),
      };

      const cancel = () => {
        cancelLongPress();
      };

      lp.moveHandler = (ev) => {
        const t = ev.touches[0];
        if (Math.abs(t.clientX - startX) > 8 || Math.abs(t.clientY - startY) > 8) {
          cancel();
        }
      };
      lp.endHandler = cancel;
      lp.contextMenuHandler = (ev) => { ev.preventDefault(); };
      item.addEventListener("contextmenu", lp.contextMenuHandler);

      lp.timer = setTimeout(() => {
        document.removeEventListener("touchmove", lp.moveHandler);
        document.removeEventListener("touchend", lp.endHandler);
        document.removeEventListener("touchcancel", lp.endHandler);
        item.removeEventListener("contextmenu", lp.contextMenuHandler);
        item.style.transition = "";
        item.style.transform = "";
        longPressRef.current = null;

        lp.allInteractive.forEach((el) => { el.style.pointerEvents = "none"; });

        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }

        if (navigator.vibrate) navigator.vibrate(30);

        dragState.current._disabledEls = lp.allInteractive;

        const syntheticTouches = [{ clientX: startX, clientY: startY }];
        const syntheticEvent = {
          currentTarget: item,
          touches: syntheticTouches,
          preventDefault: () => {},
        };
        handleTouchStart(syntheticEvent, index, field, listRef);
      }, 400);

      document.addEventListener("touchmove", lp.moveHandler, { passive: true });
      document.addEventListener("touchend", lp.endHandler);
      document.addEventListener("touchcancel", lp.endHandler);
      longPressRef.current = lp;
    },
    [handleTouchStart, cancelLongPress],
  );

  const justFinishedRef = useRef(false);
  const isActive = useCallback(() => dragState.current.active, []);
  const justFinished = useCallback(() => justFinishedRef.current, []);

  return { handleTouchStart, handleLongPressStart, isActive, justFinished, justFinishedRef };
}

function findScrollParent(el) {
  let node = el;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (
      style.overflow === "auto" ||
      style.overflow === "scroll" ||
      style.overflowY === "auto" ||
      style.overflowY === "scroll"
    ) {
      return node;
    }
    node = node.parentNode;
  }
  return null;
}
