import React, { Suspense, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import classes from "./app.module.css";

import { MainLayout, ProtectedLayout } from "./layout";
import { Login, Categories } from "../pages";
import Signup from "../pages/signup";
import {
  RecipeBookProvider,
  useRecipeBook,
  LanguageProvider,
} from "../context";
import { Onboarding } from "../pages/onboarding";

const RecipeDetailsPage = React.lazy(
  () => import("../pages/recipe-details/RecipeDetailsPage"),
);
const MealPlanner = React.lazy(() => import("../pages/meal-planner"));
const ShoppingList = React.lazy(() => import("../pages/shopping-list"));
const GlobalRecipes = React.lazy(() => import("../pages/global-recipes"));
const ConversionTables = React.lazy(
  () => import("../components/conversion-tables"),
);
const Settings = React.lazy(() => import("../pages/settings/Settings"));
const MigratePage = React.lazy(() => import("../pages/migrate"));
const Repair = React.lazy(() => import("../pages/repair/Repair"));

const SKELETON_WIDTHS = [70, 85, 60, 78, 65, 80, 72, 58, 82, 66, 75, 62];
const DAY_COLORS = ["#e74c3c", "#f39c12", "#2ecc71", "#3498db", "#9b59b6", "#1abc9c", "#e67e22"];

function RecipeCardSkeleton() {
  return (
    <div>
      <Skeleton height={0} style={{ paddingBottom: "100%" }} borderRadius={25} />
      <div style={{ padding: "0.75rem" }}>
        <Skeleton width="75%" height="1.2rem" borderRadius={6} style={{ marginBottom: "0.3rem" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Skeleton width="30%" height="0.9rem" borderRadius={6} />
          <Skeleton width="25%" height="0.9rem" borderRadius={6} />
        </div>
      </div>
    </div>
  );
}

function RecipeListSkeleton() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "1rem",
      padding: "0.75rem 1rem", marginBottom: "0.5rem",
      background: "var(--bg-card)", borderRadius: 4,
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}>
      <Skeleton width={32} height={32} borderRadius={6} />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height="0.9rem" borderRadius={6} />
      </div>
      <Skeleton width={50} height="0.7rem" borderRadius={6} />
    </div>
  );
}

