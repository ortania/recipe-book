import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "../../modal";
import {
  X,
  Star,
  Camera,
  GripVertical,
  Save,
  Trash2,
  Globe,
  Heart,
  FileText,
  List,
  ListOrdered,
  Image,
  Tags,
  Plus,
  Check,
} from "lucide-react";
import { useLanguage, useRecipeBook } from "../../../context";
import { uploadRecipeImage } from "../../../firebase/imageService";
import { useTouchDragDrop } from "../../../hooks/useTouchDragDrop";
import useTranslatedList from "../../../hooks/useTranslatedList";
import classes from "./edit-recipe.module.css";
import { CloseButton } from "../../controls";
import {
  calculateNutrition,
  clearNutritionCache,
} from "../../../services/openai";
import {
  isGroupHeader,
  getGroupName,
  makeGroupHeader,
  ingredientsOnly,
} from "../../../utils/ingredientUtils";

const TABS = [
  {
    id: "basic",
    icon: FileText,
    labelKey: "basicInfo",
    shortLabelKey: "basicInfoShort",
  },
  {
    id: "ingredients",
    icon: List,
    labelKey: "ingredients",
    shortLabelKey: "ingredients",
  },
  {
    id: "instructions",
    icon: ListOrdered,
    labelKey: "instructions",
    shortLabelKey: "instructionsShort",
  },
  {
    id: "image",
    icon: Image,
    labelKey: "recipeImage",
    shortLabelKey: "recipeImageShort",
  },
  {
    id: "categories",
    icon: Tags,
    labelKey: "categories",
    shortLabelKey: "categories",
  },
];

