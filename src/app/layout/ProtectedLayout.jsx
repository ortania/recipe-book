import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  useRecipeBook,
  RadioProvider,
  useRadio,
  TimerProvider,
} from "../../context";
import { auth } from "../../firebase/config";
import { Navigation, Header, Footer } from "../../components";
import { RadioPlayer } from "../../components/radio-player";
import TimerWidget from "../../components/timer-widget/TimerWidget";

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

const HIDE_FOOTER_ROUTES = ["/settings"];

function ProtectedLayout() {
  const { isLoggedIn, logout } = useRecipeBook();
  const { pathname } = useLocation();
  const hideFooter = HIDE_FOOTER_ROUTES.includes(pathname);
  useEffect(() => {
    document.body.classList.remove("sidebar-open", "modal-open");
  }, []);

  useEffect(() => {
    if (!HIDE_FOOTER_ROUTES.includes(pathname)) {
      document.body.classList.remove("hide-footer");
    }
  }, [pathname]);

  if (!isLoggedIn) {
    if (auth.currentUser) return null;
    return <Navigate to="/login" />;
  }

  return (
    <RadioProvider>
      <TimerProvider>
        <div className={classes.app}>
          <Navigation onLogout={logout} links={links} />

          <div className={classes.contentWrapper}>
            <main className={classes.main}>
              <Outlet />
            </main>

            {!hideFooter && <Footer />}
          </div>
          <GlobalRadioPlayer />
          <TimerWidget />
        </div>
      </TimerProvider>
    </RadioProvider>
  );
}

export default ProtectedLayout;
