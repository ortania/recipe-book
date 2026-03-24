import { useState, useEffect } from "react";
import { X } from "lucide-react";
import btnClasses from "../../../styles/shared/buttons.module.css";

export const CLOSE_DESKTOP_SIZE = 25;
export const CLOSE_MOBILE_SIZE = 20;

const MOBILE_BREAKPOINT = 768;

const CloseButton = ({
  onClick,
  type = "plain",
  className,
  title,
  size = null,
}) => {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const resolvedSize =
    size ?? (isMobile ? CLOSE_MOBILE_SIZE : CLOSE_DESKTOP_SIZE);

  return (
    <button
      className={[
        btnClasses.btnBase,
        btnClasses.closeBtn,
        type === "circle" ? btnClasses.closeBtnCircle : "",
        className || "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      title={title}
      type="button"
    >
      <X size={resolvedSize} />
    </button>
  );
};

export default CloseButton;
