import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "../../modal";
import {
  FiX,
  FiStar,
  FiCamera,
  FiMenu,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import {
  BsFileText,
  BsListUl,
  BsListOl,
  BsImage,
  BsTags,
  BsBarChart,
  BsCalculator,
} from "react-icons/bs";
import { useLanguage } from "../../../context";
import { calculateNutrition } from "../../../services/openai";
import { useTouchDragDrop } from "../../../hooks/useTouchDragDrop";
import useTranslatedList from "../../../hooks/useTranslatedList";
import classes from "./edit-recipe.module.css";
import { CloseButton } from "../../controls";

const TABS = [
  { id: "basic", icon: BsFileText, labelKey: "basicInfo" },
  { id: "ingredients", icon: BsListUl, labelKey: "ingredients" },
  { id: "instructions", icon: BsListOl, labelKey: "instructions" },
  { id: "image", icon: BsImage, labelKey: "recipeImage" },
  { id: "categories", icon: BsTags, labelKey: "categories" },
  { id: "nutrition", icon: BsBarChart, labelKey: "nutrition" },
];

function EditRecipe({ person, onSave, onCancel, groups = [] }) {
  const { t } = useLanguage();
  const { getTranslated: getTranslatedGroup } = useTranslatedList(
    groups,
    "name",
  );
  const [activeTab, setActiveTab] = useState("basic");
  const fileInputRef = useRef(null);
  const ingredientsListRef = useRef(null);
  const instructionsListRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragField, setDragField] = useState(null);
  const [calculatingNutrition, setCalculatingNutrition] = useState(false);
  const [nutritionMessage, setNutritionMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

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
    nutrition: {
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
      sugars: "",
      note: "",
      ...person.nutrition,
    },
  });

  const nutritionBaseServings = useRef(parseInt(person.servings) || 1);
  const nutritionBaseValues = useRef({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    sugars: "",
    note: "",
    ...person.nutrition,
  });
  const scaleNutritionValue = (text, ratio) => {
    if (!text || typeof text !== "string") return text;
    return text.replace(/(\d+\.?\d*)/g, (match) => {
      const num = parseFloat(match);
      const scaled = num * ratio;
      return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
    });
  };

  const handleServingsChange = (e) => {
    const newServings = e.target.value;
    const newServingsNum = parseInt(newServings);

    if (newServingsNum > 0 && nutritionBaseServings.current > 0) {
      const ratio = nutritionBaseServings.current / newServingsNum;
      const scaledNutrition = {};
      for (const key of [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugars",
      ]) {
        scaledNutrition[key] = scaleNutritionValue(
          nutritionBaseValues.current[key],
          ratio,
        );
      }
      scaledNutrition.note = editedPerson.nutrition.note;
      setEditedPerson((prev) => ({
        ...prev,
        servings: newServings,
        nutrition: scaledNutrition,
      }));
    } else {
      setEditedPerson((prev) => ({
        ...prev,
        servings: newServings,
      }));
    }
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
      nutrition: {
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        fiber: "",
        sugars: "",
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image to fit Firebase 1MB limit
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions to keep image under 800KB
          const maxSize = 800 * 1024; // 800KB to be safe
          let quality = 0.7;

          // Scale down if image is too large
          const maxDimension = 1200;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          let compressedBase64 = canvas.toDataURL("image/jpeg", quality);

          // If still too large, reduce quality further
          while (compressedBase64.length > maxSize && quality > 0.1) {
            quality -= 0.1;
            compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          }

          console.log(
            "📸 Image compressed from",
            reader.result.length,
            "to",
            compressedBase64.length,
            "bytes",
          );

          setEditedPerson((prev) => ({
            ...prev,
            image_src: compressedBase64,
          }));
          setUploadingImage(false);
        };
        img.onerror = () => {
          setUploadingImage(false);
          alert("Error processing image");
        };
        img.src = reader.result;
      };
      reader.onerror = () => {
        setUploadingImage(false);
        alert("Error uploading image");
      };
      reader.readAsDataURL(file);
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

  const updateNutrition = (field, value) => {
    setEditedPerson((prev) => ({
      ...prev,
      nutrition: { ...prev.nutrition, [field]: value },
    }));
  };

  const handleCalculateNutrition = async () => {
    const filledIngredients = editedPerson.ingredients.filter((i) => i.trim());
    if (filledIngredients.length === 0) {
      setNutritionMessage(t("addWizard", "noIngredientsForNutrition"));
      return;
    }
    setCalculatingNutrition(true);
    setNutritionMessage("");
    try {
      const result = await calculateNutrition(
        filledIngredients,
        editedPerson.servings,
      );
      if (result && !result.error) {
        const newNutrition = {
          calories: result.calories || "",
          protein: result.protein || "",
          fat: result.fat || "",
          carbs: result.carbs || "",
          sugars: result.sugars || "",
          fiber: result.fiber || "",
        };
        setEditedPerson((prev) => ({
          ...prev,
          nutrition: { ...prev.nutrition, ...newNutrition },
        }));
        nutritionBaseValues.current = {
          ...nutritionBaseValues.current,
          ...newNutrition,
        };
        nutritionBaseServings.current = parseInt(editedPerson.servings) || 1;
        setNutritionMessage(t("addWizard", "nutritionCalculated"));
      } else {
        setNutritionMessage(t("addWizard", "nutritionError"));
      }
    } catch (err) {
      console.error("Nutrition calculation failed:", err);
      setNutritionMessage(t("addWizard", "nutritionError"));
    } finally {
      setCalculatingNutrition(false);
    }
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
    const filledIngredients = editedPerson.ingredients
      .map((i) => i.trim())
      .filter((i) => i);
    let nutrition = editedPerson.nutrition;
    if (filledIngredients.length > 0) {
      try {
        const result = await calculateNutrition(
          filledIngredients,
          editedPerson.servings,
        );
        if (result && !result.error) {
          nutrition = {
            ...nutrition,
            calories: result.calories || nutrition.calories,
            protein: result.protein || nutrition.protein,
            fat: result.fat || nutrition.fat,
            carbs: result.carbs || nutrition.carbs,
            sugars: result.sugars || nutrition.sugars,
            fiber: result.fiber || nutrition.fiber,
          };
        }
      } catch (err) {
        console.error("Auto nutrition calculation failed:", err);
      }
    }
    const updatedPerson = {
      ...person,
      name: editedPerson.name,
      image_src: editedPerson.image_src,
      ingredients: filledIngredients,
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
      nutrition,
    };
    onSave(updatedPerson);
    setSavedMessage(t("recipes", "saved"));
    setTimeout(() => setSavedMessage(""), 4000);
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
          <FiStar
            size={22}
            fill={editedPerson.isFavorite ? "#ffc107" : "none"}
          />{" "}
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
                <FiStar
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
            type="text"
            className={classes.formInput}
            value={editedPerson.cookTime}
            onChange={(e) =>
              setEditedPerson((prev) => ({
                ...prev,
                cookTime: e.target.value,
              }))
            }
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.formLabel}>
            {t("recipes", "prepTime")} ({t("addWizard", "min")})
          </label>
          <input
            type="text"
            className={classes.formInput}
            value={editedPerson.prepTime}
            onChange={(e) =>
              setEditedPerson((prev) => ({
                ...prev,
                prepTime: e.target.value,
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
    </>
  );

  const renderIngredientsTab = () => (
    <>
      <h3 className={classes.sectionTitle}>{t("recipes", "ingredients")}</h3>
      <div className={classes.dynamicList} ref={ingredientsListRef}>
        {editedPerson.ingredients.map((ing, i) => (
          <div
            key={i}
            data-drag-item
            className={`${classes.dynamicItem} ${dragIndex === i && dragField === "ingredients" ? classes.dragging : ""}`}
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
              <FiMenu size={16} />
            </span>
            <div className={classes.inputBox}>
              <textarea
                className={classes.dynamicItemInput}
                placeholder={`${t("addWizard", "ingredient")} ${i + 1}`}
                value={ing}
                rows={1}
                onChange={(e) => handleIngredientChange(i, e.target.value)}
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
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          className={classes.addItemBtn}
          onClick={addIngredient}
        >
          + {t("addWizard", "addIngredient")}
        </button>
      </div>
    </>
  );

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
              <FiMenu size={16} />
            </span>
            <div className={classes.instructionBox}>
              {editedPerson.instructions.length > 1 && (
                <button
                  type="button"
                  className={classes.instructionRemoveBtn}
                  onClick={() => removeInstruction(i)}
                >
                  <FiX />
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
              ✕
            </button>
          </>
        ) : (
          <>
            <FiCamera className={classes.imageUploadIcon} />
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
        </div>
      </div>
    </>
  );

  const renderNutritionTab = () => (
    <>
      <h3 className={classes.sectionTitle}>
        {t("addWizard", "nutritionValues")}
      </h3>
      <div className={classes.nutritionActions}>
        <button
          type="button"
          className={classes.calculateNutritionBtn}
          onClick={handleCalculateNutrition}
          disabled={calculatingNutrition}
        >
          <BsCalculator className={classes.calculateNutritionIcon} />
          <span>
            {calculatingNutrition
              ? t("addWizard", "calculatingNutrition")
              : editedPerson.nutrition?.calories
                ? t("addWizard", "updateNutrition")
                : t("addWizard", "calculateNutrition")}
          </span>
        </button>
        {nutritionMessage && (
          <p className={classes.nutritionMessage}>{nutritionMessage}</p>
        )}
      </div>
      <p className={classes.nutritionNote}>
        {t("addWizard", "nutritionAutoUpdateNote")}
      </p>
      <div className={classes.nutritionGrid}>
        {[
          { key: "calories", label: `${t("recipes", "calories")} (kcal)` },
          {
            key: "protein",
            label: `${t("recipes", "protein")} (${t("addWizard", "grams")})`,
          },
          {
            key: "fat",
            label: `${t("recipes", "fat")} (${t("addWizard", "grams")})`,
          },
          {
            key: "carbs",
            label: `${t("recipes", "carbs")} (${t("addWizard", "grams")})`,
          },
          {
            key: "sugars",
            label: `${t("recipes", "sugars")} (${t("addWizard", "grams")})`,
          },
          {
            key: "fiber",
            label: `${t("recipes", "fiber")} (${t("addWizard", "grams")})`,
          },
        ].map(({ key, label }) => (
          <div key={key} className={classes.formGroup}>
            <label className={classes.formLabel}>{label}</label>
            <input
              type="text"
              className={classes.formInput}
              value={editedPerson.nutrition[key]}
              onChange={(e) => updateNutrition(key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className={classes.formGroup}>
        <label className={classes.formLabel}>{t("recipes", "note")}</label>
        <input
          type="text"
          className={classes.formInput}
          value={editedPerson.nutrition.note}
          onChange={(e) => updateNutrition("note", e.target.value)}
        />
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
      case "nutrition":
        return renderNutritionTab();
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
              >
                {/* <FiX/> */}
              </CloseButton>
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
              >
                <FiSave size={16} /> {t("recipes", "saveChanges")}
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
                    onClick={() => {
                      setActiveTab(tab.id);
                      setNutritionMessage("");
                    }}
                  >
                    <span className={classes.sidebarTabIcon}>
                      <Icon />
                    </span>
                    {t("addWizard", tab.labelKey)}
                  </button>
                );
              })}
              <button
                type="button"
                className={`${classes.sidebarTab} ${classes.sidebarTabDelete} ${activeTab === "delete" ? classes.sidebarTabActive : ""}`}
                onClick={() => {
                  setActiveTab("delete");
                  setNutritionMessage("");
                }}
              >
                <span className={classes.sidebarTabIcon}>
                  <FiTrash2 />
                </span>
                {t("confirm", "deleteRecipe")}
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
