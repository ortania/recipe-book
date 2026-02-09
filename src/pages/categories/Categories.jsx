import { useState } from "react";

import {
  RecipesView,
  AddRecipe,
  AddCategory,
  CategoriesList,
  Button,
  AddButton,
  UpButton,
  FavoritesButton,
  FavoritesPopup,
  ConfirmDialog,
  ChatWindow,
  MigrationHelper,
} from "../../components";
import { FaPlus, FaStar } from "react-icons/fa";
import { PiArrowFatLineUp } from "react-icons/pi";
import { EditCategory } from "../../components/forms/edit-category";
import { useRecipeBook, useLanguage } from "../../context";

import { scrollToTop } from "../utils";

import pageClasses from "../page.module.css";
import classes from "./categories.module.css";

function Categories() {
  const {
    categories,
    recipes,
    addCategory,
    editCategory,
    deleteCategory,
    addRecipe,
    editRecipe,
    deleteRecipe,
    clearCategoryRecipes,
    currentUser,
  } = useRecipeBook();
  const { t } = useLanguage();

  const [selectedGroup, setSelectedGroup] = useState("all");
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const getGroupContacts = (groupId) => {
    if (groupId === "all") {
      return recipes;
    }
    if (groupId === "general") {
      return recipes.filter(
        (recipe) => !recipe.categories || recipe.categories.length === 0,
      );
    }
    return recipes.filter(
      (recipe) => recipe.categories && recipe.categories.includes(groupId),
    );
  };

  const currentGroupContacts = getGroupContacts(selectedGroup);
  const currentGroup = categories.find((group) => group.id === selectedGroup);

  const handleClearGroupClick = () => {
    setShowConfirmClear(true);
  };

  const handleConfirmClear = () => {
    clearCategoryRecipes(selectedGroup);
    setShowConfirmClear(false);
  };

  const handleCancelClear = () => {
    setShowConfirmClear(false);
  };

  const handleDeleteCategory = (categoryId) => {
    setCategoryToDelete(categoryId);
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete);
      if (selectedGroup === categoryToDelete) {
        setSelectedGroup("all");
      }
      setCategoryToDelete(null);
    }
  };

  const cancelDeleteCategory = () => {
    setCategoryToDelete(null);
  };

  return (
    <div className={classes.groupsContainer}>
      <CategoriesList
        groups={categories}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
        onShowAddGroup={() => setShowAddGroup(true)}
        onEditGroup={setEditingCategory}
        onDeleteGroup={handleDeleteCategory}
        getGroupContacts={getGroupContacts}
      />

      <div className={classes.groupContent} dir="auto">
        {showAddGroup && (
          <AddCategory
            onAddGroup={addCategory}
            onCancel={() => setShowAddGroup(false)}
          />
        )}

        {showAddPerson && (
          <AddRecipe
            onAddPerson={addRecipe}
            onCancel={() => setShowAddPerson(false)}
            onEditPerson={editRecipe}
            defaultGroup={selectedGroup === "all" ? null : selectedGroup}
            groups={categories}
          />
        )}

        <RecipesView
          persons={currentGroupContacts}
          groups={categories}
          onEditPerson={editRecipe}
          onDeletePerson={deleteRecipe}
          onAddPerson={() => setShowAddPerson(true)}
          onShowFavorites={() => setShowFavorites(true)}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
        />

        {showFavorites && (
          <FavoritesPopup
            persons={currentGroupContacts}
            groups={categories}
            onClose={() => setShowFavorites(false)}
            onEditPerson={editRecipe}
            onDeletePerson={deleteRecipe}
            groupName={
              selectedGroup === "all"
                ? t("common", "allRecipes")
                : currentGroup.name
            }
          />
        )}

        {editingCategory && (
          <EditCategory
            category={editingCategory}
            onSave={editCategory}
            onCancel={() => setEditingCategory(null)}
          />
        )}

        {showConfirmClear && (
          <ConfirmDialog
            title={t("confirm", "confirmClear")}
            message={`${t("confirm", "deleteRecipeMsg")} ${
              selectedGroup === "all"
                ? t("common", "allRecipes").toLowerCase()
                : `"${currentGroup.name}"`
            }?`}
            onConfirm={handleConfirmClear}
            onCancel={handleCancelClear}
            confirmText={t("confirm", "yesClear")}
            cancelText={t("common", "cancel")}
          />
        )}

        {categoryToDelete && (
          <ConfirmDialog
            title={t("confirm", "deleteCategory")}
            message={t("confirm", "deleteCategoryMsg")}
            onConfirm={confirmDeleteCategory}
            onCancel={cancelDeleteCategory}
            confirmText={t("confirm", "yesDelete")}
            cancelText={t("common", "cancel")}
          />
        )}

        {showChat && (
          <ChatWindow
            onClose={() => setShowChat(false)}
            recipeContext={currentGroupContacts}
          />
        )}

        <UpButton onClick={scrollToTop} title="Scroll to top">
          <PiArrowFatLineUp />
        </UpButton>

        {/* {isAdmin && <MigrationHelper />} */}
      </div>
    </div>
  );
}

export default Categories;
