import React from "react";
import classes from "./view-toggle-button.module.css";
import { Button } from "../button";

const ViewToggleButton = ({ isSimpleView, onClick, disabled, className }) => {
  return (
    <Button
      className={`${classes.viewToggleButton} ${className || ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={
        isSimpleView ? "Switch to detailed view" : "Switch to simple view"
      }
      title={isSimpleView ? "Switch to detailed view" : "Switch to simple view"}
    >
      {isSimpleView ? "Detailed View" : "Simple View"}
    </Button>
  );
};

export default ViewToggleButton;
