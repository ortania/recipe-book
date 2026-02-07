import React from "react";
import { Modal } from "../modal";
import { RecipesView } from "../recipes/RecipesView";
import { Button } from "../controls/button";
import classes from "./favorites-popup.module.css";

function FavoritesPopup({
  persons,
  groups,
  onClose,
  onEditPerson,
  onDeletePerson,
  groupName = "All Recipes",
}) {
  const favoritePersons = persons.filter((person) => person.isFavorite);

  return (
    <Modal onClose={onClose} className={classes.wideModal}>
      <div className={classes.favoritesContainer}>
        <h2 className={classes.title}>
          Favorite Recipes{" "}
          {groupName !== "All Recipes" ? `in ${groupName}` : ""}
        </h2>

        {favoritePersons.length === 0 ? (
          <p className={classes.noFavorites}>No favorite recipes yet</p>
        ) : (
          <RecipesView
            persons={favoritePersons}
            groups={groups}
            onEditPerson={onEditPerson}
            onDeletePerson={onDeletePerson}
          />
        )}

        <Button
          className={classes.closeButton}
          onClick={onClose}
          variant="primary"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}

export { FavoritesPopup };
