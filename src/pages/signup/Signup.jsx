import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser, signInWithGoogle } from "../../firebase/authService";
import { useRecipeBook, useLanguage } from "../../context";
import FormInput from "../login/FormInput";
import { Onboarding } from "../onboarding";
import { User, Mail, Lock, ShieldCheck, TriangleAlert } from "lucide-react";

import buttonClasses from "../../components/controls/gen-button.module.css";
import classes from "../login/login.module.css";

function Signup() {
  const { login } = useRecipeBook();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(
    () => !!localStorage.getItem("onboardingDone"),
  );

  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const getError = (field, value, pw) => {
    if (field === "displayName") {
      if (!value.trim()) return t("auth", "nameRequired");
    }
    if (field === "email") {
      if (!value.trim()) return t("auth", "emailError");
      if (!emailRegex.test(value.trim())) return t("auth", "emailError");
    }
    if (field === "password") {
      if (!value || value.length < 6) return t("auth", "passwordError");
    }
    if (field === "confirmPassword") {
      if (!value) return t("auth", "passwordsDontMatch");
      if (value !== (pw ?? password)) return t("auth", "passwordsDontMatch");
    }
    return "";
  };

  const isFormValid =
    !getError("displayName", displayName) &&
    !getError("email", email) &&
    !getError("password", password) &&
    !getError("confirmPassword", confirmPassword);

  const handleFocus = (e) => {
    e.target.removeAttribute("readonly");
  };

  const togglePassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleChange = (field, value) => {
    const setters = { displayName: setDisplayName, email: setEmail, password: setPassword, confirmPassword: setConfirmPassword };
    setters[field](value);

    if (field === "password" || field === "confirmPassword") {
      setFieldErrors((prev) => ({ ...prev, [field]: getError(field, value) }));
      if (field === "password" && confirmPassword) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: getError("confirmPassword", confirmPassword, value) }));
      }
    } else {
      if (fieldErrors[field] && !getError(field, value)) {
        setFieldErrors((prev) => ({ ...prev, [field]: "" }));
      }
    }
  };

  const handleBlur = (field) => {
    const values = { displayName, email, password, confirmPassword };
    if (!values[field]) return;
    setFieldErrors((prev) => ({ ...prev, [field]: getError(field, values[field]) }));
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      if (!user) { setIsGoogleLoading(false); return; }
      await login(user.uid);
      localStorage.setItem("onboardingDone", "true");
      sessionStorage.setItem("justLoggedIn", "true");
      localStorage.setItem("tourCompleted", "true");
      navigate("/categories");
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError(t("auth", "googleSignInError"));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = {
      displayName: getError("displayName", displayName),
      email: getError("email", email),
      password: getError("password", password),
      confirmPassword: getError("confirmPassword", confirmPassword),
    };
    setFieldErrors(errors);

    if (Object.values(errors).some((e) => e)) return;

    setIsLoading(true);

    try {
      await signupUser(email, password, displayName);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError(t("auth", "emailAlreadyInUse"));
      } else if (error.code === "auth/invalid-email") {
        setError(t("auth", "emailError"));
      } else if (error.code === "auth/weak-password") {
        setError(t("auth", "weakPassword"));
      } else if (error.code === "auth/too-many-requests") {
        setError(t("auth", "tooManyAttempts"));
      } else {
        setError(t("auth", "signupError"));
      }
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!onboardingDone) {
    return <Onboarding onFinish={() => navigate("/login")} />;
  }

  return (
    <div className={classes.loginContainer}>
      <form className={classes.loginForm} onSubmit={handleSubmit}>
        <p className={classes.title}>{t("auth", "signup")}</p>
        {error && <p className={classes.error}><TriangleAlert size={16} /> {error}</p>}

        <FormInput
          type="text"
          placeholder={t("auth", "displayName")}
          value={displayName}
          onChange={(e) => handleChange("displayName", e.target.value)}
          isLoading={isLoading}
          onFocus={handleFocus}
          onBlur={() => handleBlur("displayName")}
          error={fieldErrors.displayName}
        >
          <User size={16} />
        </FormInput>

        <FormInput
          type="email"
          placeholder={t("auth", "email")}
          value={email}
          onChange={(e) => handleChange("email", e.target.value)}
          isLoading={isLoading}
          onFocus={handleFocus}
          onBlur={() => handleBlur("email")}
          error={fieldErrors.email}
        >
          <Mail size={16} />
        </FormInput>

        <FormInput
          type="password"
          placeholder={t("auth", "password")}
          value={password}
          onChange={(e) => handleChange("password", e.target.value)}
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

        <FormInput
          type="password"
          placeholder={t("auth", "confirmPassword")}
          value={confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          isLoading={isLoading}
          onFocus={handleFocus}
          onBlur={() => handleBlur("confirmPassword")}
          isPassword={true}
          togglePassword={togglePassword}
          showPassword={showPassword}
          error={fieldErrors.confirmPassword}
        >
          <ShieldCheck size={16} />
        </FormInput>

        <button type="submit" disabled={isLoading || !isFormValid} className={buttonClasses.genButton}>
          {isLoading ? t("auth", "creatingAccount") : t("auth", "signup")}
        </button>

        <div className={classes.divider}>
          <span>{t("auth", "orLoginWith")}</span>
        </div>

        <button
          type="button"
          className={classes.googleBtn}
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {t("auth", "continueWithGoogle")}
        </button>

        <p className={classes.signupLink}>
          {t("auth", "hasAccount")}{" "}
          <span onClick={() => navigate("/login")} className={classes.link}>
            {t("auth", "login")}
          </span>
        </p>
      </form>
    </div>
  );
}

export default Signup;
