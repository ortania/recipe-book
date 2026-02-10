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
    if (s.scrollInterval) {
      clearInterval(s.scrollInterval);
    }
    s.items.forEach((item) => {
      item.style.transform = "";
      item.style.transition = "";
      item.style.opacity = "";
      item.classList.remove("touch-drag-over");
    });
    s.active = false;
    s.clone = null;
    s.items = [];
    s.listEl = null;
    s.scrollInterval = null;
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
      clone.style.opacity = "0.85";
      clone.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
      clone.style.borderRadius = "12px";
      clone.style.pointerEvents = "none";
      clone.style.transition = "none";
      clone.style.background = "white";
      document.body.appendChild(clone);

      item.style.opacity = "0.3";

      const s = dragState.current;
      s.active = true;
      s.field = field;
      s.startIndex = index;
      s.currentIndex = index;
      s.startY = touch.clientY;
      s.clone = clone;
      s.items = items;
      s.listEl = list;
      s.itemHeight = rect.height;
      s.initialTop = rect.top;

      // Prevent page scroll while dragging
      e.preventDefault();
    },
    [],
  );

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

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
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
