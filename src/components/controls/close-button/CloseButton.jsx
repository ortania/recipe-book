import { X } from "lucide-react";
import classes from "./close-button.module.css";

const CloseButton = ({ onClick, type = "plain", className, title }) => {
  return (
    <button
      className={`${classes.closeButton} ${classes[type]} ${className || ""}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      <X size={20} />
    </button>
  );
};

export default CloseButton;
