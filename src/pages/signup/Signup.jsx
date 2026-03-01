import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../../firebase/authService";
import { useLanguage } from "../../context";
import FormInput from "../login/FormInput";
import { Onboarding } from "../onboarding";
import { User, Mail, Lock, ShieldCheck, TriangleAlert } from "lucide-react";

import buttonClasses from "../../components/controls/gen-button.module.css";
import classes from "../login/login.module.css";

function Signup() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
