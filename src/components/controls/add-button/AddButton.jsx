import classes from "./add-button.module.css";
import { Plus, Minus } from "lucide-react";

const STROKE = 1.5;

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
      {sign === "-" ? (
        <Minus size="1em" strokeWidth={STROKE} />
      ) : sign === "+" ? (
        <Plus size="1em" strokeWidth={STROKE} />
      ) : null}
      {children}
    </button>
  );
};

export default AddButton;
