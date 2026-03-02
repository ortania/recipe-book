import { X } from "lucide-react";
import classes from "./close-button.module.css";

const CloseButton = ({ onClick, type = "plain", className, title, size=20 }) => {
  return (
    <button
      className={`${classes.closeButton} ${classes[type]} ${className || ""}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      <X size={size} />
    </button>
  );
};

export default CloseButton;
