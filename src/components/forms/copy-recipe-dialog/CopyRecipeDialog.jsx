import { useState, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { Button } from "../../controls/button";
import { Modal } from "../../modal";
import { findUserByEmail } from "../../../firebase/authService";
import { useLanguage } from "../../../context";
import classes from "./copy-recipe-dialog.module.css";

function CopyRecipeDialog({ recipeName, currentUserId, onCopy, onCancel }) {
  const { t } = useLanguage();
  const [emailInput, setEmailInput] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [isCopying, setIsCopying] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState({ success: [], failed: [] });
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  const handleAddEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("copyRecipe", "invalidEmail"));
      return;
    }

    if (recipients.some((r) => r.email === email)) {
      setError(t("copyRecipe", "emailExists"));
      return;
    }

    setIsSearching(true);
    setError("");

    const user = await findUserByEmail(email);
    if (!user) {
      setError(t("copyRecipe", "userNotFound"));
      setIsSearching(false);
      return;
    }

    if (user.id === currentUserId) {
      setError(t("copyRecipe", "cannotCopyToSelf"));
      setIsSearching(false);
      return;
    }

    setRecipients((prev) => [
      ...prev,
      {
        id: user.id,
        email: user.email,
        name: user.displayName || user.email.split("@")[0],
      },
    ]);
    setEmailInput("");
    setIsSearching(false);
    inputRef.current?.focus();
  };

  const handleRemoveRecipient = (email) => {
    setRecipients((prev) => prev.filter((r) => r.email !== email));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleCopy = async () => {
    if (recipients.length === 0) return;
    setIsCopying(true);
    setError("");

    const success = [];
    const failed = [];

    for (const recipient of recipients) {
      try {
        await onCopy(recipient.id);
        success.push(recipient.name);
      } catch (err) {
        console.error("Error copying to", recipient.email, err);
        failed.push(recipient.name);
      }
    }

    setResults({ success, failed });
    setDone(true);
    if (failed.length === 0) {
      setTimeout(() => onCancel(), 2000);
    }
  };

  return (
    <Modal onClose={onCancel}>
      <div className={classes.dialog}>
        <h3>📋 {t("copyRecipe", "title")}</h3>
        <p className={classes.recipeName}>"{recipeName}"</p>

        {done ? (
          <div className={classes.resultSection}>
            {results.success.length > 0 && (
              <div className={classes.successMessage}>
                <span className={classes.successIcon}>✅</span>
                <p>
                  {t("copyRecipe", "copiedSuccess")}{" "}
                  {results.success.join(", ")}
                </p>
              </div>
            )}
            {results.failed.length > 0 && (
              <div className={classes.errorMessage}>
                <p>
                  {t("copyRecipe", "copyFailed")} {results.failed.join(", ")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={classes.inputSection}>
              <label className={classes.inputLabel}>
                {t("copyRecipe", "enterEmail")}
              </label>
              <div className={classes.inputRow}>
                <input
                  ref={inputRef}
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="user@example.com"
                  className={classes.emailInput}
                  disabled={isSearching || isCopying}
                  autoFocus
                />
                <button
                  onClick={handleAddEmail}
                  className={classes.addButton}
                  disabled={!emailInput.trim() || isSearching}
                >
                  {isSearching ? "..." : t("copyRecipe", "add")}
                </button>
              </div>
              {error && <p className={classes.errorText}>{error}</p>}
            </div>

            {recipients.length > 0 && (
              <div className={classes.chipList}>
                {recipients.map((r) => (
                  <div key={r.email} className={classes.chip}>
                    <span className={classes.chipName}>{r.name}</span>
                    <button
                      className={classes.chipRemove}
                      onClick={() => handleRemoveRecipient(r.email)}
                      title={t("copyRecipe", "remove")}
                    >
                      <IoClose />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={classes.buttons}>
              <Button onClick={onCancel} title={t("copyRecipe", "cancel")}>
                {t("copyRecipe", "cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleCopy}
                disabled={recipients.length === 0 || isCopying}
                title={t("copyRecipe", "copy")}
              >
                {isCopying
                  ? t("copyRecipe", "copying")
                  : recipients.length > 1
                    ? t("copyRecipe", "copyToUsers").replace(
                        "{count}",
                        recipients.length,
                      )
                    : t("copyRecipe", "copy")}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default CopyRecipeDialog;
