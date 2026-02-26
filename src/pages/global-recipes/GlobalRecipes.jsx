import { useState, useCallback, useRef, useEffect } from "react";
import { PiArrowFatLineUp } from "react-icons/pi";
import { IoCopyOutline, IoSearchOutline } from "react-icons/io5";
import { IoMdStarOutline } from "react-icons/io";
import { BsGrid3X3Gap } from "react-icons/bs";
import { useRecipeBook, useLanguage } from "../../context";
import {
  fetchGlobalRecipes,
  copyRecipeToUser,
} from "../../firebase/globalRecipeService";
import {
  getUserRatingsBatch,
  setUserRating,
} from "../../firebase/ratingService";
import { RecipesView, UpButton } from "../../components";
import { scrollToTop } from "../utils";
import classes from "./global-recipes.module.css";

function GlobalRecipes() {
  const { t, language } = useLanguage();
  const { currentUser, addRecipe, setRecipes } = useRecipeBook();

  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [ready, setReady] = useState(false);
  const [userRatings, setUserRatings] = useState({});
  const lastDocRef = useRef(null);

  const loadRecipes = useCallback(
    async (reset = false) => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const result = await fetchGlobalRecipes(
          currentUser.uid,
          reset ? null : lastDocRef.current,
        );
        setAllRecipes((prev) => {
          const next = reset ? result.recipes : [...prev, ...result.recipes];
          const seen = new Set();
          return next.filter((r) => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          });
        });
        lastDocRef.current = result.lastVisible;
        setLastDoc(result.lastVisible);
        setHasMore(result.hasMore);
      } catch (err) {
        console.error("Failed to load global recipes:", err);
      } finally {
        setLoading(false);
        setReady(true);
      }
    },
    [currentUser],
  );

  useEffect(() => {
    if (currentUser) {
      setReady(false);
      loadRecipes(true);
    }
  }, [currentUser]);

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

  if (!ready) {
    return <div className={classes.loading}>{t("common", "loading")}</div>;
  }

  return (
    <div>
      <RecipesView
        persons={allRecipes}
        groups={[]}
        showAddAndFavorites={false}
        showCategories={false}
        recipesTabLabel={t("nav", "globalRecipesFull")}
        emptyTitle={t("recipesView", "emptyGlobalTitle")}
        hasMoreRecipes={hasMore}
        onLoadMore={() => loadRecipes(false)}
        onCopyRecipe={handleCopyRecipe}
        onRate={handleRate}
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

      <UpButton onClick={scrollToTop} title={t("common", "scrollToTop")}>
        <PiArrowFatLineUp />
      </UpButton>
    </div>
  );
}

export default GlobalRecipes;
