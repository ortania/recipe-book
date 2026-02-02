import classes from "./footer.module.css";

/**
 * Footer component
 * @returns JSX of component
 */
export default function Footer() {
  const date = new Date().getFullYear();

  return (
    <footer className={classes.footer}>
      <p>
        <span>&copy;</span> {date} Tania
      </p>
    </footer>
  );
}
