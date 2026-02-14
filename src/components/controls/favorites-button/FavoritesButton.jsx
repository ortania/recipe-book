import React from "react";
import classes from "./favorites-button.module.css";
import { Button } from "../button";

function FavoritesButton({ onClick, children, disabled, className, title }) {
  return (
    <Button
      className={`${classes.favoritesButton} ${className || ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children || "★ Favorites"}
    </Button>
  );
}

export default FavoritesButton;
