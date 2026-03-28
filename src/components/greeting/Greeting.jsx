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
  const [name, setName] = useState(currentUser?.displayName || "");
  const [phase, setPhase] = useState("");

  useEffect(() => {
    if (currentUser?.displayName) {
      setName(currentUser.displayName);
      requestAnimationFrame(() => setPhase("show"));
    }
  }, [currentUser?.displayName]);

  useEffect(() => {
    if (phase !== "show") return;
    const timer = setTimeout(() => setPhase("hide"), 5000);
    return () => clearTimeout(timer);
  }, [phase]);

  const greetingKey = getGreetingKey();
  const greeting = t("recipesView", greetingKey);
  const whatToCook = t("recipesView", "whatToCook");

  return (
    <div className={classes.greetingWrapper}>
      <div className={`${classes.greetingSmall}${phase ? ` ${classes[phase]}` : ""}`}>
        {greeting} {name}
      </div>
      <div className={classes.greetingPrompt}>{whatToCook}</div>
    </div>
  );
}

export default Greeting;
