import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../../firebase/authService";
import { useLanguage } from "../../context";
import FormInput from "../login/FormInput";
import classes from "../login/login.module.css";

function Signup() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleFocus = (e) => {
    e.target.removeAttribute("readonly");
  };

  const togglePassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      await signupUser(email, password, displayName);
      // Navigation handled automatically by AppContent when isLoggedIn becomes true
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("Email already in use");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError("An error occurred during signup. Please try again.");
      }
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={classes.loginContainer}>
      <form className={classes.loginForm} onSubmit={handleSubmit}>
        <p className={classes.title}>{t("auth", "signup")}</p>
        {error && <p className={classes.error}>{error}</p>}

        <FormInput
          type="text"
          placeholder={t("auth", "displayName")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          isLoading={isLoading}
          onFocus={handleFocus}
        />

        <FormInput
          type="email"
          placeholder={t("auth", "email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          isLoading={isLoading}
          onFocus={handleFocus}
        />

        <FormInput
          type="password"
          placeholder={t("auth", "password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          isLoading={isLoading}
          onFocus={handleFocus}
          isPassword={true}
          togglePassword={togglePassword}
          showPassword={showPassword}
        />

        <FormInput
          type="password"
          placeholder={t("auth", "confirmPassword")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          isLoading={isLoading}
          onFocus={handleFocus}
          isPassword={true}
          togglePassword={togglePassword}
          showPassword={showPassword}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? t("auth", "creatingAccount") : t("auth", "signup")}
        </button>

        <p className={classes.signupLink}>
          {t("auth", "hasAccount")}{" "}
          <span onClick={() => navigate("/")} className={classes.link}>
            {t("auth", "login")}
          </span>
        </p>
      </form>
    </div>
  );
}

export default Signup;
