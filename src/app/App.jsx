import React, { Suspense, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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

function Lazy({ children }) {
  return (
    <Suspense fallback={<div className={classes.loading}>Loading...</div>}>
      {children}
    </Suspense>
  );
}

function App() {
  return (
    <LanguageProvider>
      <RecipeBookProvider>
        <AppContent />
      </RecipeBookProvider>
    </LanguageProvider>
  );
}

function AppContent() {
  const { isLoggedIn, isLoading } = useRecipeBook();
  const initialLoadDone = useRef(false);

  if (!isLoading) {
    initialLoadDone.current = true;
  }

  const showInitialLoading = isLoading && !initialLoadDone.current;

  return (
    <Router>
      {showInitialLoading ? (
        <div className={classes.loading}>Loading recipes...</div>
      ) : (
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
            element={<Lazy><ConversionTables /></Lazy>}
          />
          <Route path="/settings" element={<Lazy><Settings /></Lazy>} />
          <Route path="/migrate" element={<Lazy><MigratePage /></Lazy>} />
          <Route path="/repair" element={<Lazy><Repair /></Lazy>} />
          <Route
            path="/recipe/:id"
            element={<Lazy><RecipeDetailsPage /></Lazy>}
          />
          <Route
            path="/meal-planner"
            element={<Lazy><MealPlanner /></Lazy>}
          />
          <Route
            path="/shopping-list"
            element={<Lazy><ShoppingList /></Lazy>}
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
      )}
    </Router>
  );
}

export default App;