function EditRecipe({ person, onSave, onCancel, groups = [] }) {
  const { t } = useLanguage();
  const { currentUser, addCategory } = useRecipeBook();
  const { getTranslated: getTranslatedGroup } = useTranslatedList(
    groups,
    "name",
  );
  const [activeTab, setActiveTab] = useState("basic");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const fileInputRef = useRef(null);
  const ingredientsListRef = useRef(null);
  const instructionsListRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragField, setDragField] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleTouchReorder = useCallback((fromIndex, toIndex, field) => {
    setEditedPerson((prev) => {
      const items = [...prev[field]];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...prev, [field]: items };
    });
  }, []);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } =
    useTouchDragDrop(handleTouchReorder);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const onMove = (e) => handleTouchMove(e);
    const onEnd = (e) => handleTouchEnd(e);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);
  const [editedPerson, setEditedPerson] = useState({
    name: person.name,
    image_src: person.image_src || "",
    ingredients: Array.isArray(person.ingredients)
      ? [...person.ingredients]
      : [],
    instructions: Array.isArray(person.instructions)
      ? [...person.instructions]
      : [],
    prepTime: person.prepTime || "",
    cookTime: person.cookTime || "",
    servings: person.servings || "",
    difficulty: person.difficulty || "Unknown",
    sourceUrl: person.sourceUrl || "",
    categories: person.categories || [],
    isFavorite: person.isFavorite || false,
    notes: person.notes || "",
    rating: person.rating || 0,
    shareToGlobal: person.shareToGlobal || false,
    nutrition: {
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
      sugars: "",
      sodium: "",
      calcium: "",
      iron: "",
      cholesterol: "",
      saturatedFat: "",
      note: "",
      ...person.nutrition,
    },
  });

  const handleServingsChange = (e) => {
    const newServings = e.target.value;
    setEditedPerson((prev) => ({
      ...prev,
      servings: newServings,
    }));
  };

  useEffect(() => {
    setEditedPerson({
      name: person.name,
      image_src: person.image_src || "",
      ingredients: Array.isArray(person.ingredients)
        ? [...person.ingredients]
        : [],
      instructions: Array.isArray(person.instructions)
        ? [...person.instructions]
        : [],
      prepTime: person.prepTime || "",
      cookTime: person.cookTime || "",
      servings: person.servings || "",
      difficulty: person.difficulty || "Unknown",
      sourceUrl: person.sourceUrl || "",
      categories: person.categories || [],
      isFavorite: person.isFavorite || false,
      notes: person.notes || "",
      rating: person.rating || 0,
      shareToGlobal: person.shareToGlobal || false,
      nutrition: {
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        fiber: "",
        sugars: "",
        sodium: "",
        calcium: "",
        iron: "",
        cholesterol: "",
        saturatedFat: "",
        note: "",
        ...person.nutrition,
      },
    });
  }, [person]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedPerson({
      ...editedPerson,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingImage(true);
      try {
        const userId = currentUser?.uid;
        const url = await uploadRecipeImage(userId, person.id, file);
        setEditedPerson((prev) => ({ ...prev, image_src: url }));
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Error uploading image");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleIngredientChange = (index, value) => {
    setEditedPerson((prev) => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = value;
      return { ...prev, ingredients: newIngredients };
    });
  };

  const addIngredient = () => {
    setEditedPerson((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ""],
    }));
  };

  const addIngredientGroup = () => {
    setEditedPerson((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, makeGroupHeader(""), ""],
    }));
  };

  const removeIngredient = (index) => {
    setEditedPerson((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleInstructionChange = (index, value) => {
    setEditedPerson((prev) => {
      const newInstructions = [...prev.instructions];
      newInstructions[index] = value;
      return { ...prev, instructions: newInstructions };
    });
  };

  const addInstruction = () => {
    setEditedPerson((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ""],
    }));
  };

  const removeInstruction = (index) => {
    setEditedPerson((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }));
  };

  const toggleFavorite = () => {
    setEditedPerson((prev) => ({
      ...prev,
      isFavorite: !prev.isFavorite,
    }));
  };

  const toggleCategory = (catId) => {
    setEditedPerson((prev) => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter((c) => c !== catId)
        : [...prev.categories, catId],
    }));
  };

  const handleDragStart = (index, field) => {
    setDragIndex(index);
    setDragField(field);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex, field) => {
    if (dragIndex === null || dragField !== field || dragIndex === dropIndex)
      return;
    setEditedPerson((prev) => {
      const items = [...prev[field]];
      const draggedItem = items[dragIndex];
      items.splice(dragIndex, 1);
      items.splice(dropIndex, 0, draggedItem);
      return { ...prev, [field]: items };
    });
    setDragIndex(null);
    setDragField(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragField(null);
  };

  const handleMoveItem = (index, direction, field) => {
    setEditedPerson((prev) => {
      const items = [...prev[field]];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= items.length) return prev;
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return { ...prev, [field]: items };
    });
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    const filledIngredients = ingredientsOnly(
      editedPerson.ingredients.map((i) => i.trim()).filter((i) => i),
    );
    const filledAll = editedPerson.ingredients
      .map((i) => i.trim())
      .filter((i) => i);
    let nutrition = { ...editedPerson.nutrition };
    let nutritionCalculated = false;

    if (filledIngredients.length > 0) {
      try {
        setSavedMessage("⏳ מחשב ערכים תזונתיים...");
        clearNutritionCache();
        const result = await calculateNutrition(
          filledIngredients,
          editedPerson.servings,
        );
        if (result && !result.error) {
          for (const key of Object.keys(result)) {
            nutrition[key] = result[key];
          }
          nutritionCalculated = true;
        } else {
          console.warn("Nutrition calculation returned error:", result?.error);
          const msg =
            result?.error === "QUOTA_EXCEEDED"
              ? t("recipes", "nutritionQuotaError")
              : `⚠️ ${t("recipes", "nutritionError")}`;
          setSavedMessage(msg);
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (err) {
        console.error("Nutrition calculation failed:", err);
        setSavedMessage(`⚠️ ${t("recipes", "nutritionError")}`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    const updatedPerson = {
      ...person,
      name: editedPerson.name,
      image_src: editedPerson.image_src,
      ingredients: filledAll,
      instructions: editedPerson.instructions
        .map((i) => i.trim())
        .filter((i) => i),
      prepTime: editedPerson.prepTime,
      cookTime: editedPerson.cookTime,
      servings: parseInt(editedPerson.servings) || 1,
      difficulty: editedPerson.difficulty,
      sourceUrl: editedPerson.sourceUrl,
      categories: editedPerson.categories,
      isFavorite: editedPerson.isFavorite,
      notes: editedPerson.notes,
      rating: editedPerson.rating || 0,
      shareToGlobal: editedPerson.shareToGlobal,
      nutrition,
    };
    console.log(
      "🍎 NUTRITION - Saving recipe with nutrition:",
      updatedPerson.nutrition,
    );
    await onSave(updatedPerson);
    setSaving(false);
    if (nutritionCalculated) {
      setSavedMessage(
        `✅ ${t("recipes", "saved")} (🔥 ${nutrition.calories || "?"} kcal)`,
      );
    } else {
      setSavedMessage("✅ " + t("recipes", "saved"));
    }
    setTimeout(() => setSavedMessage(""), 4000);
  };

  // ========== Add Category Inline ==========
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const handleAddNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#9B59B6", "#3498DB", "#F1C40F", "#2ECC71", "#E67E22", "#1ABC9C"];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newCat = await addCategory({ id: Date.now().toString(), name, description: `${name}`, color });
    if (newCat) {
      setEditedPerson((prev) => ({ ...prev, categories: [...prev.categories, newCat.id] }));
    }
    setNewCategoryName("");
    setShowNewCategoryInput(false);
  };

  const renderBasicTab = () => (
    <>
      <h3 className={classes.sectionTitle}>{t("addWizard", "basicInfo")}</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <button
          type="button"
          className={`${classes.favoriteBtn} ${editedPerson.isFavorite ? classes.favoriteBtnActive : ""}`}
          onClick={toggleFavorite}
        >
          {editedPerson.isFavorite ? (
            <Heart size={22} fill="red" stroke="red" />
          ) : (
            <Heart size={22} />
          )}
          {/* // <Star
          //   size={22}
          //   fill={editedPerson.isFavorite ? "#e53935" : "none"}
          // />{" "} */}
          <span>
            {t(
              "recipes",
              editedPerson.isFavorite
                ? "removeFromFavorites"
                : "addToFavorites",
            )}
          </span>
        </button>
      </div>

      <div className={classes.formGroup}>
        <label className={classes.formLabel}>
          {t("recipes", "recipeName")}
          <span>*</span>
        </label>
        <input
          type="text"
          className={classes.formInput}
          value={editedPerson.name}
          onChange={(e) =>
            setEditedPerson((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>

      <div className={classes.formRowThree}>
        <div className={classes.formGroup}>
          <label className={classes.formLabel}>{t("recipes", "rating")}</label>
          <div className={classes.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${classes.starBtn} ${star <= (editedPerson.rating || 0) ? classes.starBtnActive : ""}`}
                onClick={() =>
                  setEditedPerson((prev) => ({
                    ...prev,
                    rating: star === prev.rating ? 0 : star,
                  }))
                }
              >
                <Star
                  size={20}
                  fill={star <= (editedPerson.rating || 0) ? "#ffc107" : "none"}
                />
              </button>
            ))}
          </div>
        </div>
        <div className={classes.formGroup}>
          <label className={classes.formLabel}>
            {t("recipes", "servings")}
          </label>
          <input
            type="number"
            className={classes.formInput}
            value={editedPerson.servings}
            onChange={handleServingsChange}
            min="1"
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.formLabel}>
            {t("recipes", "difficulty")}
          </label>
          <select
            className={classes.formSelect}
            value={editedPerson.difficulty}
            onChange={(e) =>
              setEditedPerson((prev) => ({
                ...prev,
                difficulty: e.target.value,
              }))
            }
          >
            <option value="Unknown">{t("difficulty", "Unknown")}</option>
            <option value="VeryEasy">{t("difficulty", "VeryEasy")}</option>
            <option value="Easy">{t("difficulty", "Easy")}</option>
            <option value="Medium">{t("difficulty", "Medium")}</option>
            <option value="Hard">{t("difficulty", "Hard")}</option>
          </select>
        </div>
      </div>

      <div className={classes.formRow}>
        <div className={classes.formGroup}>
          <label className={classes.formLabel}>
            {t("recipes", "cookTime")} ({t("addWizard", "min")})
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            className={classes.formInput}
            value={editedPerson.cookTime}
            onChange={(e) =>
              setEditedPerson((prev) => ({
                ...prev,
                cookTime: e.target.value.replace(/[^0-9]/g, ""),
              }))
            }
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.formLabel}>
            {t("recipes", "prepTime")} ({t("addWizard", "min")})
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            className={classes.formInput}
            value={editedPerson.prepTime}
            onChange={(e) =>
              setEditedPerson((prev) => ({
                ...prev,
                prepTime: e.target.value.replace(/[^0-9]/g, ""),
              }))
            }
          />
        </div>
      </div>

      <div className={classes.formGroup}>
        <label className={classes.formLabel}>{t("recipes", "notes")}</label>
        <textarea
          className={classes.formTextarea}
          value={editedPerson.notes}
          onChange={(e) =>
            setEditedPerson((prev) => ({ ...prev, notes: e.target.value }))
          }
        />
      </div>

      <div className={classes.formGroup}>
        <label className={classes.formLabel}>{t("recipes", "sourceUrl")}</label>
        <input
          type="url"
          className={classes.formInput}
          placeholder="https://..."
          value={editedPerson.sourceUrl}
          onChange={(e) =>
            setEditedPerson((prev) => ({
              ...prev,
              sourceUrl: e.target.value,
            }))
          }
        />
      </div>

      {!person.copiedFrom && (
        <div className={classes.formGroup}>
          <label className={classes.checkboxLabel}>
            <input
              type="checkbox"
              name="shareToGlobal"
              checked={editedPerson.shareToGlobal}
              onChange={handleChange}
            />
            <Globe size={16} />
            <span>{t("recipes", "shareToGlobal")}</span>
          </label>
        </div>
      )}
    </>
  );

  const renderIngredientsTab = () => {
    let ingredientCounter = 0;
    return (
      <>
        <h3 className={classes.sectionTitle}>{t("recipes", "ingredients")}</h3>
        <div className={classes.dynamicList} ref={ingredientsListRef}>
          {editedPerson.ingredients.map((ing, i) => {
            const isGroup = isGroupHeader(ing);
            if (!isGroup) ingredientCounter++;
            return (
              <div
                key={i}
                data-drag-item
                className={`${isGroup ? classes.groupItem : classes.dynamicItem} ${dragIndex === i && dragField === "ingredients" ? classes.dragging : ""}`}
                draggable
                onDragStart={() => handleDragStart(i, "ingredients")}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(i, "ingredients")}
                onDragEnd={handleDragEnd}
              >
                <span
                  className={classes.dragHandle}
                  onTouchStart={(e) =>
                    handleTouchStart(e, i, "ingredients", ingredientsListRef)
                  }
                >
                  <GripVertical size={16} />
                </span>
                {isGroup ? (
                  <div className={classes.groupInputBox}>
                    <input
                      className={classes.groupInput}
                      placeholder={t("addWizard", "groupPlaceholder")}
                      value={getGroupName(ing)}
                      onChange={(e) =>
                        handleIngredientChange(
                          i,
                          makeGroupHeader(e.target.value),
                        )
                      }
                    />
                    <button
                      type="button"
                      className={classes.removeItemBtn}
                      onClick={() => removeIngredient(i)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className={classes.inputBox}>
                    <textarea
                      className={classes.dynamicItemInput}
                      placeholder={`${t("addWizard", "ingredient")} ${ingredientCounter}`}
                      value={ing}
                      rows={1}
                      onChange={(e) =>
                        handleIngredientChange(i, e.target.value)
                      }
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                      ref={(el) => {
                        if (el) {
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }
                      }}
                    />
                    {editedPerson.ingredients.length > 1 && (
                      <button
                        type="button"
                        className={classes.removeItemBtn}
                        onClick={() => removeIngredient(i)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className={classes.addItemRow}>
            <button
              type="button"
              className={classes.addItemBtn}
              onClick={addIngredient}
            >
              + {t("addWizard", "addIngredient")}
            </button>
            <button
              type="button"
              className={classes.addGroupBtn}
              onClick={addIngredientGroup}
            >
              + {t("addWizard", "addGroup")}
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderInstructionsTab = () => (
    <>
      <h3 className={classes.sectionTitle}>{t("recipes", "instructions")}</h3>
      <div className={classes.dynamicList} ref={instructionsListRef}>
        {editedPerson.instructions.map((inst, i) => (
          <div
            key={i}
            data-drag-item
            className={`${classes.dynamicItem} ${dragIndex === i && dragField === "instructions" ? classes.dragging : ""}`}
            draggable
            onDragStart={() => handleDragStart(i, "instructions")}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(i, "instructions")}
            onDragEnd={handleDragEnd}
          >
            <span
              className={classes.dragHandle}
              onTouchStart={(e) =>
                handleTouchStart(e, i, "instructions", instructionsListRef)
              }
            >
              <GripVertical size={16} />
            </span>
            <div className={classes.instructionBox}>
              {editedPerson.instructions.length > 1 && (
                <button
                  type="button"
                  className={classes.instructionRemoveBtn}
                  onClick={() => removeInstruction(i)}
                >
                  <X size={16} />
                </button>
              )}
              <div className={classes.instructionContent}>
                <span className={classes.dynamicItemNumber}>{i + 1}.</span>
                <textarea
                  className={classes.dynamicItemTextarea}
                  placeholder={`${t("addWizard", "step")} ${i + 1}...`}
                  value={inst}
                  onChange={(e) => handleInstructionChange(i, e.target.value)}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className={classes.addItemBtn}
          onClick={addInstruction}
        >
          + {t("addWizard", "addStep")}
        </button>
      </div>
    </>
  );

  const renderImageTab = () => (
    <>
      <h3 className={classes.sectionTitle}>{t("addWizard", "recipeImage")}</h3>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />
      <div
        className={classes.imageUploadArea}
        onClick={() => fileInputRef.current?.click()}
      >
        {editedPerson.image_src ? (
          <>
            <img
              src={editedPerson.image_src}
              alt="Preview"
              className={classes.imagePreview}
            />
            <button
              type="button"
              className={classes.imageRemoveBtn}
              onClick={(e) => {
                e.stopPropagation();
                setEditedPerson((prev) => ({ ...prev, image_src: "" }));
              }}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <Camera className={classes.imageUploadIcon} />
            <span className={classes.imageUploadText}>
              {uploadingImage
                ? t("recipes", "uploading")
                : t("addWizard", "uploadImage")}
            </span>
          </>
        )}
      </div>
    </>
  );

  const renderCategoriesTab = () => (
    <>
      <h3 className={classes.sectionTitle}>{t("addWizard", "categories")}</h3>

      <div className={classes.categorySection}>
        <p className={classes.categorySubtitle}>
          {t("addWizard", "selectedCategories")}
        </p>
        <div className={classes.categoryChips}>
          {groups
            .filter(
              (g) => g.id !== "all" && editedPerson.categories.includes(g.id),
            )
            .map((group) => (
              <button
                key={group.id}
                type="button"
                className={`${classes.categoryChip} ${classes.categoryChipActive}`}
                onClick={() => toggleCategory(group.id)}
              >
                ✕ {getTranslatedGroup(group)}
              </button>
            ))}
        </div>
      </div>

      <div className={classes.categorySection}>
        <p className={classes.categorySubtitle}>
          {t("addWizard", "availableCategories")}
        </p>
        <div className={classes.categoryChips}>
          {groups
            .filter(
              (g) => g.id !== "all" && !editedPerson.categories.includes(g.id),
            )
            .map((group) => (
              <button
                key={group.id}
                type="button"
                className={classes.categoryChip}
                onClick={() => toggleCategory(group.id)}
              >
                + {getTranslatedGroup(group)}
              </button>
            ))}
          {showNewCategoryInput ? (
            <div className={classes.newCategoryInline}>
              <input
                type="text"
                className={classes.newCategoryInput}
                placeholder={t("categories", "categoryName")}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleAddNewCategory(); }
                  if (e.key === "Escape") { setShowNewCategoryInput(false); setNewCategoryName(""); }
                }}
                autoFocus
              />
              <button type="button" className={classes.newCategoryConfirmBtn} onClick={handleAddNewCategory} disabled={!newCategoryName.trim()}>
                <Check size={18} />
              </button>
              <button type="button" className={classes.newCategoryCancelBtn} onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(""); }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" className={classes.addCategoryChip} onClick={() => setShowNewCategoryInput(true)}>
              <Plus size={14} /> {t("categories", "addCategory")}
            </button>
          )}
        </div>
      </div>
    </>
  );

  const renderDeleteTab = () => (
    <div className={classes.deleteSection}>
      <h3 className={classes.sectionTitle}>{t("confirm", "deleteRecipe")}</h3>
      <p style={{ color: "#888", marginBottom: "1.5rem" }}>
        {t("confirm", "deleteRecipeMsg")} {t("confirm", "cannotUndo")}
      </p>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "basic":
        return renderBasicTab();
      case "ingredients":
        return renderIngredientsTab();
      case "instructions":
        return renderInstructionsTab();
      case "image":
        return renderImageTab();
      case "categories":
        return renderCategoriesTab();
      case "delete":
        return renderDeleteTab();
      default:
        return renderBasicTab();
    }
  };

  return (
    <Modal onClose={onCancel}>
      <div className={classes.editContainer}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div className={classes.editHeader}>
            <div className={classes.editHeaderInfo}>
              <CloseButton
                // type="button"
                className={classes.editCloseBtn}
                onClick={onCancel}
              ></CloseButton>
              <div className={classes.editTitleGroup}>
                <h2>{t("recipes", "editRecipe")}</h2>
                <p>{editedPerson.name}</p>
              </div>
            </div>
            <div className={classes.editHeaderActions}>
              {savedMessage && (
                <span className={classes.savedMessage}>{savedMessage}</span>
              )}
              <button
                type="button"
                className={classes.saveBtn}
                onClick={handleSubmit}
                disabled={saving}
              >
                <Save size={16} />{" "}
                {saving ? t("common", "loading") : t("recipes", "saveChanges")}
              </button>
            </div>
          </div>

          <div className={classes.editBody}>
            <div className={classes.sidebar}>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`${classes.sidebarTab} ${activeTab === tab.id ? classes.sidebarTabActive : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className={classes.sidebarTabIcon}>
                      <Icon />
                    </span>
                    {t(
                      "addWizard",
                      isMobile ? tab.shortLabelKey : tab.labelKey,
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                className={`${classes.sidebarTab} ${classes.sidebarTabDelete} ${activeTab === "delete" ? classes.sidebarTabActive : ""}`}
                onClick={() => setActiveTab("delete")}
              >
                <span className={classes.sidebarTabIcon}>
                  <Trash2 />
                </span>
                {isMobile
                  ? t("confirm", "deleteRecipeShort")
                  : t("confirm", "deleteRecipe")}
              </button>
            </div>

            <div className={classes.contentArea}>{renderActiveTab()}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default EditRecipe;
