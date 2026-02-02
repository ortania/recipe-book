import { Outlet } from "react-router-dom";
import classes from "../app.module.css";

function MainLayout() {
  return (
    <div className={classes.app}>
      {/* Main Content (Each Route's Page Content Will Be Injected Here) */}
      <main className={classes.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
