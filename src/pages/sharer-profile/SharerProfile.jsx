import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserPlus, UserCheck } from "lucide-react";
import { useRecipeBook, useLanguage } from "../../context";
import {
  fetchSharerRecipes,
  copyRecipeToUser,
} from "../../firebase/globalRecipeService";
import { getUserData, toggleFollowUser } from "../../firebase/authService";
import {
  getUserRatingsBatch,
  setUserRating,
} from "../../firebase/ratingService";
import { RecipesView } from "../../components";
import Skeleton from "react-loading-skeleton";
import classes from "./sharer-profile.module.css";

function SharerProfile() {
  const { userId: sharerUserId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { currentUser, setCurrentUser, setRecipes } = useRecipeBook();

  const [sharerData, setSharerData] = useState(null);
  const [recipes, setSharerRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userRatings, setUserRatings] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const sharer = await getUserData(sharerUserId);
        setSharerData(sharer);

        if (sharer?.publicProfile) {
          const sharerRecipes = await fetchSharerRecipes(sharerUserId, true);
          setSharerRecipes(sharerRecipes);
        } else {
          setSharerRecipes([]);
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

  useEffect(() => {
    if (!currentUser || recipes.length === 0) return;
    const ids = recipes.map((r) => r.id);
    getUserRatingsBatch(ids, currentUser.uid).then((ratingsMap) => {
      const obj = {};
      ratingsMap.forEach((val, key) => (obj[key] = val));
      setUserRatings((prev) => ({ ...prev, ...obj }));
    });
  }, [currentUser, recipes]);

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

  const recipesWithoutSharer = useMemo(
    () => recipes.map(({ sharerName, ...rest }) => rest),
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
  const isPublic = sharerData?.publicProfile || false;

  return (
    <div className={classes.page}>
      <div className={classes.profileSection}>
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

      {isPublic && (
        <RecipesView
          persons={recipesWithoutSharer}
          groups={[]}
          showAddAndFavorites={false}
          showCategories={false}
          loading={!sharerData}
          emptyTitle={t("sharerProfile", "noRecipes")}
          onCopyRecipe={
            currentUser?.uid !== sharerUserId ? handleCopyRecipe : undefined
          }
          onRate={handleRate}
          userRatings={userRatings}
          defaultSortField="rating"
          defaultSortDirection="desc"
          sortStorageKey="sharerRecipesSortPreference"
          backAction={() => navigate(-1)}
          backLabel={`${t("sharerProfile", "backToRecipesOf")} ${sharerName}`}
          showTabs={false}
          hasContentAbove
          searchPlaceholder={`${t("common", "search")} ${t("sharerProfile", "inRecipesOf")} ${sharerName}...`}
        />
      )}
    </div>
  );
}

export default SharerProfile;
