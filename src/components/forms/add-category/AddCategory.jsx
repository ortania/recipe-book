import React, { useState } from "react";
import { Modal } from "../../modal";
import { useLanguage } from "../../../context";
import classes from "../form.module.css";

// Array of visually distinct colors
const COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Light Blue
  "#96CEB4", // Sage Green
  "#9B59B6", // Purple
  "#3498DB", // Blue
  "#F1C40F", // Yellow
  "#2ECC71", // Green
  "#E67E22", // Orange
  "#1ABC9C", // Turquoise
];

function AddCategory({ onAddGroup, onCancel }) {
  const { t } = useLanguage();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupColor, setGroupColor] = useState(COLORS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const groupId = Date.now().toString();

    onAddGroup({
      id: groupId,
      name: groupName,
      description: groupDescription || `${groupName} category`,
      color: groupColor,
    });
    setGroupName("");
    setGroupDescription("");
    setGroupColor(COLORS[0]);
    onCancel();
  };

  return (
    <Modal onClose={onCancel}>
      <form className={classes.form} onSubmit={handleSubmit}>
        <h2 className={classes.formTitle}>{t("categories", "addCategory")}</h2>
        <input
          type="text"
          placeholder={t("categories", "categoryName")}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder={t("categories", "description")}
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
        />
        <div className={classes.colorPicker}>
          <label className={classes.colorLabel}>
            {t("categories", "color")}
          </label>
          <div className={classes.colorOptions}>
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`${classes.colorButton} ${groupColor === color ? classes.selectedColor : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setGroupColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>
        <div className={classes.formButtons}>
          <button
            type="button"
            onClick={onCancel}
            className={classes.cancelBtn}
          >
            {t("categories", "cancel")}
          </button>
          <button type="submit" className={classes.submitBtn}>
            {t("categories", "addCategory")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddCategory;
