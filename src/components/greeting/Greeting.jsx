import { useState, useEffect } from "react";
import { useRecipeBook, useLanguage } from "../../context";
import classes from "./greeting.module.css";

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "goodMorning";
  if (hour >= 12 && hour < 17) return "goodAfternoon";
  if (hour >= 17 && hour < 21) return "goodEvening";
  return "goodNight";
}

function Greeting() {
  const { currentUser } = useRecipeBook();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const greetingKey = getGreetingKey();
  const greeting = t("recipesView", greetingKey);
  const name = currentUser?.displayName || "";
  const whatToCook = t("recipesView", "whatToCook");

  return (
    <div className={classes.greetingWrapper}>
      <div className={`${classes.greetingSmall}${visible ? "" : ` ${classes.hide}`}`}>
        {greeting}{name ? ` ${name}` : ""}
      </div>
      <div className={classes.greetingPrompt}>{whatToCook}</div>
    </div>
  );
}

export default Greeting;
