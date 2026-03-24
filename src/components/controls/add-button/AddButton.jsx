import btnClasses from "../../../styles/shared/buttons.module.css";
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
  const typeClass =
    type === "circle" ? btnClasses.iconCircle :
    type === "circlePrimary" ? btnClasses.iconCirclePrimary : "";

  return (
    <button
      className={[
        btnClasses.btnBase,
        btnClasses.closeBtn,
        typeClass,
        typeof children === "string" ? btnClasses.withText : "",
        className || "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {sign === "-" ? (
        <Minus size="1.5em" strokeWidth={STROKE} />
      ) : sign === "+" ? (
        <Plus size="1.5em" strokeWidth={STROKE} />
      ) : null}
      {children}
    </button>
  );
};

export default AddButton;
