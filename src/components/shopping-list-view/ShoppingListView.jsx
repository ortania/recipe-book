import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "../../context";
import {
  SHOPPING_CATEGORIES,
  CATEGORY_I18N_KEYS,
  resolveCategory,
  normalizeIngredientName,
} from "../../utils/ingredientCalc";
import { normalizeKey } from "../../utils/ingredientUtils";
import classes from "./shopping-list-view.module.css";

export default function ShoppingListView({
  shoppingList,
  checkedItems,
  onToggleChecked,
  onClearChecked,
  onManualItemsChange,
  manualItems: initialManualItems = [],
}) {
  const { t } = useLanguage();
  const [manualItems, setManualItems] = useState(initialManualItems);
  const [newItemText, setNewItemText] = useState("");
  const [editingKey, setEditingKey] = useState(null);
  const [editText, setEditText] = useState("");
  const [editedItems, setEditedItems] = useState({});
  const [openCategories, setOpenCategories] = useState(
    () => new Set(SHOPPING_CATEGORIES),
  );
  const [disabledKeys, setDisabledKeys] = useState(new Set());
  const [permanentlyDeletedKeys, setPermanentlyDeletedKeys] = useState(
    new Set(),
  );

  useEffect(() => {
    onManualItemsChange?.(manualItems);
  }, [manualItems, onManualItemsChange]);

  useEffect(() => {
    setManualItems(initialManualItems);
  }, [initialManualItems]);

  const toggleCategoryOpen = (cat) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const categorizedGroups = useMemo(() => {
    const buyable = (shoppingList || [])
      .filter((item) => item.shouldBuy !== false)
      .filter(
        (item) =>
          !permanentlyDeletedKeys.has(
            (item.normalizedName || item.name).toLowerCase(),
          ),
      );

    const toItem = (item) => {
      const key = (item.normalizedName || item.name).toLowerCase();
      return {
        key,
        text: editedItems[key] || item.displayText,
        isManual: false,
        isPantry: !!item.isPantry,
        category: item.category || "אחר",
      };
    };

    const manual = manualItems.map((m) => {
      const ingKey = normalizeKey(m.text) || m.text.trim().toLowerCase();
      const norm = normalizeIngredientName(ingKey);
      return {
        key: m.id,
        text: m.text,
        isManual: true,
        isPantry: false,
        category: resolveCategory(norm),
      };
    });

    const allItems = [...buyable.map(toItem), ...manual];

    const groups = {};
    for (const item of allItems) {
      const cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    return SHOPPING_CATEGORIES.filter((cat) => groups[cat]?.length > 0).map(
      (cat) => ({ category: cat, items: groups[cat] }),
    );
  }, [shoppingList, manualItems, editedItems, permanentlyDeletedKeys]);

  const allItemsFlat = categorizedGroups.flatMap((g) => g.items);
  const totalCount = allItemsFlat.length;
  const checkedCount = allItemsFlat.filter(
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

  const handlePermanentDelete = (key, isManual) => {
    if (isManual) {
      setManualItems((prev) => prev.filter((m) => m.id !== key));
    } else {
      setPermanentlyDeletedKeys((prev) => new Set(prev).add(key));
    }
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

        {!isEditing &&
          (isDisabled ? (
            <div className={classes.disabledActions}>
              <button
                className={classes.restoreBtn}
                onClick={() => handleRestoreItem(item.key)}
                title="שחזר"
              >
                <RotateCcw size={14} />
              </button>
              <button
                className={classes.permanentDeleteBtn}
                onClick={() => handlePermanentDelete(item.key, item.isManual)}
              >
                <Trash2 size={13} />
                <span className={classes.permanentDeleteLabel}>
                  {t("mealPlanner", "deletePermanently")}
                </span>
              </button>
            </div>
          ) : (
            <button
              className={classes.deleteBtn}
              onClick={() => handleDisableItem(item.key)}
            >
              <Trash2 size={14} />
            </button>
          ))}
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

      <div className={classes.listCard}>
        {categorizedGroups.map(({ category, items }) => {
          const isOpen = openCategories.has(category);
          const i18nKey = CATEGORY_I18N_KEYS[category];
          return (
            <div key={category}>
              <button
                className={classes.sectionHead}
                onClick={() => toggleCategoryOpen(category)}
              >
                <span className={classes.sectionLabel}>
                  {i18nKey ? t("mealPlanner", i18nKey) : category}
                </span>
                <span className={classes.sectionEnd}>
                  <span className={classes.sectionBadge}>
                    {items.length} {t("mealPlanner", "items")}
                  </span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
              {isOpen && (
                <div className={classes.itemList}>{items.map(renderItem)}</div>
              )}
            </div>
          );
        })}

        {onClearChecked && checkedCount > 0 && (
          <button className={classes.uncheckBtn} onClick={onClearChecked}>
            {t("mealPlanner", "uncheckAll")}
          </button>
        )}
      </div>
    </div>
  );
}
