import React, { useState } from "react";
import { Modal } from "../../modal";
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

function EditCategory({ category, onSave, onCancel }) {
  const [groupName, setGroupName] = useState(category.name);
  const [groupDescription, setGroupDescription] = useState(
    category.description || "",
  );
  const [groupColor, setGroupColor] = useState(category.color);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...category,
      name: groupName,
      description: groupDescription,
      color: groupColor,
    });
    onCancel();
  };

  return (
    <Modal onClose={onCancel}>
      <form className={classes.form} onSubmit={handleSubmit}>
        <h2 className={classes.formTitle}>Edit Category</h2>
        <input
          type="text"
          placeholder="Category Name *"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
        />
        <div className={classes.colorPicker}>
          <label className={classes.colorLabel}>Color:</label>
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
            Cancel
          </button>
          <button type="submit" className={classes.submitBtn}>
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditCategory;
