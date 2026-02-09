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

  const greetingKey = getGreetingKey();
  const greeting = t("recipesView", greetingKey);
  const name = currentUser?.displayName || "";

  return (
    <div className={classes.greeting}>
      {greeting}{name ? ` ${name}` : ""}
    </div>
  );
}

export default Greeting;
