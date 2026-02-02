import { Navigate, Outlet } from "react-router-dom";
import { useRecipeBook } from "../../context";
import { Navigation, Header, Footer } from "../../components";

import { links } from "../data/navLinks";
import classes from "../app.module.css";

function ProtectedLayout() {
  const { isLoggedIn, logout } = useRecipeBook();

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className={classes.app}>
      {/* ✅ Left Sidebar Navigation */}
      <Navigation onLogout={logout} links={links} />

      {/* ✅ Main content area with content and footer */}
      <div className={classes.contentWrapper}>
        <main className={classes.main}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default ProtectedLayout;
