import React, { useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import { BsTrash3 } from "react-icons/bs";
import { PiPlusLight } from "react-icons/pi";
import { Modal } from "../modal";
import { CloseButton } from "../controls/close-button";
import { ConfirmDialog } from "../forms/confirm-dialog";
import { useLanguage } from "../../context";
import useTranslatedList from "../../hooks/useTranslatedList";
import {
  CATEGORY_ICONS,
  DEFAULT_ICON_ID,
  getCategoryIcon,
} from "../../utils/categoryIcons";
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
  getGroupContacts,
}) {
  const { t } = useLanguage();
  const { getTranslated } = useTranslatedList(categories, "name");

  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Inline form state
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formIcon, setFormIcon] = useState(DEFAULT_ICON_ID);
  const [showIconPicker, setShowIconPicker] = useState(false);

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
    setFormName(category.name);
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
          <CloseButton onClick={onClose} />
        </div>

        <div className={classes.listWrap}>
          {editableCategories.map((category) => (
            <div key={category.id} className={classes.catRow}>
              {editingId === category.id ? (
                renderInlineForm(true)
              ) : (
                <>
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
                      <BsTrash3 />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {showAddForm ? (
            renderInlineForm(false)
          ) : (
            <button className={classes.addNewBtn} onClick={handleAddClick}>
              <PiPlusLight /> {t("categories", "addNewCategory")}
            </button>
          )}
        </div>

        <div className={classes.footer}>
          <button className={classes.doneBtn} onClick={onClose}>
            {t("categories", "done")}
          </button>
        </div>

        {categoryToDelete && (
          <ConfirmDialog
            message={`${t("categories", "deleteConfirm")} "${getTranslated(categoryToDelete)}"?`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setCategoryToDelete(null)}
          />
        )}
      </div>
    </Modal>
  );
}

export default CategoriesManagement;
