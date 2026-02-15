import React, { Suspense } from "react";
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
import MigratePage from "../pages/migrate";
import Repair from "../pages/repair/Repair";
import {
  RecipeBookProvider,
  useRecipeBook,
  LanguageProvider,
} from "../context";
import ConversionTables from "../components/conversion-tables";
import Settings from "../pages/settings/Settings";
import RecipeDetailsPage from "../pages/recipe-details/RecipeDetailsPage";
import MealPlanner from "../pages/meal-planner";
import ShoppingList from "../pages/shopping-list";
import { Onboarding } from "../pages/onboarding";

const GlobalRecipes = React.lazy(() => import("../pages/global-recipes"));

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

  if (isLoading) {
    return <div className={classes.loading}>Loading recipes...</div>;
  }

  return (
    <Router>
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
          <Route path="/conversions" element={<ConversionTables />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/migrate" element={<MigratePage />} />
          <Route path="/repair" element={<Repair />} />
          <Route path="/recipe/:id" element={<RecipeDetailsPage />} />
          <Route path="/meal-planner" element={<MealPlanner />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
          <Route
            path="/global-recipes"
            element={
              <Suspense
                fallback={<div className={classes.loading}>Loading...</div>}
              >
                <GlobalRecipes />
              </Suspense>
            }
          />
        </Route>

        {/* Redirect unknown routes */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/categories" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
