import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRecipeBook } from "../../context";
import { Navigation, Header, Footer } from "../../components";

import { links } from "../data/navLinks";
import classes from "../app.module.css";

function ProtectedLayout() {
  const { isLoggedIn, logout } = useRecipeBook();
  const location = useLocation();
  const isSharerPage = location.pathname.startsWith("/sharer/");

  useEffect(() => {
    document.body.classList.remove("sidebar-open", "modal-open");
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className={classes.app}>
      <Navigation onLogout={logout} links={links} />

      <div
        className={`${classes.contentWrapper} ${isSharerPage ? classes.noSidebar : ""}`}
      >
        <main className={classes.main}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default ProtectedLayout;
