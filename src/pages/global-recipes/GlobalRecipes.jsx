import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { CircleCheck } from "lucide-react";
import { Toast } from "../../components/controls";
import { PiArrowFatLineUp } from "react-icons/pi";
import { IoCopyOutline, IoSearchOutline } from "react-icons/io5";
import { IoMdStarOutline } from "react-icons/io";
import { BsGrid3X3Gap } from "react-icons/bs";
import { useRecipeBook, useLanguage } from "../../context";
import { copyRecipeToUser } from "../../firebase/globalRecipeService";
import {
  getUserRatingsBatch,
  setUserRating,
} from "../../firebase/ratingService";
import { useGlobalRecipes } from "../../hooks/useGlobalRecipes";
import { RecipesView, UpButton, AddRecipeWizard } from "../../components";
import { scrollToTop } from "../utils";
import classes from "./global-recipes.module.css";

function GlobalRecipes() {
  const { t, language } = useLanguage();
  const { currentUser, addRecipe, setRecipes, categories } = useRecipeBook();

  const {
    allRecipes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useGlobalRecipes(currentUser?.uid);

  const [savedRecipeIds, setSavedRecipeIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("savedCommunityRecipes")) || [];
    } catch {
      return [];
    }
  });
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [addMethod, setAddMethod] = useState("method");
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const handleSaveToastClose = useCallback(() => setSaveToastOpen(false), []);
  const [userRatings, setUserRatings] = useState({});
  const [selectedSharer, setSelectedSharer] = useState("all");
  const sentinelRef = useRef(null);

  const sharerOptions = useMemo(() => {
    const map = new Map();
    allRecipes.forEach((r) => {
      if (r.sharerName && r.sharerUserId) {
        map.set(r.sharerUserId, r.sharerName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allRecipes]);

  const filteredRecipes = useMemo(() => {
    if (selectedSharer === "all") return allRecipes;
    return allRecipes.filter((r) => r.sharerUserId === selectedSharer);
  }, [allRecipes, selectedSharer]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!currentUser || allRecipes.length === 0) return;
    const ids = allRecipes.map((r) => r.id);
    getUserRatingsBatch(ids, currentUser.uid).then((ratingsMap) => {
      const obj = {};
      ratingsMap.forEach((val, key) => {
        obj[key] = val;
      });
      setUserRatings((prev) => ({ ...prev, ...obj }));
    });
  }, [currentUser, allRecipes]);

  const handleRate = useCallback(
    async (recipeId, rating) => {
      if (!currentUser) return;
      setUserRatings((prev) => ({ ...prev, [recipeId]: rating }));
      try {
        await setUserRating(recipeId, currentUser.uid, rating);
      } catch (err) {
        console.error("Failed to save rating:", err);
      }
    },
    [currentUser],
  );

  const handleSaveRecipe = useCallback((recipeId) => {
    setSavedRecipeIds((prev) => {
      const next = prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId];
      localStorage.setItem("savedCommunityRecipes", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleCopyRecipe = useCallback(
    async (recipeId) => {
      if (!currentUser) return;
      const copied = await copyRecipeToUser(
        recipeId,
        currentUser.uid,
        language,
      );
      setRecipes((prev) => [...prev, copied]);
    },
    [currentUser, language, setRecipes],
  );

  return (
    <div>
      {showAddRecipe && (
        <AddRecipeWizard
          onAddRecipe={addRecipe}
          onCancel={(lastScreen) => {
            setShowAddRecipe(false);
            if (lastScreen) setAddMethod(lastScreen);
          }}
          onSaved={() => setSaveToastOpen(true)}
          groups={categories}
          initialScreen={addMethod}
        />
      )}

      <RecipesView
        onAddRecipe={(method) => {
          setAddMethod(method || "method");
          setShowAddRecipe(true);
        }}
        sharerOptions={sharerOptions}
        selectedSharer={selectedSharer}
        onSelectSharer={setSelectedSharer}
        followingList={currentUser?.following || []}
        recipes={filteredRecipes}
        groups={[]}
        readOnlyCategories={true}
        showAddAndFavorites={false}
        showCategories={false}
        loading={isLoading}
        recipesTabLabel={t("nav", "globalRecipesFull")}
        emptyTitle={t("recipesView", "emptyGlobalTitle")}
        hasMoreRecipes={false}
        onCopyRecipe={undefined}
        onSaveRecipe={handleSaveRecipe}
        savedRecipes={savedRecipeIds}
        userRatings={userRatings}
        defaultSortField="rating"
        defaultSortDirection="desc"
        sortStorageKey="globalRecipesSortPreference"
        helpTitle={t("globalRecipes", "helpTitle")}
        helpDescription={t("globalRecipes", "helpIntro")}
        helpItems={[
          <>
            <IoCopyOutline style={{ verticalAlign: "middle" }} />{" "}
            {t("globalRecipes", "helpCopy")}
          </>,
          <>
            <IoMdStarOutline style={{ verticalAlign: "middle" }} />{" "}
            {t("globalRecipes", "helpRating")}
          </>,
          <>
            <IoSearchOutline style={{ verticalAlign: "middle" }} />{" "}
            {t("globalRecipes", "helpSearch")}
          </>,
          <>
            <BsGrid3X3Gap style={{ verticalAlign: "middle" }} />{" "}
            {t("globalRecipes", "helpView")}
          </>,
        ]}
      />

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {isFetchingNextPage && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "1.5rem 0",
          }}
        >
          <div className={classes.spinner} />
        </div>
      )}

      <UpButton onClick={scrollToTop} title={t("common", "scrollToTop")}>
        <PiArrowFatLineUp />
      </UpButton>

      <Toast open={saveToastOpen} onClose={handleSaveToastClose} variant="success">
        <CircleCheck size={18} aria-hidden />
        <span>{t("recipes", "saved")}</span>
      </Toast>
    </div>
  );
}

export default GlobalRecipes;
