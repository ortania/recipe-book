import React from "react";
import classes from "./add-button.module.css";
import { Button } from "../button";

const AddButton = ({ onClick, children, disabled, className, title }) => {
  return (
    <Button
      className={`${classes.addButton} ${className || ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
};

export default AddButton;
