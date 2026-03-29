import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { UserPlus, UserCheck } from "lucide-react";
import { BackButton } from "../../components/controls/back-button";
import { useRecipeBook, useLanguage } from "../../context";
import useTranslatedList from "../../hooks/useTranslatedList";
import {
  fetchSharerRecipes,
  copyRecipeToUser,
} from "../../firebase/globalRecipeService";
import { getUserData, toggleFollowUser } from "../../firebase/authService";
import { fetchCategories } from "../../firebase/categoryService";
import { RecipesView } from "../../components";
import { CategoryCard } from "../../components/category-card";
import Skeleton from "react-loading-skeleton";
import useScrollRestore from "../../hooks/useScrollRestore";
import classes from "./sharer-profile.module.css";

function SharerProfile() {
  const { userId: sharerUserId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { currentUser, setCurrentUser, setRecipes } = useRecipeBook();

  useScrollRestore(`sharerProfile-${sharerUserId}`);

  const [sharerData, setSharerData] = useState(null);
  const [recipes, setSharerRecipes] = useState([]);
  const [sharerCategories, setSharerCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileActionsEl, setMobileActionsEl] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [showCategoryGrid, setShowCategoryGrid] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setMobileActionsEl(document.getElementById("mobile-header-actions-portal"));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const sharer = await getUserData(sharerUserId);
        setSharerData(sharer);

        if (sharer?.publicProfile) {
          const [sharerRecipes, cats] = await Promise.all([
            fetchSharerRecipes(sharerUserId, true),
            fetchCategories(sharerUserId),
          ]);
          setSharerRecipes(sharerRecipes);

          // Build category list: keep only categories that have recipes
          const usedCatIds = new Set();
          sharerRecipes.forEach((r) => {
            if (r.categories) r.categories.forEach((c) => usedCatIds.add(c));
          });
          const filtered = cats.filter((c) => usedCatIds.has(c.id));
          setSharerCategories([{ id: "all", name: "all" }, ...filtered]);
        } else {
          setSharerRecipes([]);
          setSharerCategories([]);
        }
      } catch (err) {
        console.error("Error loading sharer profile:", err);
      } finally {
        setLoading(false);
      }
    };
    if (sharerUserId) load();
  }, [sharerUserId]);

  useEffect(() => {
    if (currentUser?.following) {
      setIsFollowing(currentUser.following.includes(sharerUserId));
    }
  }, [currentUser?.following, sharerUserId]);

  const isPublic = sharerData?.publicProfile || false;

  useEffect(() => {
    if (loading) return;
    if (!isPublic) {
      const topBar = document.getElementById("mobile-top-bar");
      if (topBar) topBar.style.display = "none";
      return () => {
        if (topBar) topBar.style.display = "";
      };
    } else if (isMobile) {
      document.body.classList.add("sharer-profile-mobile");
      return () => document.body.classList.remove("sharer-profile-mobile");
    }
  }, [isPublic, isMobile, loading]);

  const handleFollow = async () => {
    if (!currentUser) return;
    try {
      const updated = await toggleFollowUser(currentUser.uid, sharerUserId);
      setIsFollowing(updated.includes(sharerUserId));
      setCurrentUser((prev) => ({ ...prev, following: updated }));
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  };

  const handleCopyRecipe = useCallback(
    async (recipeId) => {
      if (!currentUser) return;
      const copied = await copyRecipeToUser(
        recipeId,
        currentUser.uid,
        language,
      );
      setRecipes((prev) =>
        prev.some((r) => r.id === copied.id) ? prev : [...prev, copied],
      );
    },
    [currentUser, language, setRecipes],
  );

  const recipesWithoutSharer = useMemo(
    () => recipes.map(({ sharerName, ...rest }) => rest),
    [recipes],
  );

  const toggleCategory = useCallback((categoryId) => {
    setSelectedCategories((prev) => {
      if (categoryId === "all") return ["all"];
      const withoutAll = prev.filter((id) => id !== "all");
      if (withoutAll.includes(categoryId)) {
        const filtered = withoutAll.filter((id) => id !== categoryId);
        return filtered.length === 0 ? ["all"] : filtered;
      }
      return [...withoutAll, categoryId];
    });
  }, []);

  const clearCategorySelection = useCallback(() => {
    setSelectedCategories(["all"]);
  }, []);

  const { getTranslated } = useTranslatedList(sharerCategories, "name");

  const categoryImageMap = useMemo(() => {
    const map = {};
    sharerCategories.forEach((cat) => {
      if (cat.id === "all") return;
      const catRecipes = recipes.filter(
        (r) => r.categories && r.categories.includes(cat.id),
      );
      const withImage = catRecipes.filter((r) => r.image_src || r.image);
      if (withImage.length > 0) {
        map[cat.id] = withImage[0].image_src || withImage[0].image;
      }
    });
    const allWithImage = recipes.filter((r) => r.image_src || r.image);
    if (allWithImage.length > 0) {
      map["all"] = allWithImage[0].image_src || allWithImage[0].image;
    }
    return map;
  }, [sharerCategories, recipes]);

  const getRecipeCount = useCallback(
    (catId) => {
      const uniqueRecipes = Array.from(
        new Map(recipes.map((r) => [r.id, r])).values(),
      );
      if (catId === "all") return uniqueRecipes.length;
      if (catId === "general") {
        return uniqueRecipes.filter(
          (r) => !r.categories || r.categories.length === 0,
        ).length;
      }
      return uniqueRecipes.filter(
        (r) => r.categories && r.categories.includes(catId),
      ).length;
    },
    [recipes],
  );

  if (loading) {
    return (
      <div className={classes.page}>
        <div className={classes.profileSection}>
          <Skeleton circle width={56} height={56} />
          <div>
            <Skeleton width={140} height="1.4rem" />
            <Skeleton width={80} height="0.9rem" />
          </div>
        </div>
      </div>
    );
  }

  const sharerName = sharerData?.displayName || "";

  return (
    <div className={classes.page}>
      {/* Public profile (mobile): back arrow portaled to the hamburger row */}
      {isPublic &&
        isMobile &&
        mobileActionsEl &&
        createPortal(
          <BackButton onClick={() => navigate(-1)} size={22} />,
          mobileActionsEl,
        )}

      <div className={classes.profileSection}>
        {/* Non-public (mobile): inline arrow on the name row */}
        {!isPublic && isMobile && (
          <BackButton
            onClick={() => navigate(-1)}
            size={24}
            className={classes.inlineBackBtn}
          />
        )}

        {/* Desktop: inline arrow for both public & non-public */}
        {!isMobile && (
          <BackButton
            onClick={() => navigate(-1)}
            size={26}
            className={classes.desktopBackBtn}
          />
        )}

        <div className={classes.avatar}>
          {sharerName.charAt(0).toUpperCase()}
        </div>
        <div className={classes.profileHeader}>
          <h1 className={classes.profileName}>
            {t("sharerProfile", "title")} {sharerName}
          </h1>
          {isPublic ? (
            <>
              <span className={classes.recipeCount}>
                {recipes.length} {t("sharerProfile", "recipeCount")}
              </span>

              {currentUser?.uid !== sharerUserId && (
                <button
                  className={`${classes.followBtn} ${isFollowing ? classes.followBtnActive : ""}`}
                  onClick={handleFollow}
                >
                  {isFollowing ? (
                    <UserCheck size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  <span>
                    {isFollowing
                      ? t("sharerProfile", "following")
                      : t("sharerProfile", "follow")}
                  </span>
                </button>
              )}
            </>
          ) : (
            <span className={classes.privateNote}>
              {t("sharerProfile", "privateProfile")}
            </span>
          )}
        </div>
      </div>

      {isPublic && showCategoryGrid && (
        <div className={classes.categoriesGrid}>
          {sharerCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              name={
                cat.id === "all"
                  ? t("categories", "allRecipes")
                  : getTranslated(cat)
              }
              selected={false}
              onClick={() => {
                setSelectedCategories([cat.id]);
                setShowCategoryGrid(false);
              }}
              count={getRecipeCount(cat.id)}
              recipeImage={categoryImageMap[cat.id]}
            />
          ))}
        </div>
      )}

      {isPublic && !showCategoryGrid && (
        <RecipesView
          recipes={recipesWithoutSharer}
          groups={sharerCategories}
          selectedGroup={
            selectedCategories.length === 1 && selectedCategories[0] === "all"
              ? "all"
              : selectedCategories
          }
          showAddAndFavorites={false}
          showCategories={true}
          readOnlyCategories
          readOnlySelectedCategories={selectedCategories}
          readOnlyToggleCategory={toggleCategory}
          readOnlyClearCategorySelection={clearCategorySelection}
          loading={!sharerData}
          emptyTitle={t("sharerProfile", "noRecipes")}
          onCopyRecipe={undefined}
          linkState={{ fromSharerProfile: true }}
          hideRating={true}
          defaultSortField="rating"
          defaultSortDirection="desc"
          sortStorageKey="sharerRecipesSortPreference"
          showTabs={false}
          hasContentAbove
          searchPlaceholder={`${t("common", "search")} ${t("sharerProfile", "inRecipesOf")} ${sharerName}...`}
        />
      )}
    </div>
  );
}

export default SharerProfile;
