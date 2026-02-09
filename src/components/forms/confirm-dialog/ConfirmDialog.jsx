import React from "react";
import { Modal } from "../../";
import classes from "./confirm-dialog.module.css";

function ConfirmDialog({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmTitle = "Confirm this action",
  cancelTitle = "Cancel this action",
}) {
  return (
    <Modal onClose={onCancel} maxWidth="450px">
      <div className={classes.dialog}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={classes.buttons}>
          <button
            className={classes.confirmButton}
            onClick={onConfirm}
            title={confirmTitle}
          >
            {confirmText}
          </button>
          <button
            className={classes.cancelButton}
            onClick={onCancel}
            title={cancelTitle}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
