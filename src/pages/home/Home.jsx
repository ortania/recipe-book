import { useState, useEffect } from "react";
import { PiArrowFatLineUp } from "react-icons/pi";
import { useLanguage } from "../../context";
import { UpButton } from "../../components";
import { Button } from "../../components/controls/button";
import { useNavigate } from "react-router-dom";

import { scrollToTop } from "../utils";

import classes from "./home.module.css";

function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [typedTitle, setTypedTitle] = useState("");
  const [showContent, setShowContent] = useState(false);

  const fullTitle = t("home", "welcome");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullTitle.length) {
        setTypedTitle(fullTitle.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setShowContent(true);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={classes.page}>
      {/* Hero */}
      <section className={classes.hero}>
        <h1 className={classes.heroTitle}>
          {typedTitle}
          <span className={classes.cursor} />
        </h1>

        <p
          className={`${classes.heroSubtitle} ${showContent ? classes.fadeIn : classes.hidden}`}
        >
          {t("home", "subtitle")}
        </p>

        <div
          className={`${classes.heroCta} ${showContent ? classes.fadeIn : classes.hidden}`}
        >
          <Button
            className={classes.ctaButton}
            variant="primary"
            onClick={() => navigate("/categories")}
          >
            {t("home", "getStarted")}
          </Button>
        </div>
      </section>

      <UpButton onClick={scrollToTop} title="Scroll to top">
        <PiArrowFatLineUp />
      </UpButton>
    </div>
  );
}

export default Home;
