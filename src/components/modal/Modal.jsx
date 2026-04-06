import React, { useEffect, useRef } from "react";
import classes from "./modal.module.css";

function Modal({ children, onClose, className, fullscreen, maxWidth, bottomSheet }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    document.body.classList.add("modal-open");

    if (!fullscreen) {
      return () => {
        document.body.classList.remove("modal-open");
      };
    }

    const scrollY = window.scrollY;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;

    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [fullscreen]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    if (!overlay) return;

    const syncHeight = () => {
      const h = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      overlay.style.height = `${h}px`;
      if (content) content.style.maxHeight = `${h}px`;
    };

    const onFocusIn = (e) => {
      if (e.target.matches("input, textarea, select, [contenteditable]")) {
        setTimeout(() => {
          syncHeight();
          e.target.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 300);
      }
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", syncHeight);
    }
    window.addEventListener("resize", syncHeight);
    overlay.addEventListener("focusin", onFocusIn);

    return () => {
      if (vv) vv.removeEventListener("resize", syncHeight);
      window.removeEventListener("resize", syncHeight);
      overlay.removeEventListener("focusin", onFocusIn);
      overlay.style.height = "";
      if (content) content.style.maxHeight = "";
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !window.getSelection().toString()) {
      onClose();
    }
  };

  return (
    <div ref={overlayRef} className={classes.modalOverlay} onClick={handleOverlayClick}>
      <div
        ref={contentRef}
        className={`${classes.modalContent} ${className || ""} ${fullscreen ? classes.fullscreen : ""} ${bottomSheet ? classes.bottomSheet : ""}`}
        style={maxWidth ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
