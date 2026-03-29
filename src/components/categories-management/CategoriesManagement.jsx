import React, { useState, useRef, useCallback } from "react";
import { FaRegEdit } from "react-icons/fa";
import { GoTrash } from "react-icons/go";
import { PiPlusLight } from "react-icons/pi";
import { LuArrowUpDown } from "react-icons/lu";
import { GripVertical, CircleCheck, AlertTriangle } from "lucide-react";
import { Modal } from "../modal";
import { CloseButton } from "../controls/close-button";
import { Toast } from "../controls";
import { ConfirmDialog } from "../forms/confirm-dialog";
import RecipeImageUpload from "../forms/RecipeImageUpload";
import { useLanguage, useRecipeBook } from "../../context";
import useTranslatedList from "../../hooks/useTranslatedList";
import { useTouchDragDrop } from "../../hooks/useTouchDragDrop";
import { uploadRecipeImage } from "../../firebase/imageService";
import { generateRecipeImageDataUrl } from "../../services/openai";
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
  onSortAlphabetically,
  getGroupContacts,
}) {
  const { t } = useLanguage();
  const { currentUser } = useRecipeBook();
  const { getTranslated } = useTranslatedList(categories, "name");
  const isMobile = window.innerWidth < 768;

  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const listRef = useRef(null);

  // Inline form state
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formIcon, setFormIcon] = useState(DEFAULT_ICON_ID);
  const [formImage, setFormImage] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingAiImage, setGeneratingAiImage] = useState(false);
  const [imageDragOver, setImageDragOver] = useState(false);
  const [imageToast, setImageToast] = useState({ open: false, message: "", variant: "success" });
  const imageInputRef = useRef(null);

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

  const { handleTouchStart, handleLongPressStart } =
    useTouchDragDrop(handleReorder);

  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (toIndex) => {
    if (dragIndex !== null && dragIndex !== toIndex) {
      handleReorder(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const editableCategories = categories.filter(
    (c) => c.id !== "all" && c.id !== "general",
  );

  const resetForm = () => {
    setFormName("");
    setFormColor(COLORS[0]);
    setFormIcon(DEFAULT_ICON_ID);
    setFormImage("");
    setShowIconPicker(false);
    setUploadingImage(false);
    setGeneratingAiImage(false);
    setImageDragOver(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploadingImage(true);
    try {
      const url = await uploadRecipeImage(
        currentUser.uid,
        `cat_${editingId || Date.now()}`,
        file,
      );
      setFormImage(url);
    } catch (err) {
      console.error("Category image upload failed:", err);
    }
    setUploadingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handlePasteImage = async (file) => {
    if (!file || !currentUser || uploadingImage || generatingAiImage) return;
    setUploadingImage(true);
    try {
      const url = await uploadRecipeImage(
        currentUser.uid,
        `cat_${editingId || Date.now()}_paste`,
        file,
      );
      setFormImage(url);
    } catch (err) {
      console.error("Category paste image failed:", err);
    }
    setUploadingImage(false);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setImageDragOver(false);
    const file = Array.from(e.dataTransfer.files).find(
      (f) => f.type.startsWith("image/") || /\.jfif$/i.test(f.name),
    );
    if (!file) return;
    handleImageUpload({ target: { files: [file] } });
  };

  const handleGenerateAiImage = async () => {
    if (!formName.trim()) {
      setImageToast({
        open: true,
        message: <><AlertTriangle size={18} /> {t("addWizard", "generateAiImageNeedName")}</>,
        variant: "error",
      });
      return;
    }
    if (uploadingImage || generatingAiImage) return;
    setGeneratingAiImage(true);
    const safetyTimer = setTimeout(() => {
      setGeneratingAiImage(false);
      setImageToast({ open: true, message: <><AlertTriangle size={18} /> Timeout</>, variant: "error" });
    }, 120000);
    try {
      const dataUrl = await generateRecipeImageDataUrl({
        recipeName: formName.trim(),
        ingredients: [],
      });
      const url = await uploadRecipeImage(
        currentUser.uid,
        `cat_${editingId || Date.now()}_ai`,
        dataUrl,
      );
      setFormImage(url);
      setImageToast({
        open: true,
        message: <><CircleCheck size={18} /> {t("addWizard", "generateAiImageDone")}</>,
        variant: "success",
      });
    } catch (err) {
      setImageToast({
        open: true,
        message: <><AlertTriangle size={18} /> {err.message || t("addWizard", "generateAiImageError")}</>,
        variant: "error",
      });
    } finally {
      clearTimeout(safetyTimer);
      setGeneratingAiImage(false);
    }
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
    setFormImage(category.image || "");
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
        image: formImage || "",
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
    const nameChanged = formName.trim() !== getTranslated(cat);
    onEditCategory({
      ...cat,
      name: formName.trim(),
      color: formColor,
      icon: formIcon,
      image: formImage || "",
      ...(nameChanged && { customName: true }),
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

  const renderIconButton = (iconId) => {
    const IconComp = getCategoryIcon(iconId);
    return (
      <span className={classes.catIconWrap}>
        <IconComp size={16} />
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
        >
          {(() => {
            const IC = getCategoryIcon(formIcon);
            return <IC size={18} />;
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
                >
                  <IC size={16} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={classes.imagePickerRow}>
        <RecipeImageUpload
          images={formImage ? [formImage] : []}
          uploadingImage={uploadingImage}
          generatingAiImage={generatingAiImage}
          isDragOver={imageDragOver}
          setIsDragOver={setImageDragOver}
          onImageUpload={handleImageUpload}
          onRemoveImage={() => setFormImage("")}
          onDrop={handleImageDrop}
          onPasteImage={handlePasteImage}
          onGenerateAiImage={handleGenerateAiImage}
          fileInputRef={imageInputRef}
          isMobile={isMobile}
          hideHint
          t={t}
        />
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

  const content = (
    <div className={classes.container}>
      <div className={classes.header}>
        <h2 className={classes.title}>
          {t("categories", "categoryManagement")}
        </h2>
        <div className={classes.headerActions}>
          <CloseButton onClick={onClose} />
        </div>
      </div>

      <div className={classes.listWrap} ref={listRef}>
        {editableCategories.map((category, index) => (
          <div
            key={category.id}
            data-drag-item
            className={`${classes.catRow} ${dragIndex === index ? classes.dragging : ""} ${dragOverIndex === index && dragIndex !== null && dragIndex !== index ? (dragIndex > index ? classes.dragOverAbove : classes.dragOverBelow) : ""}`}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) =>
              handleLongPressStart(e, index, "categories", listRef)
            }
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
                  <GripVertical size={16} />
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
  );

  return (
    <>
      <Modal onClose={onClose} maxWidth="480px">
        {content}
      </Modal>
      <Toast
        open={imageToast.open}
        onClose={() => setImageToast((p) => ({ ...p, open: false }))}
        variant={imageToast.variant}
      >
        {imageToast.message}
      </Toast>
    </>
  );
}

export default CategoriesManagement;
