import React, { useState } from "react";
import { FaRegEdit, FaGripVertical } from "react-icons/fa";
import { BsTrash3 } from "react-icons/bs";
import { IoAddOutline, IoArrowUp, IoArrowDown } from "react-icons/io5";
import { Modal } from "../modal";
import { Button } from "../controls/button";
import { AddCategory } from "../forms/add-category";
import { EditCategory } from "../forms/edit-category";
import { ConfirmDialog } from "../forms/confirm-dialog";
import classes from "./categories-management.module.css";

function CategoriesManagement({
  categories,
  onClose,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onReorderCategories,
  getGroupContacts,
}) {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Filter out the virtual "All" and "Other" categories - they're not editable
  const editableCategories = categories.filter(
    (c) => c.id !== "all" && c.id !== "other",
  );

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    // Reorder categories
    onReorderCategories(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Simple move up/down functions for mobile arrows
  const handleMoveUp = (index) => {
    if (index > 0) {
      onReorderCategories(index, index - 1);
    }
  };

  const handleMoveDown = (index) => {
    if (index < editableCategories.length - 1) {
      onReorderCategories(index, index + 1);
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
  };

  const handleSaveEdit = (updatedCategory) => {
    onEditCategory(updatedCategory);
    setEditingCategory(null);
  };

  const handleAddCategory = async (newCategory) => {
    try {
      await onAddCategory(newCategory);
      setShowAddCategory(false);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="1200px">
      <div className={classes.container}>
        <div className={classes.header}>
          <h2 className={classes.title}>Category Management </h2>
          <button onClick={onClose} className={classes.closeButton}>
            ✕
          </button>
        </div>

        <div className={classes.content}>
          <div className={classes.addSection}>
            <Button
              variant="success"
              onClick={() => setShowAddCategory(true)}
              className={classes.addButton}
            >
              <IoAddOutline className={classes.addIcon} />
              הוסף קטגוריה חדשה
            </Button>
          </div>

          <div className={classes.categoriesList}>
            {editableCategories.map((category, index) => (
              <div
                key={category.id}
                className={classes.categoryCard}
                data-category-index={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className={classes.dragHandle}>
                  <FaGripVertical />
                </div>

                <div className={classes.mobileReorderButtons}>
                  <button
                    className={classes.arrowButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(index);
                    }}
                    disabled={index === 0}
                    title="העלה"
                  >
                    <IoArrowUp />
                  </button>
                  <button
                    className={classes.arrowButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(index);
                    }}
                    disabled={index === editableCategories.length - 1}
                    title="הורד"
                  >
                    <IoArrowDown />
                  </button>
                </div>

                <div className={classes.categoryInfo}>
                  <div
                    className={classes.categoryColor}
                    style={{ backgroundColor: category.color }}
                  />
                  <div className={classes.categoryDetails}>
                    <h3 className={classes.categoryName}>{category.name}</h3>
                    {category.description && (
                      <p className={classes.categoryDescription}>
                        {category.description}
                      </p>
                    )}
                  </div>
                  <span className={classes.recipeCount}>
                    {getGroupContacts(category.id).length} מתכונים
                  </span>
                </div>

                <div className={classes.actions}>
                  <button
                    className={classes.editButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(category);
                    }}
                    title="ערוך קטגוריה"
                  >
                    <FaRegEdit />
                  </button>
                  <button
                    className={classes.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(category);
                    }}
                    title="מחק קטגוריה"
                  >
                    <BsTrash3 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showAddCategory && (
          <AddCategory
            onAddGroup={handleAddCategory}
            onCancel={() => setShowAddCategory(false)}
          />
        )}

        {editingCategory && (
          <EditCategory
            category={editingCategory}
            onSave={handleSaveEdit}
            onCancel={() => setEditingCategory(null)}
          />
        )}

        {categoryToDelete && (
          <ConfirmDialog
            message={`האם אתה בטוח שברצונך למחוק את הקטגוריה "${categoryToDelete.name}"?`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setCategoryToDelete(null)}
          />
        )}
      </div>
    </Modal>
  );
}

export default CategoriesManagement;
