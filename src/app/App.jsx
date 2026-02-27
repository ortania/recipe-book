import React, { Suspense, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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

function RecipeGridSkeleton({ count = 8 }) {
  return (
    <div className={classes.loading}>
      <div className={classes.skeletonGrid}>
        {Array.from({ length: count }).map((_, i) => {
          const w = SKELETON_WIDTHS[i % SKELETON_WIDTHS.length];
          return (
            <div key={i} className={classes.skeletonCard}>
              <div className={classes.skeletonImage} />
              <div className={classes.skeletonInfo}>
                <div className={classes.skeletonName} style={{ width: `${w}%` }} />
                <div className={classes.skeletonMeta} style={{ width: `${w - 30}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConversionsSkeleton() {
  const tabWidths = [85, 70, 90, 80, 65, 75, 60, 95, 70];
  return (
    <div className={classes.convSkeleton}>
      <div className={classes.convHeader}>
        <div className={classes.convTitle} />
        <div className={classes.convSubtitle} />
      </div>
      <div className={classes.convSearchBar} />
      <div className={classes.convTabs}>
        {tabWidths.map((w, i) => (
          <div key={i} className={classes.convTab} style={{ width: `${w}px` }} />
        ))}
      </div>
      <div className={classes.convContent}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={classes.convRow} style={{ animationDelay: `${i * 0.04}s` }}>
            <div className={classes.convRowName} style={{ width: `${35 + (i % 5) * 10}%` }} />
            <div className={classes.convRowValue} style={{ width: `${15 + (i % 4) * 8}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className={classes.settingsSkeleton}>
      <div className={classes.settingsTop}>
        <div className={classes.settingsTitle} />
      </div>
      <div className={classes.settingsList}>
        {[0, 1].map((i) => (
          <div key={i} className={classes.settingsRow} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className={classes.settingsIcon} />
            <div className={classes.settingsContent}>
              <div className={classes.settingsLabel} style={{ width: `${i === 0 ? 40 : 55}%` }} />
              <div className={classes.settingsValue} style={{ width: `${i === 0 ? 25 : 18}%` }} />
            </div>
            <div className={classes.settingsChevron} />
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
          <div className={classes.mealTitle} />
          <div className={classes.mealDateRange} />
        </div>
        <div className={classes.mealActions}>
          <div className={classes.mealActionBtn} />
          <div className={classes.mealActionBtn} />
        </div>
      </div>
      <div className={classes.mealDaysGrid}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={classes.mealDayCard} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={classes.mealDayHeader}>
              <div className={classes.mealDayCircle} style={{ background: DAY_COLORS[i] }} />
              <div className={classes.mealDayInfo}>
                <div className={classes.mealDayName} />
                <div className={classes.mealDayDate} />
              </div>
            </div>
            <div className={classes.mealDayBody}>
              {[0, 1, 2].map((j) => (
                <div key={j} className={classes.mealBlock}>
                  <div className={classes.mealBlockLabel} style={{ width: `${45 + j * 15}%` }} />
                </div>
              ))}
            </div>
            <div className={classes.mealAddBtn} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShoppingListSkeleton() {
  const catColors = ["#6366f1", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];
  return (
    <div className={classes.shopSkeleton}>
      <div className={classes.shopHeaderBlock}>
        <div className={classes.shopTitle} />
        <div className={classes.shopSubtitle} />
      </div>
      <div className={classes.shopCatList}>
        {catColors.map((color, i) => (
          <div key={i} className={classes.shopCatRow} style={{ animationDelay: `${i * 0.04}s` }}>
            <div className={classes.shopCatIcon} style={{ background: `${color}18`, borderColor: `${color}30` }} />
            <div className={classes.shopCatName} style={{ width: `${40 + (i % 3) * 18}%` }} />
            <div className={classes.shopCatCount} />
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
        <div className={classes.detailBackBtn} />
        <div className={classes.detailHeaderTitle} />
      </div>
      <div className={classes.detailImageBlock} />
      <div className={classes.detailActionBar}>
        <div className={classes.detailActionIcon} />
        <div className={classes.detailActionIcon} />
        <div className={classes.detailActionIcon} />
      </div>
      <div className={classes.detailBody}>
        <div className={classes.detailMetaRow}>
          <div className={classes.detailMetaPill} />
          <div className={classes.detailMetaPill} />
          <div className={classes.detailMetaPill} />
        </div>
        <div className={classes.detailSectionTitle} style={{ width: "35%" }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={classes.detailLine} style={{ width: `${85 - i * 8}%`, animationDelay: `${i * 0.06}s` }} />
        ))}
        <div className={classes.detailSectionTitle} style={{ width: "30%", marginTop: "1.5rem" }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className={classes.detailLine} style={{ width: `${95 - i * 10}%`, animationDelay: `${(i + 5) * 0.06}s` }} />
        ))}
      </div>
    </div>
  );
}

function skeletonForPath(path) {
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
      <RecipeBookProvider>
        <Router>
          <AppContent />
        </Router>
      </RecipeBookProvider>
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
