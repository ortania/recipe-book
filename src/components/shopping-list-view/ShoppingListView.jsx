import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  RotateCcw,
  Check,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "../../context";
import classes from "./shopping-list-view.module.css";

export default function ShoppingListView({
  shoppingList,
  checkedItems,
  onToggleChecked,
  onClearChecked,
}) {
  const { t } = useLanguage();
  const [manualItems, setManualItems] = useState([]);
  const [newItemText, setNewItemText] = useState("");
  const [editingKey, setEditingKey] = useState(null);
  const [editText, setEditText] = useState("");
  const [editedItems, setEditedItems] = useState({});
  const [mustBuyOpen, setMustBuyOpen] = useState(true);
  const [pantryOpen, setPantryOpen] = useState(true);
  const [disabledKeys, setDisabledKeys] = useState(new Set());

  const { mustBuyList, pantryList } = useMemo(() => {
    const buyable = (shoppingList || []).filter(
      (item) => item.shouldBuy !== false,
    );
    const toItem = (item) => {
      const key = (item.normalizedName || item.name).toLowerCase();
      return {
        key,
        text: editedItems[key] || item.displayText,
        isManual: false,
        isPantry: !!item.isPantry,
      };
    };
    const manual = manualItems.map((m) => ({
      key: m.id,
      text: m.text,
      isManual: true,
      isPantry: false,
    }));
    const allMust = [
      ...buyable.filter((i) => !i.isPantry).map(toItem),
      ...manual,
    ];
    const allPantry = buyable.filter((i) => i.isPantry).map(toItem);
    return {
      mustBuyList: allMust,
      pantryList: allPantry,
    };
  }, [shoppingList, manualItems, editedItems]);

  const totalCount = mustBuyList.length + pantryList.length;
  const checkedCount = [...mustBuyList, ...pantryList].filter(
    (item) => checkedItems[item.key],
  ).length;

  const handleAddManualItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    setManualItems((prev) => [...prev, { id: `manual_${Date.now()}`, text }]);
    setNewItemText("");
  };

  const handleDisableItem = (key) => {
    setDisabledKeys((prev) => new Set(prev).add(key));
  };

  const handleRestoreItem = (key) => {
    setDisabledKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleStartEdit = (key, currentText) => {
    setEditingKey(key);
    setEditText(currentText);
  };

  const handleSaveEdit = (key) => {
    const text = editText.trim();
    if (!text) {
      setEditingKey(null);
      return;
    }
    if (key.startsWith("manual_")) {
      setManualItems((prev) =>
        prev.map((m) => (m.id === key ? { ...m, text } : m)),
      );
    } else {
      setEditedItems((prev) => ({ ...prev, [key]: text }));
    }
    setEditingKey(null);
  };

  const renderItem = (item) => {
    const isChecked = checkedItems[item.key];
    const isEditing = editingKey === item.key;
    const isDisabled = disabledKeys.has(item.key);
    return (
      <div
        key={item.key}
        className={`${classes.item} ${isChecked ? classes.itemChecked : ""} ${isDisabled ? classes.itemDisabled : ""}`}
      >
        <button
          className={`${classes.circle} ${isChecked ? classes.circleActive : ""}`}
          onClick={() => !isDisabled && onToggleChecked(item.key)}
          disabled={isDisabled}
          aria-label="toggle"
        >
          {isChecked && <Check size={14} className={classes.checkIcon} />}
        </button>

        {isEditing ? (
          <input
            type="text"
            className={classes.editInput}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit(item.key);
              if (e.key === "Escape") setEditingKey(null);
            }}
            onBlur={() => handleSaveEdit(item.key)}
            autoFocus
          />
        ) : (
          <span
            className={classes.itemText}
            onClick={() => !isDisabled && handleStartEdit(item.key, item.text)}
          >
            {item.text}
          </span>
        )}

        {isEditing && (
          <button
            className={classes.saveBtn}
            onClick={() => handleSaveEdit(item.key)}
          >
            <Check size={14} />
          </button>
        )}

        {!isEditing && (
          isDisabled ? (
            <button
              className={classes.restoreBtn}
              onClick={() => handleRestoreItem(item.key)}
            >
              <RotateCcw size={14} />
            </button>
          ) : (
            <button
              className={classes.deleteBtn}
              onClick={() => handleDisableItem(item.key)}
            >
              <Trash2 size={14} />
            </button>
          )
        )}
      </div>
    );
  };

  if (totalCount === 0 && manualItems.length === 0) {
    return (
      <div className={classes.emptyAll}>
        {t("mealPlanner", "emptyShoppingHint")}
      </div>
    );
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.addRow}>
        <button
          className={classes.addBtn}
          onClick={handleAddManualItem}
          disabled={!newItemText.trim()}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
        <input
          type="text"
          className={classes.addInput}
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddManualItem();
          }}
          placeholder={t("mealPlanner", "addItemPlaceholder")}
        />
      </div>

      {/* ── Must Buy ── */}
      <button
        className={classes.sectionHead}
        onClick={() => setMustBuyOpen((v) => !v)}
      >
        <span className={classes.sectionLabel}>
          {t("mealPlanner", "mustBuy")}
        </span>
        <span className={classes.sectionEnd}>
          <span className={classes.sectionBadge}>
            {mustBuyList.length} {t("mealPlanner", "items")}
          </span>
          {mustBuyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {mustBuyOpen && (
        <div className={classes.itemList}>
          {mustBuyList.length > 0 ? (
            mustBuyList.map(renderItem)
          ) : (
            <div className={classes.emptySection}>
              <ShoppingCart size={20} />
              <span>{t("mealPlanner", "noItemsInSection")}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Maybe At Home ── */}
      <button
        className={classes.sectionHead}
        onClick={() => setPantryOpen((v) => !v)}
      >
        <span className={classes.sectionLabel}>
          {t("mealPlanner", "maybeAtHome")}
        </span>
        <span className={classes.sectionEnd}>
          {pantryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {pantryOpen && (
        <div className={classes.itemList}>
          {pantryList.length > 0 ? (
            pantryList.map(renderItem)
          ) : (
            <div className={classes.emptySection}>
              <ShoppingCart size={20} />
              <span>{t("mealPlanner", "noItemsInSection")}</span>
            </div>
          )}
        </div>
      )}

      {onClearChecked && checkedCount > 0 && (
        <button className={classes.uncheckBtn} onClick={onClearChecked}>
          {t("mealPlanner", "uncheckAll")}
        </button>
      )}
    </div>
  );
}
