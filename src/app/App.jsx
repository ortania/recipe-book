import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import classes from "./app.module.css";

import { MainLayout, ProtectedLayout } from "./layout";
import { Home, Login, Categories } from "../pages";
import { RecipeBookProvider, useRecipeBook } from "../context";
import ConversionTables from "../components/conversion-tables";

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
          <Route path="/login" element={<Login />} />
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
