import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiShoppingCart, FiPrinter } from "react-icons/fi";
import { Globe } from "lucide-react";
import SearchBox from "../../components/controls/search/SearchBox";
import { SortButton } from "../../components/controls/sort-button";
import { search } from "../../components/recipes/utils";
import { useRecipeBook, useLanguage } from "../../context";
import {
  searchCommunityRecipes,
  fetchGlobalRecipesCount,
} from "../../firebase/globalRecipeService";
import useTranslatedList from "../../hooks/useTranslatedList";
import { buildShoppingList } from "../../utils/ingredientUtils";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { ShoppingListView } from "../../components/shopping-list-view";
import Skeleton from "react-loading-skeleton";
import { BackButton } from "../../components/controls/back-button";
import classes from "./shopping-list.module.css";
import btnClasses from "../../styles/shared/buttons.module.css";

const STORAGE_KEY = "shoppingListState";

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    console.log(
      "[ShoppingList] loadSaved:",
      parsed
        ? {
            selectedRecipes: parsed.selectedRecipes?.length,
            showList: parsed.showList,
          }
        : "null",
    );
    return parsed;
  } catch {
    return null;
  }
}

function ShoppingList() {
  const { t } = useLanguage();
  const { recipes, categories, currentUser } = useRecipeBook();
  const { getTranslated } = useTranslatedList(categories, "name");
  const saved = useRef(loadSaved());
  const [selectedRecipes, setSelectedRecipes] = useState(
    saved.current?.selectedRecipes || [],
  );
  const [selectedCat, setSelectedCat] = useState(null);
  const [checkedItems, setCheckedItems] = useState(
    saved.current?.checkedItems || {},
  );
  const [showList, setShowList] = useState(saved.current?.showList || false);
  const [mobileTabsEl, setMobileTabsEl] = useState(null);
  const [globalRecipes, setGlobalRecipes] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [globalCount, setGlobalCount] = useState(null);
  const [folderSearch, setFolderSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const data = { selectedRecipes, checkedItems, showList };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [selectedRecipes, checkedItems, showList]);

  const shoppingSortOptions = [
    { field: "name", defaultDir: "asc" },
    { field: "newest", defaultDir: "desc" },
    { field: "prepTime", defaultDir: "asc" },
    { field: "difficulty", defaultDir: "asc" },
    { field: "rating", defaultDir: "desc" },
  ];

  const handleSortChange = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const update = () => {
      setMobileTabsEl(
        mql.matches ? document.getElementById("mobile-tabs-portal") : null,
      );
    };
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    fetchGlobalRecipesCount()
      .then((count) => setGlobalCount(count))
      .catch(() => setGlobalCount(0));
  }, []);

  const mobileTitle = (
    <span className={classes.mobileTitle}>
      {t("mealPlanner", "shoppingList")}
    </span>
  );

  const getRecipesForCat = (catId) => {
    if (catId === "all") return recipes;
    if (catId === "general")
      return recipes.filter((r) => !r.categories || r.categories.length === 0);
    return recipes.filter((r) => r.categories && r.categories.includes(catId));
  };

  const allAvailableRecipes = useMemo(() => {
    const map = new Map(recipes.map((r) => [r.id, r]));
    globalRecipes.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [recipes, globalRecipes]);

  const shoppingList = useMemo(
    () => buildShoppingList(selectedRecipes, allAvailableRecipes),
    [selectedRecipes, allAvailableRecipes],
  );

  const handleSelectCommunity = async () => {
    setSelectedCat("community");
    setFolderSearch("");
    if (globalRecipes.length === 0) {
      setLoadingGlobal(true);
      try {
        const result = await searchCommunityRecipes({
          excludeUserId: currentUser?.uid,
          pageSize: 9999,
        });
        setGlobalRecipes(result.recipes || []);
      } catch (err) {
        console.error("Failed to fetch global recipes:", err);
      } finally {
        setLoadingGlobal(false);
      }
    }
  };

  const toggleRecipe = (id) => {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const toggleChecked = (key) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClear = () => {
    setSelectedRecipes([]);
    setCheckedItems({});
    setShowList(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (showList && selectedRecipes.length > 0) {
    return (
      <div className={classes.page}>
        {mobileTabsEl && createPortal(mobileTitle, mobileTabsEl)}
        <div className={classes.listHeader}>
          <BackButton onClick={() => setShowList(false)} />
          {!mobileTabsEl && (
            <h1 className={classes.title}>
              {t("mealPlanner", "shoppingList")}
            </h1>
          )}
          <div className={classes.listHeaderActions}>
            <button
              className={btnClasses.iconBtn}
              onClick={() => window.print()}
              aria-label="print"
            >
              <FiPrinter size={20} />
            </button>
            <button className={btnClasses.clearBtn} onClick={handleClear}>
              {t("mealPlanner", "clearAll")}
            </button>
          </div>
        </div>
        <ShoppingListView
          shoppingList={shoppingList}
          checkedItems={checkedItems}
          onToggleChecked={toggleChecked}
        />
        <div className={classes.bottomSpacer} />
      </div>
    );
  }

  const headerHasContent = !mobileTabsEl || selectedRecipes.length > 0;

  return (
    <div className={classes.page}>
      {mobileTabsEl && createPortal(mobileTitle, mobileTabsEl)}
      {selectedRecipes.length > 0 ? (
        <div className={classes.selectionBar}>
          <span className={classes.selectionCount}>
            {selectedRecipes.length} {t("recipesView", "recipesCount")}{" "}
            {t("mealPlanner", "selected")}
          </span>
          <button
            className={classes.headerBtn}
            onClick={() => setShowList(true)}
          >
            <FiShoppingCart />
            {t("mealPlanner", "shoppingList")} ({shoppingList.length})
          </button>
        </div>
      ) : (
        <div
          className={`${classes.header} ${!headerHasContent ? classes.headerEmpty : ""}`}
        >
          <div>
            {!mobileTabsEl && (
              <h1 className={classes.title}>
                {t("mealPlanner", "shoppingList")}
              </h1>
            )}
          </div>
        </div>
      )}

      {selectedRecipes.length === 0 && !selectedCat && (
        <p className={classes.instructions}>
          {t("mealPlanner", "chooseRecipe")}
        </p>
      )}

      {!selectedCat ? (
        <div className={classes.catList}>
          <button
            className={classes.catListItem}
            onClick={handleSelectCommunity}
          >
            <span className={classes.catListIcon}>
              <Globe size={20} />
            </span>
            <span className={classes.catListName}>
              {t("nav", "globalRecipesFull")}
            </span>
            <span className={classes.catListCount}>
              {globalCount != null ? globalCount : ""}
            </span>
          </button>
          {recipes.length > 0 && (
            <button
              className={classes.catListItem}
              onClick={() => {
                setSelectedCat("all");
                setFolderSearch("");
              }}
            >
              <span className={classes.catListIcon}>
                {(() => {
                  const IC = getCategoryIcon("restaurant");
                  return <IC size={16} />;
                })()}
              </span>
              <span className={classes.catListName}>
                {t("mealPlanner", "myRecipes")}
              </span>
              <span className={classes.catListCount}>{recipes.length}</span>
            </button>
          )}
          {recipes.length > 0 &&
            categories
              .filter((c) => c.id !== "all")
              .filter((c) => getRecipesForCat(c.id).length > 0)
              .map((cat) => {
                const count = getRecipesForCat(cat.id).length;
                return (
                  <button
                    key={cat.id}
                    className={classes.catListItem}
                    onClick={() => {
                      setSelectedCat(cat.id);
                      setFolderSearch("");
                    }}
                  >
                    <span className={classes.catListIcon}>
                      {(() => {
                        const IC = getCategoryIcon(cat.icon);
                        return <IC size={16} />;
                      })()}
                    </span>
                    <span className={classes.catListName}>
                      {getTranslated(cat)}
                    </span>
                    <span className={classes.catListCount}>{count}</span>
                  </button>
                );
              })}
        </div>
      ) : (
        <>
          <div className={classes.subHeader}>
            <BackButton
              onClick={() => {
                setSelectedCat(null);
                setFolderSearch("");
              }}
            />
            <span className={classes.subTitle}>
              {selectedCat === "community"
                ? t("nav", "globalRecipesFull")
                : selectedCat === "all"
                  ? t("mealPlanner", "myRecipes")
                  : (() => {
                      const cat = categories.find((c) => c.id === selectedCat);
                      return cat ? getTranslated(cat) : "";
                    })()}
            </span>
            <span className={classes.subCount}>
              {selectedCat === "community"
                ? loadingGlobal
                  ? ""
                  : `${globalRecipes.length} ${t("recipesView", "recipesCount")}`
                : `${getRecipesForCat(selectedCat).length} ${t("recipesView", "recipesCount")}`}
            </span>
          </div>

          <div className={classes.folderSearchRow}>
            <SearchBox
              searchTerm={folderSearch}
              onSearchChange={setFolderSearch}
              placeholder={t("globalRecipes", "search")}
              examples={[
                t("recipesView", "searchExample1"),
                t("recipesView", "searchExample2"),
                t("recipesView", "searchExample3"),
              ]}
              className={classes.folderSearchBox}
            />
            <SortButton
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              options={shoppingSortOptions}
            />
          </div>

          {selectedCat === "community" && loadingGlobal ? (
            <div className={classes.recipeList}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={classes.recipeItem}
                  style={{ pointerEvents: "none" }}
                >
                  <Skeleton circle width={40} height={40} />
                  <Skeleton width="60%" height={18} />
                </div>
              ))}
            </div>
          ) : (
            <div className={classes.recipeList}>
              {search(
                selectedCat === "community"
                  ? globalRecipes
                  : getRecipesForCat(selectedCat),
                folderSearch,
                sortField,
                sortDirection,
              ).map((recipe) => {
                const isSelected = selectedRecipes.includes(recipe.id);
                return (
                  <button
                    key={recipe.id}
                    className={`${classes.recipeItem} ${isSelected ? classes.recipeItemSelected : ""}`}
                    onClick={() => toggleRecipe(recipe.id)}
                  >
                    {recipe.image_src ? (
                      <img
                        className={classes.recipeItemImage}
                        src={recipe.image_src}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className={classes.recipeItemEmoji}>🍽️</span>
                    )}
                    <span className={classes.recipeItemName}>
                      {recipe.name}
                    </span>
                    {isSelected && (
                      <FiCheck className={classes.recipeItemCheck} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
      <div className={classes.bottomSpacer} />
    </div>
  );
}

export default ShoppingList;
