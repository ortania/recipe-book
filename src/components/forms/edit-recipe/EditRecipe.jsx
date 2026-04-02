import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "../../modal";
import {
  Save,
  Trash2,
  FileText,
  List,
  ListOrdered,
  Image,
  Tags,
  Loader,
  CircleCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useLanguage, useRecipeBook } from "../../../context";
import { uploadRecipeImage } from "../../../firebase/imageService";
import { useTouchDragDrop } from "../../../hooks/useTouchDragDrop";
import useTranslatedList from "../../../hooks/useTranslatedList";
import buttonClasses from "../../../styles/shared/buttons.module.css";
import catShared from "../../../styles/shared/category-chips.module.css";
import shared from "../../../styles/shared/form-shared.module.css";
import _editClasses from "./edit-recipe.module.css";
import { CloseButton, Toast } from "../../controls";
import {
  calculateNutrition,
  generateRecipeImageDataUrl,
} from "../../../services/openai";
import { ingredientsOnly } from "../../../utils/ingredientUtils";
import { makeGroupHeader } from "../../../utils/ingredientUtils";
import { EditRecipeContext } from "./EditRecipeContext";
import { ConfirmDialog } from "../confirm-dialog";
import BasicTab from "./tabs/BasicTab";
import IngredientsTab from "./tabs/IngredientsTab";
import InstructionsTab from "./tabs/InstructionsTab";
import ImageTab from "./tabs/ImageTab";
import CategoriesTab from "./tabs/CategoriesTab";
import DeleteTab from "./tabs/DeleteTab";

const classes = _editClasses;

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

