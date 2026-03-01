import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import FormInput from "./FormInput";
import { useRecipeBook, useLanguage } from "../../context";
import { loginUser, resetPassword } from "../../firebase/authService";

import { Mail, Lock, TriangleAlert } from "lucide-react";

import buttonClasses from "../../components/controls/gen-button.module.css";
import classes from "./login.module.css";

function Login() {
  const { login } = useRecipeBook();
  const { t } = useLanguage();

  const isReturningUser = !!localStorage.getItem("onboardingDone");

  const savedEmail = localStorage.getItem("rememberedEmail") || "";

  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedEmail || true);

  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const getError = (field, value) => {
    if (field === "email") {
      if (!value.trim()) return t("auth", "emailError");
      if (!emailRegex.test(value.trim())) return t("auth", "emailError");
    }
    if (field === "password") {
      if (!value) return t("auth", "passwordError");
      if (value.length < 6) return t("auth", "passwordError");
    }
    return "";
  };

  const isFormValid =
    !getError("email", email) && !getError("password", password);

  const handleFocus = (e) => {
    e.target.removeAttribute("readonly");
  };

  const togglePassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (fieldErrors.email && !getError("email", val)) {
      setFieldErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setFieldErrors((prev) => ({
      ...prev,
      password: getError("password", val),
    }));
  };

  const handleBlur = (field) => {
    const value = field === "email" ? email : password;
    if (!value) return;
    setFieldErrors((prev) => ({ ...prev, [field]: getError(field, value) }));
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setIsResetting(true);

    if (!resetEmail) {
      setError(t("auth", "enterEmail"));
      setIsResetting(false);
      return;
    }

    try {
      await resetPassword(resetEmail);
      setResetMessage(t("auth", "resetSent"));
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail("");
        setResetMessage("");
      }, 3000);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setError(t("auth", "noAccountFound"));
      } else if (error.code === "auth/invalid-email") {
        setError(t("auth", "emailError"));
      } else {
        setError(t("auth", "resetError"));
      }
      console.error("Password reset error:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailErr = getError("email", email);
    const passwordErr = getError("password", password);
    setFieldErrors({ email: emailErr, password: passwordErr });

    if (emailErr || passwordErr) return;

    setIsLoading(true);

    try {
      const user = await loginUser(email, password, rememberMe);
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      await login(user.uid);
      sessionStorage.setItem("justLoggedIn", "true");
      localStorage.setItem("tourCompleted", "true");
      navigate("/categories");
    } catch (error) {
      // Log the actual error for debugging
      console.error(
        "Login error - code:",
        error.code,
        "message:",
        error.message,
      );

      if (error.code === "auth/invalid-email") {
        setError(t("auth", "emailError"));
      } else if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setError(t("auth", "emailPswdError"));
      } else if (error.code === "auth/too-many-requests") {
        setError(t("auth", "tooManyAttempts"));
      } else if (error.code === "auth/user-disabled") {
        setError(t("auth", "accountDisabled"));
      } else {
        setError(t("auth", "loginError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const emailInputRef = useRef(null);

  useEffect(() => {
    if (isReturningUser && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  return (
    <div className={classes.loginContainer}>
      <div className={classes.loginContent}>
        {/* Returning user: login form first */}
        {isReturningUser ? (
          <>
            <h1 className={classes.landingLogo}>
              Cooki<span className={classes.landingLogoBook}>Pal</span>
            </h1>

            <form className={classes.loginForm} onSubmit={handleSubmit}>
              <p className={classes.title}>{t("auth", "login")}</p>
              {error && (
                <p className={classes.error}>
                  <TriangleAlert size={16} /> {error}
                </p>
              )}

              <FormInput
                type="email"
                placeholder={t("auth", "email")}
                value={email}
                onChange={handleEmailChange}
                isLoading={isLoading}
                onFocus={handleFocus}
                onBlur={() => handleBlur("email")}
                inputRef={emailInputRef}
                error={fieldErrors.email}
              >
                <Mail size={16} />
              </FormInput>

              <FormInput
                type="password"
                placeholder={t("auth", "passwordHint")}
                value={password}
                onChange={handlePasswordChange}
                isLoading={isLoading}
                onFocus={handleFocus}
                onBlur={() => handleBlur("password")}
                isPassword={true}
                togglePassword={togglePassword}
                showPassword={showPassword}
                error={fieldErrors.password}
              >
                <Lock size={16} />
              </FormInput>

              <label className={classes.rememberMe}>
                <input
                  className={buttonClasses.checkBox}
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>{t("auth", "rememberMe")}</span>
              </label>

              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className={buttonClasses.genButton}
              >
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

            <span
              onClick={() => {
                localStorage.removeItem("onboardingDone");
                navigate("/signup");
              }}
              className={classes.tourLink}
            >
              {t("onboarding", "viewTour")}
            </span>
          </>
        ) : (
          /* New user: landing card */
          <div className={classes.landingCard}>
            <h1 className={classes.landingLogo}>
              Cooki<span className={classes.landingLogoBook}>Pal</span>
            </h1>
            <p className={classes.landingSubtitle}>
              {t("onboarding", "welcomeSubtitle")}
            </p>
            <button
              className={classes.landingBtn}
              onClick={() => navigate("/signup")}
            >
              {t("onboarding", "letsStart")}
            </button>
            <p className={classes.signupLink}>
              <span
                onClick={() => {
                  localStorage.setItem("onboardingDone", "true");
                  window.location.reload();
                }}
                className={classes.link}
              >
                {t("onboarding", "skipToLogin")}
              </span>
            </p>
          </div>
        )}
      </div>

      {showForgotPassword && (
        <div
          className={classes.loginContainer}
          style={{ zIndex: 10 }}
          onClick={() => setShowForgotPassword(false)}
        >
          <form
            className={classes.loginForm}
            onSubmit={handleForgotPassword}
            onClick={(e) => e.stopPropagation()}
          >
            <p className={classes.title}>{t("auth", "resetTitle")}</p>
            <p className={classes.subtitle}>{t("auth", "resetInstructions")}</p>
            {error && <p className={classes.error}><TriangleAlert size={16} /> {error}</p>}
            {resetMessage && <p className={classes.success}>{resetMessage}</p>}

            <FormInput
              type="email"
              placeholder={t("auth", "email")}
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              isLoading={isResetting}
              onFocus={handleFocus}
            />

            <button
              type="submit"
              className={buttonClasses.genButton}
              disabled={isResetting || !emailRegex.test(resetEmail.trim())}
            >
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
              className={buttonClasses.genButton}
              style={{ width: "100%" }}
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
