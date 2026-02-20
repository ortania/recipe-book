import React, { useState, useRef, useCallback } from "react";
import { FaRegEdit } from "react-icons/fa";
import { GoTrash } from "react-icons/go";
import { PiPlusLight } from "react-icons/pi";
import { FiMenu } from "react-icons/fi";
import { LuArrowUpDown } from "react-icons/lu";
import { Modal } from "../modal";
import { CloseButton } from "../controls/close-button";
import { ConfirmDialog } from "../forms/confirm-dialog";
import { useLanguage } from "../../context";
import useTranslatedList from "../../hooks/useTranslatedList";
import { useTouchDragDrop } from "../../hooks/useTouchDragDrop";
import {
  CATEGORY_ICONS,
  DEFAULT_ICON_ID,
  getCategoryIcon,
} from "../../utils/categoryIcons";
import ChatHelpButton from "../controls/chat-help-button/ChatHelpButton";
import classes from "./categories-management.module.css";

const COLORS = [
  "#FF6B6B",
  "#F0A868",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#9B59B6",
  "#3498DB",
  "#F1C40F",
  "#2ECC71",
  "#E67E22",
  "#1ABC9C",
  "#E74C3C",
  "#8E44AD",
  "#16A085",
  "#D35400",
  "#2980B9",
  "#27AE60",
  "#F39C12",
  "#C0392B",
  "#7D3C98",
  "#1F618D",
  "#148F77",
  "#D4AC0D",
  "#A93226",
];

