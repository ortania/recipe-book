import classes from "./add-button.module.css";
import { PiPlusLight, PiMinusLight } from "react-icons/pi";

const AddButton = ({
  onClick,
  type = "plain",
  disabled,
  className,
  title,
  sign,
  children,
}) => {
  return (
    <button
      className={`${classes.addButton} ${classes[type]} ${typeof children === "string" ? classes.withText : ""} ${className || ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {sign === "-" ? <PiMinusLight /> : sign === "+" ? <PiPlusLight /> : null}
      {children}
    </button>
  );
};

export default AddButton;
