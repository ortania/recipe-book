import { useState, useCallback, useMemo, useRef } from "react";
import { FiCopy } from "react-icons/fi";
import { SearchBox } from "../../components/controls/search";
import { useRecipeBook, useLanguage } from "../../context";
import {
  fetchGlobalRecipes,
  copyRecipeToUser,
} from "../../firebase/globalRecipeService";
import classes from "./global-recipes.module.css";

function GlobalRecipes() {
  const { t, language } = useLanguage();
  const { currentUser, addRecipe } = useRecipeBook();

  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [copying, setCopying] = useState({});
  const [copiedIds, setCopiedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
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

  const handleFirstLoad = useCallback(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadRecipes(true);
  }, [loadRecipes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allRecipes;
    const lower = search.toLowerCase();
    return allRecipes.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(lower) ||
        (r.ingredients || []).some((i) => i.toLowerCase().includes(lower)),
    );
  }, [allRecipes, search]);

  const handleCopy = async (recipe) => {
    if (!currentUser) return;
    setCopying((prev) => ({ ...prev, [recipe.id]: true }));
    try {
      const newRecipe = await copyRecipeToUser(
        recipe.id,
        currentUser.uid,
        language,
      );
      if (addRecipe) {
        addRecipe(newRecipe);
      }
      setCopiedIds((prev) => new Set([...prev, recipe.id]));
    } catch (err) {
      console.error("Copy failed:", err);
    } finally {
      setCopying((prev) => ({ ...prev, [recipe.id]: false }));
    }
  };

  if (!hasFetched.current && currentUser) {
    handleFirstLoad();
  }

  return (
    <div className={classes.container}>
      <div className={classes.stickyTop}>
        <div className={classes.header}>
          <h1 className={classes.title}>{t("globalRecipes", "title")}</h1>
        </div>

        <div className={classes.controls}>
          <SearchBox
            searchTerm={search}
            onSearchChange={setSearch}
            placeholder={t("globalRecipes", "search")}
            className={classes.searchBox}
          />
        </div>
      </div>

      {loading && allRecipes.length === 0 && (
        <div className={classes.loading}>{t("common", "loading")}</div>
      )}

      <div className={classes.grid}>
        {filtered.map((recipe) => (
          <div
            key={recipe.id}
            className={classes.card}
            onClick={() =>
              setExpandedId(expandedId === recipe.id ? null : recipe.id)
            }
          >
            {recipe.image_src && (
              <div className={classes.cardImage}>
                <img src={recipe.image_src} alt={recipe.name} loading="lazy" />
              </div>
            )}
            <div className={classes.cardBody}>
              <h3 className={classes.cardName}>{recipe.name}</h3>

              {expandedId === recipe.id && (
                <div className={classes.cardExpanded}>
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className={classes.expandSection}>
                      <strong>{t("recipes", "ingredients")}:</strong>
                      <ul className={classes.expandList}>
                        {recipe.ingredients.map((ing, i) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {recipe.instructions && recipe.instructions.length > 0 && (
                    <div className={classes.expandSection}>
                      <strong>{t("recipes", "instructions")}:</strong>
                      <ol className={classes.expandList}>
                        {recipe.instructions.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              <button
                className={`${classes.copyBtn} ${copiedIds.has(recipe.id) ? classes.copied : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(recipe);
                }}
                disabled={copying[recipe.id] || copiedIds.has(recipe.id)}
              >
                <FiCopy />
                <span>
                  {copiedIds.has(recipe.id)
                    ? t("globalRecipes", "copied")
                    : copying[recipe.id]
                      ? t("common", "loading")
                      : t("globalRecipes", "copyToMyRecipes")}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className={classes.empty}>{t("globalRecipes", "noRecipes")}</div>
      )}

      {hasMore && (
        <button
          className={classes.loadMoreBtn}
          onClick={() => loadRecipes(false)}
          disabled={loading}
        >
          {loading ? t("common", "loading") : t("globalRecipes", "loadMore")}
        </button>
      )}
    </div>
  );
}

export default GlobalRecipes;