function CategoriesManagement({
  categories,
  onClose,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onReorderCategories,
  onSortAlphabetically,
  getGroupContacts,
}) {
  const { t } = useLanguage();
  const { getTranslated } = useTranslatedList(categories, "name");

  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const listRef = useRef(null);

  // Inline form state
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formIcon, setFormIcon] = useState(DEFAULT_ICON_ID);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Drag and drop
  const handleReorder = useCallback(
    (fromIndex, toIndex) => {
      if (onReorderCategories) {
        onReorderCategories(fromIndex, toIndex);
      }
      setDragIndex(null);
    },
    [onReorderCategories],
  );

  const { handleTouchStart, handleTouchMove, handleTouchEnd } =
    useTouchDragDrop(handleReorder);

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (toIndex) => {
    if (dragIndex !== null && dragIndex !== toIndex) {
      handleReorder(dragIndex, toIndex);
    }
    setDragIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const editableCategories = categories.filter(
    (c) => c.id !== "all" && c.id !== "general",
  );

  const resetForm = () => {
    setFormName("");
    setFormColor(COLORS[0]);
    setFormIcon(DEFAULT_ICON_ID);
    setShowIconPicker(false);
  };

  const handleAddClick = () => {
    setEditingId(null);
    resetForm();
    setShowAddForm(true);
  };

  const handleEditClick = (category) => {
    setShowAddForm(false);
    setEditingId(category.id);
    setFormName(getTranslated(category));
    setFormColor(category.color);
    setFormIcon(category.icon || DEFAULT_ICON_ID);
    setShowIconPicker(false);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    resetForm();
  };

  const handleSubmitAdd = async () => {
    if (!formName.trim()) return;
    try {
      await onAddCategory({
        id: Date.now().toString(),
        name: formName.trim(),
        description: "",
        color: formColor,
        icon: formIcon,
      });
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleSubmitEdit = () => {
    if (!formName.trim() || !editingId) return;
    const cat = editableCategories.find((c) => c.id === editingId);
    if (!cat) return;
    onEditCategory({
      ...cat,
      name: formName.trim(),
      color: formColor,
      icon: formIcon,
    });
    setEditingId(null);
    resetForm();
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

  const renderIconButton = (iconId, color) => {
    const IconComp = getCategoryIcon(iconId);
    return (
      <span
        className={classes.catIconWrap}
        style={{ backgroundColor: `${color}22`, color: color }}
      >
        <IconComp />
      </span>
    );
  };

  const renderInlineForm = (isEdit) => (
    <div className={classes.inlineForm}>
      <div className={classes.inlineFormRow}>
        <button
          type="button"
          className={classes.iconPickerToggle}
          onClick={() => setShowIconPicker(!showIconPicker)}
          style={{ backgroundColor: `${formColor}22`, color: formColor }}
        >
          {(() => {
            const IC = getCategoryIcon(formIcon);
            return <IC />;
          })()}
        </button>
        <input
          type="text"
          className={classes.inlineInput}
          placeholder={t("categories", "categoryName")}
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          autoFocus
        />
      </div>

      {showIconPicker && (
        <div className={classes.iconPickerSection}>
          <span className={classes.pickerLabel}>
            {t("categories", "chooseIcon")}
          </span>
          <div className={classes.iconGrid}>
            {CATEGORY_ICONS.map((item) => {
              const IC = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${classes.iconOption} ${formIcon === item.id ? classes.iconSelected : ""}`}
                  onClick={() => setFormIcon(item.id)}
                  style={
                    formIcon === item.id
                      ? { backgroundColor: `${formColor}22`, color: formColor }
                      : undefined
                  }
                >
                  <IC />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={classes.colorPickerRow}>
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`${classes.colorDot} ${formColor === color ? classes.colorSelected : ""}`}
            style={{ backgroundColor: color }}
            onClick={() => setFormColor(color)}
          />
        ))}
      </div>

      <div className={classes.inlineFormActions}>
        <button
          type="button"
          className={classes.cancelBtn}
          onClick={handleCancelForm}
        >
          {t("categories", "cancel")}
        </button>
        <button
          type="button"
          className={classes.addBtn}
          onClick={isEdit ? handleSubmitEdit : handleSubmitAdd}
          disabled={!formName.trim()}
        >
          {isEdit ? t("categories", "saveChanges") : t("categories", "add")}
        </button>
      </div>
    </div>
  );

  return (
    <Modal onClose={onClose} maxWidth="480px">
      <div className={classes.container}>
        <div className={classes.header}>
          <h2 className={classes.title}>
            {t("categories", "categoryManagement")}
          </h2>
          <div className={classes.headerActions}>
            <ChatHelpButton
              title={t("categories", "helpTitle")}
              items={[
                t("categories", "helpAdd"),
                t("categories", "helpSort"),
                t("categories", "helpDrag"),
              ]}
            />
            <button
              className={classes.sortBtn}
              onClick={() =>
                onSortAlphabetically && onSortAlphabetically(getTranslated)
              }
              title={t("categories", "sortAlphabetically") || "מיון לפי אב"}
            >
              <LuArrowUpDown />
            </button>
            <CloseButton onClick={onClose} />
          </div>
        </div>

        <div
          className={classes.listWrap}
          ref={listRef}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {editableCategories.map((category, index) => (
            <div
              key={category.id}
              data-drag-item
              className={`${classes.catRow} ${dragIndex === index ? classes.dragging : ""}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
            >
              {editingId === category.id ? (
                renderInlineForm(true)
              ) : (
                <>
                  <span
                    className={classes.dragHandle}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      handleDragStart(index);
                    }}
                    onTouchStart={(e) =>
                      handleTouchStart(e, index, "categories", listRef)
                    }
                  >
                    <FiMenu size={16} />
                  </span>
                  <div className={classes.catInfo}>
                    {renderIconButton(category.icon, category.color)}
                    <span className={classes.catName}>
                      {getTranslated(category)}
                    </span>
                  </div>
                  <div className={classes.catActions}>
                    <button
                      className={classes.editBtn}
                      onClick={() => handleEditClick(category)}
                    >
                      <FaRegEdit />
                    </button>
                    <button
                      className={classes.deleteBtn}
                      onClick={() => handleDeleteClick(category)}
                    >
                      <GoTrash />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {showAddForm && renderInlineForm(false)}
        </div>

        <div className={classes.bottomBar}>
          {!showAddForm && (
            <button className={classes.addNewBtn} onClick={handleAddClick}>
              <PiPlusLight /> {t("categories", "addNewCategory")}
            </button>
          )}
        </div>

        {categoryToDelete && (
          <ConfirmDialog
            message={`${t("categories", "deleteConfirm")} "${getTranslated(categoryToDelete)}"?`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setCategoryToDelete(null)}
            confirmText={t("confirm", "yesDelete")}
            cancelText={t("common", "cancel")}
          />
        )}
      </div>
    </Modal>
  );
}

export default CategoriesManagement;
