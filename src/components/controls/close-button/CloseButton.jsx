import { IoMdClose } from "react-icons/io";
import classes from "./close-button.module.css";

const CloseButton = ({ onClick, type = "plain", className, title }) => {
  return (
    <button
      className={`${classes.closeButton} ${classes[type]} ${className || ""}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      <IoMdClose />
    </button>
  );
};

export default CloseButton;
