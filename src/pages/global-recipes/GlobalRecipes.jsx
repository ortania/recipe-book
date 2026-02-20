import { useState, useCallback, useRef } from "react";
import { PiArrowFatLineUp } from "react-icons/pi";
import { IoCopyOutline, IoSearchOutline } from "react-icons/io5";
import { IoMdStarOutline } from "react-icons/io";
import { BsGrid3X3Gap } from "react-icons/bs";
import { useRecipeBook, useLanguage } from "../../context";
import {
  fetchGlobalRecipes,
  copyRecipeToUser,
} from "../../firebase/globalRecipeService";
import { RecipesView, UpButton } from "../../components";
import { scrollToTop } from "../utils";

function GlobalRecipes() {
  const { t, language } = useLanguage();
  const { currentUser, addRecipe, setRecipes } = useRecipeBook();

  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const hasFetched = useRef(false);

  const loadRecipes = useCallback(
    async (reset = false) => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const result = await fetchGlobalRecipes(
          currentUser.uid,
          reset ? null : lastDoc,
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
        setLastDoc(result.lastVisible);
        setHasMore(result.hasMore);
      } catch (err) {
        console.error("Failed to load global recipes:", err);
      } finally {
        setLoading(false);
      }
    },
    [lastDoc, currentUser],
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

  if (!hasFetched.current && currentUser) {
    hasFetched.current = true;
    loadRecipes(true);
  }

  return (
    <div>
      <RecipesView
        persons={allRecipes}
        groups={[]}
        showAddAndFavorites={false}
        showCategories={false}
        recipesTabLabel={t("nav", "globalRecipes")}
        emptyTitle={t("recipesView", "emptyGlobalTitle")}
        hasMoreRecipes={hasMore}
        onLoadMore={() => loadRecipes(false)}
        onCopyRecipe={handleCopyRecipe}
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
