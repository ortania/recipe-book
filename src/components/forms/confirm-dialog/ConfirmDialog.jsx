import React from "react";
import { Button } from "../../controls/button";
import { Modal } from "../../";
import classes from "./confirm-dialog.module.css";

function ConfirmDialog({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  confirmTitle = "Confirm this action",
  cancelTitle = "Cancel this action",
}) {
  return (
    <Modal onClose={onCancel}>
      <div className={classes.dialog}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={classes.buttons}>
          <Button onClick={onCancel} title={cancelTitle}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            title={confirmTitle}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
