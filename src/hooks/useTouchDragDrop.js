import { useRef, useCallback } from "react";

export function useTouchDragDrop(onReorder) {
  const dragState = useRef({
    active: false,
    field: null,
    startIndex: null,
    currentIndex: null,
    startY: 0,
    clone: null,
    items: [],
    listEl: null,
    scrollInterval: null,
  });

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
      s.sourceItem.style.border = "";
      s.sourceItem.style.background = "";
      s.sourceItem = null;
    }
    s.active = false;
    s.clone = null;
    s.indicator = null;
    s.items = [];
    s.listEl = null;
    s.scrollInterval = null;
  }, []);

  const handleTouchStart = useCallback((e, index, field, listRef) => {
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
    clone.style.background = "var(--bg-card, white)";
    clone.style.border = "2px solid var(--clr-success)";
    clone.style.transform = "scale(1.02)";
    document.body.appendChild(clone);

    // Drop indicator line
    const indicator = document.createElement("div");
    indicator.style.position = "absolute";
    indicator.style.left = "0";
    indicator.style.right = "0";
    indicator.style.height = "3px";
    indicator.style.background = "var(--clr-success)";
    indicator.style.borderRadius = "2px";
    indicator.style.zIndex = "99998";
    indicator.style.display = "none";
    indicator.style.pointerEvents = "none";
    // Add dot decorations on ends
    indicator.style.boxShadow =
      "-4px 0 0 0 var(--clr-success-bg), 4px 0 0 0 var(--clr-success-bg)";
    list.style.position = "relative";
    list.appendChild(indicator);

    item.style.opacity = "0.3";
    item.style.border = "2px dashed var(--border-color, #ccc)";
    item.style.background = "var(--bg-tertiary, #f5f5f5)";

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

    // Prevent page scroll while dragging
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback((e) => {
    const s = dragState.current;
    if (!s.active) return;

    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = touch.clientY - s.startY;

    // Move clone
    s.clone.style.top = `${s.initialTop + deltaY}px`;

    // Auto-scroll near edges
    const scrollContainer = findScrollParent(s.listEl);
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const edgeZone = 50;

      if (s.scrollInterval) {
        clearInterval(s.scrollInterval);
        s.scrollInterval = null;
      }

      if (touch.clientY < containerRect.top + edgeZone) {
        s.scrollInterval = setInterval(() => {
          scrollContainer.scrollTop -= 8;
        }, 16);
      } else if (touch.clientY > containerRect.bottom - edgeZone) {
        s.scrollInterval = setInterval(() => {
          scrollContainer.scrollTop += 8;
        }, 16);
      }
    }

    // Determine which item we're over
    let newIndex = s.startIndex;
    for (let i = 0; i < s.items.length; i++) {
      const itemRect = s.items[i].getBoundingClientRect();
      const midY = itemRect.top + itemRect.height / 2;
      if (touch.clientY > midY) {
        newIndex = i;
      }
    }

    if (newIndex !== s.currentIndex) {
      s.currentIndex = newIndex;
      // Visual feedback: shift items
      s.items.forEach((item, i) => {
        if (i === s.startIndex) return;
        const shift =
          i > s.startIndex && i <= newIndex
            ? -s.itemHeight
            : i < s.startIndex && i >= newIndex
              ? s.itemHeight
              : 0;
        item.style.transition = "transform 0.15s ease";
        item.style.transform = shift ? `translateY(${shift}px)` : "";
      });
    }

    // Position the drop indicator line
    if (s.indicator && newIndex !== s.startIndex) {
      s.indicator.style.display = "block";
      const targetItem = s.items[newIndex];
      if (targetItem) {
        const targetRect = targetItem.getBoundingClientRect();
        const listRect = s.listEl.getBoundingClientRect();
        const y =
          newIndex > s.startIndex
            ? targetRect.bottom - listRect.top + s.listEl.scrollTop
            : targetRect.top - listRect.top + s.listEl.scrollTop;
        s.indicator.style.top = `${y - 1}px`;
      }
    } else if (s.indicator) {
      s.indicator.style.display = "none";
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const s = dragState.current;
      if (!s.active) return;

      const fromIndex = s.startIndex;
      const toIndex = s.currentIndex;

      cleanUp();

      if (fromIndex !== toIndex && s.field != null) {
        onReorder(fromIndex, toIndex, s.field);
      }
    },
    [onReorder, cleanUp],
  );

  const isActive = useCallback(() => dragState.current.active, []);

  return { handleTouchStart, handleTouchMove, handleTouchEnd, isActive };
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
