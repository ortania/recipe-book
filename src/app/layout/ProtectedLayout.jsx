import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useRecipeBook, RadioProvider, useRadio } from "../../context";
import { Navigation, Header, Footer } from "../../components";
import { RadioPlayer } from "../../components/radio-player";

import { links } from "../data/navLinks";
import classes from "../app.module.css";

function GlobalRadioPlayer() {
  const {
    radioRef,
    showRadio,
    radioMinimized,
    closeRadio,
    minimizeRadio,
    expandRadio,
  } = useRadio();
  return (
    <RadioPlayer
      ref={radioRef}
      open={showRadio}
      minimized={radioMinimized}
      onClose={closeRadio}
      onMinimize={minimizeRadio}
      onExpand={expandRadio}
    />
  );
}

function ProtectedLayout() {
  const { isLoggedIn, logout } = useRecipeBook();
  useEffect(() => {
    document.body.classList.remove("sidebar-open", "modal-open");
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <RadioProvider>
      <div className={classes.app}>
        <Navigation onLogout={logout} links={links} />

        <div className={classes.contentWrapper}>
          <main className={classes.main}>
            <Outlet />
          </main>

          <Footer />
        </div>
        <GlobalRadioPlayer />
      </div>
    </RadioProvider>
  );
}

export default ProtectedLayout;
