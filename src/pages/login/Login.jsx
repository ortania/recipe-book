import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import FormInput from "./FormInput";
import { useRecipeBook, useLanguage } from "../../context";
import { loginUser, resetPassword } from "../../firebase/authService";

import classes from "./login.module.css";

function Login() {
  const { login } = useRecipeBook();
  const { t } = useLanguage();

  const isReturningUser = !!localStorage.getItem("onboardingDone");

  // State management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const navigate = useNavigate();

  const handleFocus = (e) => {
    e.target.removeAttribute("readonly");
  };

  const togglePassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setIsResetting(true);

    if (!resetEmail) {
      setError("Please enter your email address");
      setIsResetting(false);
      return;
    }

    try {
      await resetPassword(resetEmail);
      setResetMessage("Password reset email sent! Check your inbox.");
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail("");
        setResetMessage("");
      }, 3000);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
      console.error("Password reset error:", error);
    } finally {
      setIsResetting(false);
    }
  };

  // Login submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await loginUser(email, password);
      await login(user.uid);
    } catch (error) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("An error occurred during login. Please try again.");
      }
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={classes.loginContainer}>
      <div className={classes.loginContent}>
        {/* Landing card — always visible */}
        <div className={classes.landingCard}>
          <div className={classes.landingLogo}>
            <span className={classes.landingLogoCook}>Cook</span>
            <span className={classes.landingLogoBook}>book</span>
          </div>
          <p className={classes.landingSubtitle}>
            {t("onboarding", "welcomeSubtitle")}
          </p>
          <button
            className={classes.landingBtn}
            onClick={() => navigate("/signup")}
          >
            {t("onboarding", "letsStart")}
          </button>
        </div>

        {/* Login form — only for returning users */}
        {isReturningUser && (
          <form className={classes.loginForm} onSubmit={handleSubmit}>
            <p className={classes.title}>{t("auth", "login")}</p>
            {error && <p className={classes.error}>{error}</p>}

            <FormInput
              type="email"
              placeholder={t("auth", "email")}
              value={email}
              onChange={handleEmailChange}
              isLoading={isLoading}
              onFocus={handleFocus}
            />

            <FormInput
              type="password"
              placeholder={t("auth", "password")}
              value={password}
              onChange={handlePasswordChange}
              isLoading={isLoading}
              onFocus={handleFocus}
              isPassword={true}
              togglePassword={togglePassword}
              showPassword={showPassword}
            />

            <button type="submit" disabled={isLoading}>
              {isLoading ? t("auth", "loggingIn") : t("auth", "login")}
            </button>

            <p className={classes.forgotPassword}>
              <span
                onClick={() => setShowForgotPassword(true)}
                className={classes.link}
              >
                {t("auth", "forgotPassword")}
              </span>
            </p>

            <p className={classes.signupLink}>
              {t("auth", "noAccount")}{" "}
              <span
                onClick={() => navigate("/signup")}
                className={classes.link}
              >
                {t("auth", "signup")}
              </span>
            </p>
          </form>
        )}
      </div>

      {showForgotPassword && (
        <div
          className={classes.loginContainer}
          onClick={() => setShowForgotPassword(false)}
        >
          <form
            className={classes.loginForm}
            onSubmit={handleForgotPassword}
            onClick={(e) => e.stopPropagation()}
          >
            <p className={classes.title}>{t("auth", "resetTitle")}</p>
            <p className={classes.subtitle}>{t("auth", "resetInstructions")}</p>
            {error && <p className={classes.error}>{error}</p>}
            {resetMessage && <p className={classes.success}>{resetMessage}</p>}

            <FormInput
              type="email"
              placeholder={t("auth", "email")}
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              isLoading={isResetting}
              onFocus={handleFocus}
            />

            <button type="submit" disabled={isResetting}>
              {isResetting ? "..." : t("auth", "resetPassword")}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail("");
                setError("");
                setResetMessage("");
              }}
              className={classes.backButton}
              disabled={isResetting}
            >
              {t("auth", "login")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Login;