function EditRecipe({
  recipe,
  onSave,
  onCancel,
  onSaved,
  onDelete,
  groups = [],
}) {
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
  const [generatingAiImage, setGeneratingAiImage] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragField, setDragField] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToast, setImageToast] = useState({
    open: false,
    message: null,
    variant: "success",
    duration: 4000,
  });
  const [editImageDragOver, setEditImageDragOver] = useState(false);

  const handleTouchReorder = useCallback((fromIndex, toIndex, field) => {
    setEditedRecipe((prev) => {
      const items = [...prev[field]];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...prev, [field]: items };
    });
  }, []);

  const {
    handleTouchStart,
    handleLongPressStart,
    isActive: isTouchDragActive,
    justFinishedRef: touchDragJustFinishedRef,
  } = useTouchDragDrop(handleTouchReorder);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [editedRecipe, setEditedRecipe] = useState({
    name: recipe.name,
    image_src: recipe.image_src || "",
    images: recipe.images || (recipe.image_src ? [recipe.image_src] : []),
    ingredients: Array.isArray(recipe.ingredients)
      ? [...recipe.ingredients]
      : [],
    instructions: Array.isArray(recipe.instructions)
      ? [...recipe.instructions]
      : [],
    prepTime: recipe.prepTime || "",
    cookTime: recipe.cookTime || "",
    servings: recipe.servings || "",
    difficulty: recipe.difficulty || "Unknown",
    sourceUrl: recipe.sourceUrl || "",
    author: recipe.author || "",
    videoUrl: recipe.videoUrl || "",
    categories: recipe.categories || [],
    isFavorite: recipe.isFavorite || false,
    notes: recipe.notes || "",
    rating: recipe.rating || 0,
    shareToGlobal: recipe.shareToGlobal || false,
    showMyName: recipe.showMyName || false,
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
      ...recipe.nutrition,
    },
  });

  const handleServingsChange = (e) => {
    const newServings = e.target.value;
    setEditedRecipe((prev) => ({
      ...prev,
      servings: newServings,
    }));
  };

  useEffect(() => {
    setEditedRecipe({
      name: recipe.name,
      image_src: recipe.image_src || "",
      images: recipe.images || (recipe.image_src ? [recipe.image_src] : []),
      ingredients: Array.isArray(recipe.ingredients)
        ? [...recipe.ingredients]
        : [],
      instructions: Array.isArray(recipe.instructions)
        ? [...recipe.instructions]
        : [],
      prepTime: recipe.prepTime || "",
      cookTime: recipe.cookTime || "",
      servings: recipe.servings || "",
      difficulty: recipe.difficulty || "Unknown",
      sourceUrl: recipe.sourceUrl || "",
      author: recipe.author || "",
      videoUrl: recipe.videoUrl || "",
      categories: recipe.categories || [],
      isFavorite: recipe.isFavorite || false,
      notes: recipe.notes || "",
      rating: recipe.rating || 0,
      shareToGlobal: recipe.shareToGlobal || false,
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
        ...recipe.nutrition,
      },
    });
  }, [recipe]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedRecipe({
      ...editedRecipe,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageUpload = async (e) => {
    const inputEl = e.target;
    const files = Array.from(inputEl.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    setSavedMessage(
      <>
        <Loader size={18} className={classes.spinIcon} /> {files.length}{" "}
        file(s)...
      </>,
    );

    const resetInput = () => {
      try {
        inputEl.value = "";
      } catch {}
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const safetyTimer = setTimeout(() => {
      setUploadingImage(false);
      setSavedMessage(
        <>
          <AlertTriangle size={18} /> Timeout
        </>,
      );
      resetInput();
      setTimeout(() => setSavedMessage(""), 4000);
    }, 60000);

    try {
      const userId = currentUser?.uid;
      if (!userId) throw new Error("Not logged in");
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        setSavedMessage(
          <>
            <Loader size={18} className={classes.spinIcon} /> {i + 1}/
            {files.length}...
          </>,
        );
        const url = await uploadRecipeImage(
          userId,
          `${recipe.id}_${Date.now()}_${i}`,
          files[i],
        );
        urls.push(url);
      }
      setEditedRecipe((prev) => {
        const allImages = [...(prev.images || []), ...urls];
        return { ...prev, images: allImages, image_src: allImages[0] || "" };
      });
      setSavedMessage(
        <>
          <CircleCheck size={18} /> {urls.length} uploaded
        </>,
      );
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (err) {
      console.error("Image upload failed:", err);
      setSavedMessage(
        <>
          <AlertTriangle size={18} /> {err.message || "Failed"}
        </>,
      );
      setTimeout(() => setSavedMessage(""), 5000);
    } finally {
      clearTimeout(safetyTimer);
      setUploadingImage(false);
      resetInput();
    }
  };

  const handleRemoveImage = (index) => {
    setEditedRecipe((prev) => {
      const updated = (prev.images || []).filter((_, i) => i !== index);
      return { ...prev, images: updated, image_src: updated[0] || "" };
    });
  };

  const handleReorderImages = (fromIndex, toIndex) => {
    setEditedRecipe((prev) => {
      const imgs = [...(prev.images || [])];
      const [moved] = imgs.splice(fromIndex, 1);
      imgs.splice(toIndex, 0, moved);
      return { ...prev, images: imgs, image_src: imgs[0] || "" };
    });
  };

  const handleEditImageDrop = (e) => {
    e.preventDefault();
    setEditImageDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || /\.jfif$/i.test(f.name),
    );
    if (files.length === 0) return;
    handleImageUpload({ target: { files }, preventDefault: () => {} });
  };

  const handlePasteImage = useCallback(
    async (file) => {
      if (!file || uploadingImage || generatingAiImage) return;
      setUploadingImage(true);
      try {
        const userId = currentUser?.uid;
        if (!userId) throw new Error("Not logged in");
        const url = await uploadRecipeImage(
          userId,
          `${recipe.id}_${Date.now()}_paste`,
          file,
        );
        setEditedRecipe((prev) => {
          const allImages = [...(prev.images || []), url];
          return { ...prev, images: allImages, image_src: allImages[0] || "" };
        });
      } catch (err) {
        console.error("Paste image failed:", err);
      } finally {
        setUploadingImage(false);
      }
    },
    [currentUser, recipe.id, uploadingImage, generatingAiImage],
  );

  const handleGenerateAiImage = async () => {
    if (!editedRecipe.name?.trim()) {
      setImageToast({
        open: true,
        message: (
          <>
            <AlertTriangle size={18} />{" "}
            {t("addWizard", "generateAiImageNeedName")}
          </>
        ),
        variant: "error",
        duration: 4000,
      });
      return;
    }
    if (uploadingImage || generatingAiImage) return;

    setGeneratingAiImage(true);

    const safetyTimer = setTimeout(() => {
      setGeneratingAiImage(false);
      setImageToast({
        open: true,
        message: (
          <>
            <AlertTriangle size={18} /> Timeout
          </>
        ),
        variant: "error",
        duration: 5000,
      });
    }, 120000);

    try {
      const userId = currentUser?.uid;
      if (!userId) throw new Error("Not logged in");
      const ingForPrompt = ingredientsOnly(editedRecipe.ingredients || [])
        .map((i) => i.trim())
        .filter(Boolean)
        .slice(0, 15);
      const dataUrl = await generateRecipeImageDataUrl({
        recipeName: editedRecipe.name.trim(),
        ingredients: ingForPrompt,
      });
      const url = await uploadRecipeImage(
        userId,
        `${recipe.id}_${Date.now()}_ai`,
        dataUrl,
      );
      setEditedRecipe((prev) => {
        const allImages = [...(prev.images || []), url];
        return { ...prev, images: allImages, image_src: allImages[0] || "" };
      });
      setImageToast({
        open: true,
        message: (
          <>
            <CircleCheck size={18} /> {t("addWizard", "generateAiImageDone")}
          </>
        ),
        variant: "success",
        duration: 4000,
      });
    } catch (err) {
      console.error("AI image generation failed:", err);
      setImageToast({
        open: true,
        message: (
          <>
            <AlertTriangle size={18} />{" "}
            {err.message || t("addWizard", "generateAiImageError")}
          </>
        ),
        variant: "error",
        duration: 5000,
      });
    } finally {
      clearTimeout(safetyTimer);
      setGeneratingAiImage(false);
    }
  };

  const handleIngredientChange = (index, value) => {
    setEditedRecipe((prev) => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = value;
      return { ...prev, ingredients: newIngredients };
    });
  };

  const addIngredient = () => {
    setEditedRecipe((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ""],
    }));
  };

  const addIngredientGroup = () => {
    setEditedRecipe((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, makeGroupHeader(""), ""],
    }));
  };

  const removeIngredient = (index) => {
    setEditedRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleInstructionChange = (index, value) => {
    setEditedRecipe((prev) => {
      const newInstructions = [...prev.instructions];
      newInstructions[index] = value;
      return { ...prev, instructions: newInstructions };
    });
  };

  const addInstruction = () => {
    setEditedRecipe((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ""],
    }));
  };

  const removeInstruction = (index) => {
    setEditedRecipe((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }));
  };

  const toggleFavorite = () => {
    setEditedRecipe((prev) => ({
      ...prev,
      isFavorite: !prev.isFavorite,
    }));
  };

  const toggleCategory = (catId) => {
    setEditedRecipe((prev) => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter((c) => c !== catId)
        : [...prev.categories, catId],
    }));
  };

  const handleDragStart = (e, index, field) => {
    if (isTouchDragActive()) {
      e.preventDefault();
      return;
    }
    setDragIndex(index);
    setDragField(field);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (dropIndex, field) => {
    if (dragIndex === null || dragField !== field || dragIndex === dropIndex)
      return;
    if (touchDragJustFinishedRef.current) return;
    setEditedRecipe((prev) => {
      const items = [...prev[field]];
      const draggedItem = items[dragIndex];
      items.splice(dragIndex, 1);
      items.splice(dropIndex, 0, draggedItem);
      return { ...prev, [field]: items };
    });
    setDragIndex(null);
    setDragField(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragField(null);
    setDragOverIndex(null);
  };

  const handleMoveItem = (index, direction, field) => {
    setEditedRecipe((prev) => {
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
      editedRecipe.ingredients.map((i) => i.trim()).filter((i) => i),
    );
    const filledAll = editedRecipe.ingredients
      .map((i) => i.trim())
      .filter((i) => i);
    let nutrition = { ...editedRecipe.nutrition };

    const origIngredients = (recipe.ingredients || []).join("|");
    const newIngredients = filledAll.join("|");
    const origServings = String(recipe.servings || "");
    const newServings = String(editedRecipe.servings || "");
    const ingredientsChanged =
      origIngredients !== newIngredients || origServings !== newServings;

    if (filledIngredients.length > 0 && ingredientsChanged) {
      try {
        setSavedMessage(
          <>
            <Loader size={18} className={classes.spinIcon} /> מחשב ערכים
            תזונתיים...
          </>,
        );
        const result = await calculateNutrition(
          filledIngredients,
          editedRecipe.servings,
        );
        if (result && !result.error) {
          for (const key of Object.keys(result)) {
            nutrition[key] = result[key];
          }
        } else {
          console.warn("Nutrition calculation returned error:", result?.error);
          const msg =
            result?.error === "QUOTA_EXCEEDED" ? (
              t("recipes", "nutritionQuotaError")
            ) : (
              <>
                <AlertTriangle size={18} /> {t("recipes", "nutritionError")}
              </>
            );
          setSavedMessage(msg);
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (err) {
        console.error("Nutrition calculation failed:", err);
        setSavedMessage(
          <>
            <AlertTriangle size={18} /> {t("recipes", "nutritionError")}
          </>,
        );
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    const updatedRecipe = {
      ...recipe,
      name: editedRecipe.name,
      image_src: editedRecipe.images?.[0] || editedRecipe.image_src,
      images: editedRecipe.images || [],
      ingredients: filledAll,
      instructions: editedRecipe.instructions
        .map((i) => i.trim())
        .filter((i) => i),
      prepTime: editedRecipe.prepTime,
      cookTime: editedRecipe.cookTime,
      servings: parseInt(editedRecipe.servings) || 1,
      difficulty: editedRecipe.difficulty,
      sourceUrl: editedRecipe.sourceUrl,
      videoUrl: editedRecipe.videoUrl,
      categories: editedRecipe.categories,
      isFavorite: editedRecipe.isFavorite,
      notes: editedRecipe.notes,
      rating: editedRecipe.rating || 0,
      author: editedRecipe.author || "",
      shareToGlobal: editedRecipe.shareToGlobal,
      showMyName: editedRecipe.shareToGlobal ? editedRecipe.showMyName : false,
      nutrition,
    };
    console.log(
      "🍎 NUTRITION - Saving recipe with nutrition:",
      updatedRecipe.nutrition,
    );
    try {
      await onSave(updatedRecipe);
    } catch (err) {
      console.error("Failed to save recipe:", err);
      setSaving(false);
      setSavedMessage(
        <>
          <AlertTriangle size={18} /> {t("recipes", "saveFailed")}
        </>,
      );
      return;
    }
    onCancel();
    onSaved?.();
  };

  // ========== Add Category Inline ==========
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    onCancel();
    if (onDelete) await onDelete(recipe.id);
  };

  const handleAddNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const COLORS = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#9B59B6",
      "#3498DB",
      "#F1C40F",
      "#2ECC71",
      "#E67E22",
      "#1ABC9C",
    ];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    try {
      const newCat = await addCategory({
        id: Date.now().toString(),
        name,
        description: `${name}`,
        color,
      });
      if (newCat) {
        setEditedRecipe((prev) => ({
          ...prev,
          categories: [...prev.categories, newCat.id],
        }));
      }
    } catch (err) {
      console.error("Failed to add category:", err);
    }
    setNewCategoryName("");
    setShowNewCategoryInput(false);
  };

  // ========== Context value ==========
  const contextValue = {
    editedRecipe,
    setEditedRecipe,
    recipe,
    activeTab,
    setActiveTab,
    isMobile,
    uploadingImage,
    generatingAiImage,
    dragIndex,
    dragField,
    dragOverIndex,
    savedMessage,
    saving,
    editImageDragOver,
    setEditImageDragOver,
    newCategoryName,
    setNewCategoryName,
    showNewCategoryInput,
    setShowNewCategoryInput,
    fileInputRef,
    ingredientsListRef,
    instructionsListRef,
    groups,
    getTranslatedGroup,
    handleChange,
    handleServingsChange,
    handleImageUpload,
    handleRemoveImage,
    handleReorderImages,
    handleEditImageDrop,
    handleGenerateAiImage,
    handlePasteImage,
    handleIngredientChange,
    addIngredient,
    addIngredientGroup,
    removeIngredient,
    handleInstructionChange,
    addInstruction,
    removeInstruction,
    toggleFavorite,
    toggleCategory,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleMoveItem,
    handleTouchStart,
    handleLongPressStart,
    handleAddNewCategory,
    handleDeleteClick,
    classes,
    shared,
    catShared,
    buttonClasses,
    t,
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "basic":
        return <BasicTab />;
      case "ingredients":
        return <IngredientsTab />;
      case "instructions":
        return <InstructionsTab />;
      case "image":
        return <ImageTab />;
      case "categories":
        return <CategoriesTab />;
      case "delete":
        return <DeleteTab />;
      default:
        return <BasicTab />;
    }
  };

  return (
    <>
      <Modal
        onClose={handleCancel}
        className={`${shared.noPadModal} ${classes.noPadModal}`}
      >
        <EditRecipeContext.Provider value={contextValue}>
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
                    className={classes.editCloseBtn}
                    onClick={handleCancel}
                  />
                  <div className={classes.editTitleGroup}>
                    <h2>{t("recipes", "editRecipe")}</h2>
                    <p>{editedRecipe.name}</p>
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
                    {saving
                      ? t("common", "loading")
                      : t("recipes", "saveChanges")}
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
        </EditRecipeContext.Provider>
      </Modal>
      <Toast
        open={imageToast.open}
        onClose={() => setImageToast((prev) => ({ ...prev, open: false }))}
        variant={imageToast.variant}
        duration={imageToast.duration}
      >
        {imageToast.message}
      </Toast>
      {showDeleteConfirm && (
        <ConfirmDialog
          title={t("confirm", "deleteRecipe")}
          message={`${t("confirm", "deleteRecipeMsg")} "${recipe.name}"? ${t("confirm", "cannotUndo")}.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText={t("confirm", "yesDelete")}
        />
      )}
    </>
  );
}

export default EditRecipe;
