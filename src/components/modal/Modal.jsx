import React, { useEffect } from "react";
import classes from "./modal.module.css";

function Modal({ children, onClose, className, fullscreen }) {
  useEffect(() => {
    // Add class to body when modal is open
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

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not when text is selected
    if (e.target === e.currentTarget && !window.getSelection().toString()) {
      onClose();
    }
  };

  return (
    <div className={classes.modalOverlay} onClick={handleOverlayClick}>
      <div
        className={`${classes.modalContent} ${className || ""} ${fullscreen ? classes.fullscreen : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
