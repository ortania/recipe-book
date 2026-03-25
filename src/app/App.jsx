import React, { Suspense, useRef, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import classes from "./app.module.css";

import { MainLayout, ProtectedLayout } from "./layout";
import { Login } from "../pages";
const Signup = React.lazy(() => import("../pages/signup/Signup"));
import {
  RecipeBookProvider,
  useRecipeBook,
  LanguageProvider,
} from "../context";
import { ErrorBoundary } from "../components/error-boundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Categories = React.lazy(() => import("../pages/categories/Categories"));
const Onboarding = React.lazy(() => import("../pages/onboarding/Onboarding"));
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
const SharerProfile = React.lazy(
  () => import("../pages/sharer-profile/SharerProfile"),
);
const MigratePage = React.lazy(() => import("../pages/migrate"));
const Repair = React.lazy(() => import("../pages/repair/Repair"));

const SKELETON_WIDTHS = [70, 85, 60, 78, 65, 80, 72, 58, 82, 66, 75, 62];
const DAY_COLORS = [
  "#e74c3c",
  "#f39c12",
  "#2ecc71",
  "#3498db",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
];

function RecipeCardSkeleton() {
  return (
    <div>
      <Skeleton
        height={0}
        style={{ paddingBottom: "100%" }}
        borderRadius={25}
      />
      <div style={{ padding: "0.75rem" }}>
        <Skeleton
          width="75%"
          height="1.2rem"
          borderRadius={6}
          style={{ marginBottom: "0.3rem" }}
        />
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.75rem 1rem",
        marginBottom: "0.5rem",
        background: "var(--clr-bg-card)",
        borderRadius: 4,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
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
        <Skeleton
          height={32}
          borderRadius={22}
          containerClassName={classes.flexGrow}
        />
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
        <Skeleton
          width={180}
          height="1.4rem"
          style={{ margin: "0 auto 0.5rem" }}
        />
        <Skeleton width={260} height="1rem" style={{ margin: "0 auto" }} />
      </div>
      <div style={{ maxWidth: 400, margin: "1.5rem auto 0" }}>
        <Skeleton height="2.5rem" borderRadius={22} />
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          justifyContent: "center",
          padding: "0.5rem 0",
        }}
      >
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
          <Skeleton
            width={160}
            height="1.4rem"
            style={{ marginBottom: "0.4rem" }}
          />
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
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: DAY_COLORS[i],
                  opacity: 0.4,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height="0.85rem" />
                <Skeleton width="40%" height="0.6rem" />
              </div>
            </div>
            <div
              style={{
                padding: "0 1.1rem 0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                flex: 1,
              }}
            >
              {[45, 60, 75].map((w, j) => (
                <div key={j} className={classes.mealBlock}>
                  <Skeleton width={`${w}%`} height="0.75rem" />
                </div>
              ))}
            </div>
            <Skeleton
              height="2rem"
              borderRadius="0 0 12px 12px"
              style={{ opacity: 0.4 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShoppingListSkeleton() {
  const catColors = [
    "#6366f1",
    "#ef4444",
    "#f59e0b",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
  ];
  return (
    <div className={classes.shopSkeleton}>
      <div className={classes.shopHeaderBlock}>
        <Skeleton
          width={160}
          height="1.3rem"
          style={{ marginBottom: "0.4rem" }}
        />
        <Skeleton width={200} height="0.7rem" />
      </div>
      <div className={classes.shopCatList}>
        {catColors.map((color, i) => (
          <div key={i} className={classes.shopCatRow}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                background: `${color}18`,
                border: `1px solid ${color}30`,
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
    <div className={classes.detailSkeletonWrap}>
      <div className={classes.detailSkeleton}>
        <div className={classes.detailStickyHeader}>
          <Skeleton circle width="2rem" height="2rem" />
          <Skeleton width="40%" height="1.1rem" borderRadius={6} />
        </div>
        <Skeleton height={350} borderRadius={0} />
        <div className={classes.detailActionBar}>
          <Skeleton circle width="2rem" height="2rem" />
          <Skeleton circle width="2rem" height="2rem" />
          <Skeleton circle width="2rem" height="2rem" />
          <Skeleton circle width="2rem" height="2rem" />
          <div style={{ flex: 1 }} />
          <Skeleton width={120} height="2.2rem" borderRadius={20} />
        </div>
        <div className={classes.detailBody}>
          {/* Rating */}
          <div
            style={{ display: "flex", gap: "0.3rem", marginBottom: "0.5rem" }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} circle width="1.4rem" height="1.4rem" />
            ))}
          </div>
          {/* Info chips */}
          <div
            style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}
          >
            <Skeleton width={90} height="1.8rem" borderRadius={20} />
            <Skeleton width={90} height="1.8rem" borderRadius={20} />
            <Skeleton width={90} height="1.8rem" borderRadius={20} />
          </div>
          {/* Category tags */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <Skeleton width={70} height="1.6rem" borderRadius={14} />
            <Skeleton width={55} height="1.6rem" borderRadius={14} />
          </div>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1rem",
              borderBottom: "1px solid var(--clr-border-light)",
              paddingBottom: "0.75rem",
            }}
          >
            <Skeleton width={80} height="1rem" borderRadius={6} />
            <Skeleton width={80} height="1rem" borderRadius={6} />
            <Skeleton width={60} height="1rem" borderRadius={6} />
          </div>
          {/* Content lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              width={`${90 - i * 5}%`}
              height="0.8rem"
              borderRadius={4}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className={classes.loginSkeleton}>
      <div className={classes.loginSkeletonInner}>
        <div className={classes.loginSkeletonLogo}>
          <svg
            width="160"
            height="160"
            viewBox="0 0 97 97"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={classes.loginSkeletonIcon}
            aria-hidden="true"
          >
            <path
              opacity="0.4"
              d="M48.5 21.4195V86.2075C47.8129 86.2075 47.0854 86.0862 46.5196 85.7629L46.3579 85.682C38.5979 81.4383 25.0583 76.9925 16.2879 75.8204L15.1158 75.6587C11.2358 75.1737 8.08331 71.5362 8.08331 67.6562V18.8329C8.08331 14.0233 12.0037 10.3858 16.8133 10.79C25.3008 11.477 38.1533 15.7612 45.3475 20.2475L46.3579 20.8537C46.9641 21.2175 47.7321 21.4195 48.5 21.4195Z"
              fill="currentColor"
            />
            <path
              d="M88.9167 18.8727V67.6556C88.9167 71.5356 85.7642 75.1731 81.8842 75.6581L80.5504 75.8198C71.7396 76.9919 58.1596 81.4781 50.3996 85.7623C49.8742 86.0856 49.2275 86.2069 48.5 86.2069V21.419C49.2679 21.419 50.0358 21.2169 50.6421 20.8531L51.3292 20.4086C58.5233 15.8819 71.4163 11.5573 79.9038 10.8298H80.1463C84.9558 10.4256 88.9167 14.0227 88.9167 18.8727Z"
              fill="currentColor"
            />
            <path
              d="M31.3229 37.3457H22.2292C20.5721 37.3457 19.1979 35.9715 19.1979 34.3145C19.1979 32.6574 20.5721 31.2832 22.2292 31.2832H31.3229C32.98 31.2832 34.3542 32.6574 34.3542 34.3145C34.3542 35.9715 32.98 37.3457 31.3229 37.3457Z"
              fill="currentColor"
            />
            <path
              d="M34.3542 49.4707H22.2292C20.5721 49.4707 19.1979 48.0965 19.1979 46.4395C19.1979 44.7824 20.5721 43.4082 22.2292 43.4082H34.3542C36.0113 43.4082 37.3854 44.7824 37.3854 46.4395C37.3854 48.0965 36.0113 49.4707 34.3542 49.4707Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className={classes.loginSkeletonText}>
          <Skeleton width={180} height={40} borderRadius={10} />
        </div>
        <div className={classes.loginSkeletonDots}>
          <span className={classes.loginSkeletonDot} />
          <span
            className={classes.loginSkeletonDot}
            style={{ animationDelay: "0.2s" }}
          />
          <span
            className={classes.loginSkeletonDot}
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}

function skeletonForPath(path) {
  if (path.startsWith("/login") || path.startsWith("/signup"))
    return <LoginSkeleton />;
  if (path.startsWith("/conversions")) return <ConversionsSkeleton />;
  if (path.startsWith("/settings")) return <SettingsSkeleton />;
  if (path.startsWith("/meal-planner")) return <MealPlannerSkeleton />;
  if (path.startsWith("/shopping-list")) return <ShoppingListSkeleton />;
  if (path.startsWith("/recipe/")) return <RecipeDetailSkeleton />;
  if (path.startsWith("/global-recipes")) return <RecipeGridSkeleton />;
  if (path.startsWith("/sharer/")) return <RecipeGridSkeleton />;
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
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SkeletonTheme
          baseColor="var(--clr-border-light)"
          highlightColor="var(--clr-bg-hover)"
        >
          <RecipeBookProvider>
            <Router>
              <AppContent />
            </Router>
          </RecipeBookProvider>
        </SkeletonTheme>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

// TODO: REMOVE after verifying LoginSkeleton design
const PREVIEW_LOGIN_SKELETON = false;

function AppContent() {
  const { isLoggedIn, isLoading } = useRecipeBook();
  const location = useLocation();
  const initialLoadDone = useRef(false);
  const [previewDone, setPreviewDone] = useState(!PREVIEW_LOGIN_SKELETON);

  useEffect(() => {
    if (PREVIEW_LOGIN_SKELETON) {
      const timer = setTimeout(() => setPreviewDone(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isLoading) {
    initialLoadDone.current = true;
  }

  if (PREVIEW_LOGIN_SKELETON && !previewDone) {
    return <LoginSkeleton />;
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
        element={
          isLoggedIn ? (
            <Navigate to="/categories" />
          ) : (
            <Lazy>
              <Onboarding />
            </Lazy>
          )
        }
      />

      {/* Public Routes (Login Page - Has Header/Footer but No Navigation) */}
      <Route element={<MainLayout />}>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/categories" /> : <Login />}
        />
        <Route
          path="/signup"
          element={
            isLoggedIn ? (
              <Navigate to="/categories" />
            ) : (
              <Lazy fallback={<LoginSkeleton />}>
                <Signup />
              </Lazy>
            )
          }
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
        <Route
          path="/categories"
          element={
            <Lazy fallback={<RecipeGridSkeleton count={12} />}>
              <Categories />
            </Lazy>
          }
        />
        <Route
          path="/conversions"
          element={
            <Lazy fallback={<ConversionsSkeleton />}>
              <ConversionTables />
            </Lazy>
          }
        />
        <Route
          path="/settings"
          element={
            <Lazy fallback={<SettingsSkeleton />}>
              <Settings />
            </Lazy>
          }
        />
        <Route
          path="/migrate"
          element={
            <Lazy>
              <MigratePage />
            </Lazy>
          }
        />
        <Route
          path="/repair"
          element={
            <Lazy>
              <Repair />
            </Lazy>
          }
        />
        <Route
          path="/recipe/:id"
          element={
            <ErrorBoundary fallbackMessage="שגיאה בטעינת המתכון">
              <Lazy fallback={<RecipeDetailSkeleton />}>
                <RecipeDetailsPage />
              </Lazy>
            </ErrorBoundary>
          }
        />
        <Route
          path="/meal-planner"
          element={
            <Lazy fallback={<MealPlannerSkeleton />}>
              <MealPlanner />
            </Lazy>
          }
        />
        <Route
          path="/shopping-list"
          element={
            <Lazy fallback={<ShoppingListSkeleton />}>
              <ShoppingList />
            </Lazy>
          }
        />
        <Route
          path="/global-recipes"
          element={
            <Lazy>
              <GlobalRecipes />
            </Lazy>
          }
        />
        <Route
          path="/sharer/:userId"
          element={
            <Lazy>
              <SharerProfile />
            </Lazy>
          }
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