function RecipeGridSkeleton({ count = 8 }) {
  return (
    <div className={classes.loading}>
      <div className={classes.skeletonGreeting}>
        <Skeleton width="55%" height="1.9rem" borderRadius={8} />
      </div>
      <div className={classes.skeletonSearchRow}>
        <Skeleton width={24} height={24} circle />
        <Skeleton height={32} borderRadius={22} containerClassName={classes.flexGrow} />
        <Skeleton width={24} height={24} circle />
      </div>
      <div className={classes.skeletonGrid}>
        {Array.from({ length: count }).map((_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function ConversionsSkeleton() {
  return (
    <div className={classes.convSkeleton}>
      <div style={{ textAlign: "center", paddingBottom: "1rem" }}>
        <Skeleton width={180} height="1.4rem" style={{ margin: "0 auto 0.5rem" }} />
        <Skeleton width={260} height="1rem" style={{ margin: "0 auto" }} />
      </div>
      <div style={{ maxWidth: 400, margin: "1.5rem auto 0" }}>
        <Skeleton height="2.5rem" borderRadius={22} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", padding: "0.5rem 0" }}>
        {[85, 70, 90, 80, 65, 75, 60, 95, 70].map((w, i) => (
          <Skeleton key={i} width={w} height="2.6rem" borderRadius={8} />
        ))}
      </div>
      <div className={classes.convContent}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={classes.convRow}>
            <Skeleton width={`${35 + (i % 5) * 10}%`} height="1rem" />
            <Skeleton width={`${15 + (i % 4) * 8}%`} height="1rem" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className={classes.settingsSkeleton}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Skeleton width={100} height="1.3rem" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {[0, 1].map((i) => (
          <div key={i} className={classes.settingsRow}>
            <Skeleton width="1.6rem" height="1.6rem" borderRadius={4} />
            <div style={{ flex: 1 }}>
              <Skeleton width={`${i === 0 ? 40 : 55}%`} height="0.85rem" />
              <Skeleton width={`${i === 0 ? 25 : 18}%`} height="0.65rem" />
            </div>
            <Skeleton width="0.7rem" height="0.7rem" borderRadius={2} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MealPlannerSkeleton() {
  return (
    <div className={classes.mealSkeleton}>
      <div className={classes.mealTopRow}>
        <div>
          <Skeleton width={160} height="1.4rem" style={{ marginBottom: "0.4rem" }} />
          <Skeleton width={120} height="0.75rem" />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Skeleton width={100} height="2.2rem" borderRadius={8} />
          <Skeleton width={100} height="2.2rem" borderRadius={8} />
        </div>
      </div>
      <div className={classes.mealDaysGrid}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={classes.mealDayCard}>
            <div className={classes.mealDayHeader}>
              <div
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: DAY_COLORS[i], opacity: 0.4, flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height="0.85rem" />
                <Skeleton width="40%" height="0.6rem" />
              </div>
            </div>
            <div style={{ padding: "0 1.1rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
              {[45, 60, 75].map((w, j) => (
                <div key={j} className={classes.mealBlock}>
                  <Skeleton width={`${w}%`} height="0.75rem" />
                </div>
              ))}
            </div>
            <Skeleton height="2rem" borderRadius="0 0 12px 12px" style={{ opacity: 0.4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShoppingListSkeleton() {
  const catColors = [
    "#6366f1", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7",
    "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4", "#84cc16",
  ];
  return (
    <div className={classes.shopSkeleton}>
      <div className={classes.shopHeaderBlock}>
        <Skeleton width={160} height="1.3rem" style={{ marginBottom: "0.4rem" }} />
        <Skeleton width={200} height="0.7rem" />
      </div>
      <div className={classes.shopCatList}>
        {catColors.map((color, i) => (
          <div key={i} className={classes.shopCatRow}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${color}18`, border: `1px solid ${color}30`,
              }}
            />
            <div style={{ flex: 1 }}>
              <Skeleton width={`${40 + (i % 3) * 18}%`} height="0.85rem" />
            </div>
            <Skeleton width={20} height="0.65rem" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipeDetailSkeleton() {
  return (
    <div className={classes.detailSkeleton}>
      <div className={classes.detailStickyHeader}>
        <Skeleton circle width="2rem" height="2rem" />
        <Skeleton width="45%" height="1rem" />
      </div>
      <Skeleton height={280} borderRadius={0} style={{ maxHeight: 350 }} />
      <div className={classes.detailActionBar}>
        <Skeleton circle width="2rem" height="2rem" />
        <Skeleton circle width="2rem" height="2rem" />
        <Skeleton circle width="2rem" height="2rem" />
      </div>
      <div className={classes.detailBody}>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Skeleton width={90} height="1.8rem" borderRadius={20} />
          <Skeleton width={90} height="1.8rem" borderRadius={20} />
          <Skeleton width={90} height="1.8rem" borderRadius={20} />
        </div>
        <Skeleton width="35%" height="1rem" style={{ marginTop: "0.5rem" }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width={`${85 - i * 8}%`} height="0.7rem" />
        ))}
        <Skeleton width="30%" height="1rem" style={{ marginTop: "1.5rem" }} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={`${95 - i * 10}%`} height="0.7rem" />
        ))}
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "100vh", width: "100vw", padding: "2rem",
      background: "var(--bg-primary)",
    }}>
      <div style={{
        width: "100%", maxWidth: 440, display: "flex",
        flexDirection: "column", alignItems: "center", gap: "2rem",
      }}>
        <Skeleton width={180} height={50} borderRadius={12} />
        <div style={{
          width: "100%", padding: "3rem",
          background: "var(--bg-card)", borderRadius: 20,
          display: "flex", flexDirection: "column", gap: "1.5rem",
        }}>
          <Skeleton width="40%" height="2rem" borderRadius={8} style={{ alignSelf: "center" }} />
          <Skeleton height="3.2rem" borderRadius={12} />
          <Skeleton height="3.2rem" borderRadius={12} />
          <Skeleton width="35%" height="1rem" borderRadius={6} />
          <Skeleton height="3rem" borderRadius={12} />
          <Skeleton width="50%" height="0.9rem" borderRadius={6} style={{ alignSelf: "center" }} />
          <Skeleton width="60%" height="0.9rem" borderRadius={6} style={{ alignSelf: "center" }} />
        </div>
      </div>
    </div>
  );
}

function skeletonForPath(path) {
  if (path.startsWith("/login") || path.startsWith("/signup") || path === "/") return <LoginSkeleton />;
  if (path.startsWith("/conversions")) return <ConversionsSkeleton />;
  if (path.startsWith("/settings")) return <SettingsSkeleton />;
  if (path.startsWith("/meal-planner")) return <MealPlannerSkeleton />;
  if (path.startsWith("/shopping-list")) return <ShoppingListSkeleton />;
  if (path.startsWith("/recipe/")) return <RecipeDetailSkeleton />;
  if (path.startsWith("/global-recipes")) return <RecipeGridSkeleton />;
  return <RecipeGridSkeleton count={12} />;
}

function Lazy({ children, fallback }) {
  return (
    <Suspense fallback={fallback || <RecipeGridSkeleton />}>
      {children}
    </Suspense>
  );
}

function App() {
  return (
    <LanguageProvider>
      <SkeletonTheme
        baseColor="var(--border-color)"
        highlightColor="var(--bg-hover)"
      >
        <RecipeBookProvider>
          <Router>
            <AppContent />
          </Router>
        </RecipeBookProvider>
      </SkeletonTheme>
    </LanguageProvider>
  );
}

function AppContent() {
  const { isLoggedIn, isLoading } = useRecipeBook();
  const location = useLocation();
  const initialLoadDone = useRef(false);

  if (!isLoading) {
    initialLoadDone.current = true;
  }

  const showInitialLoading = isLoading && !initialLoadDone.current;

  if (showInitialLoading) {
    return skeletonForPath(location.pathname);
  }

  return (
    <Routes>
      {/* Onboarding (shown once before login) */}
      <Route
        path="/onboarding"
        element={isLoggedIn ? <Navigate to="/categories" /> : <Onboarding />}
      />

      {/* Public Routes (Login Page - Has Header/Footer but No Navigation) */}
      <Route element={<MainLayout />}>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/categories" /> : <Login />}
        />
        <Route
          path="/signup"
          element={isLoggedIn ? <Navigate to="/categories" /> : <Signup />}
        />
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/categories" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Route>

      {/* Protected Routes (With Navigation, Header, Footer) */}
      <Route element={<ProtectedLayout />}>
        <Route path="/home" element={<Navigate to="/categories" />} />
        <Route path="/categories" element={<Categories />} />
        <Route
          path="/conversions"
          element={<Lazy fallback={<ConversionsSkeleton />}><ConversionTables /></Lazy>}
        />
        <Route path="/settings" element={<Lazy fallback={<SettingsSkeleton />}><Settings /></Lazy>} />
        <Route path="/migrate" element={<Lazy><MigratePage /></Lazy>} />
        <Route path="/repair" element={<Lazy><Repair /></Lazy>} />
        <Route
          path="/recipe/:id"
          element={<Lazy fallback={<RecipeDetailSkeleton />}><RecipeDetailsPage /></Lazy>}
        />
        <Route
          path="/meal-planner"
          element={<Lazy fallback={<MealPlannerSkeleton />}><MealPlanner /></Lazy>}
        />
        <Route
          path="/shopping-list"
          element={<Lazy fallback={<ShoppingListSkeleton />}><ShoppingList /></Lazy>}
        />
        <Route
          path="/global-recipes"
          element={<Lazy><GlobalRecipes /></Lazy>}
        />
      </Route>

      {/* Redirect unknown routes */}
      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? "/categories" : "/login"} />}
      />
    </Routes>
  );
}

export default App;
