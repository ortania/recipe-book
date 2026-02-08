import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import classes from "./app.module.css";

import { MainLayout, ProtectedLayout } from "./layout";
import { Home, Login, Categories } from "../pages";
import Signup from "../pages/signup";
import MigratePage from "../pages/migrate";
import Repair from "../pages/repair/Repair";
import { RecipeBookProvider, useRecipeBook } from "../context";
import ConversionTables from "../components/conversion-tables";
import Settings from "../pages/settings/Settings";

function App() {
  return (
    <RecipeBookProvider>
      <AppContent />
    </RecipeBookProvider>
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
          <Route path="/home" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/conversions" element={<ConversionTables />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/migrate" element={<MigratePage />} />
          <Route path="/repair" element={<Repair />} />
        </Route>

        {/* Redirect unknown routes */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/home" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
