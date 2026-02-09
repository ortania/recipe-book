import React from "react";
import { Modal } from "../modal";
import { RecipesView } from "../recipes/RecipesView";
import { Button } from "../controls/button";
import { useLanguage } from "../../context";
import classes from "./favorites-popup.module.css";
import { CloseButton } from "../controls";

function FavoritesPopup({
  persons,
  groups,
  onClose,
  onEditPerson,
  onDeletePerson,
  groupName = "All Recipes",
}) {
  const { t } = useLanguage();
  const favoritePersons = persons.filter((person) => person.isFavorite);

  return (
    <Modal onClose={onClose} className={classes.wideModal}>
      <div className={classes.favoritesContainer}>
        <h2 className={classes.title}>
          {t("favorites", "title")}{" "}
          {groupName !== t("common", "allRecipes")
            ? `${t("favorites", "inGroup")} ${groupName}`
            : ""}
        </h2>

        {favoritePersons.length === 0 ? (
          <p className={classes.noFavorites}>{t("favorites", "noFavorites")}</p>
        ) : (
          <RecipesView
            persons={favoritePersons}
            groups={groups}
            onEditPerson={onEditPerson}
            onDeletePerson={onDeletePerson}
          />
        )}

        <CloseButton
          onClick={onClose}
        >
          {t("common", "close")}
        </CloseButton>
      </div>
    </Modal>
  );
}

export { FavoritesPopup };
