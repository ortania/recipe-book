import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../../firebase/authService";
import { useLanguage } from "../../context";
import FormInput from "../login/FormInput";
import { Onboarding } from "../onboarding";
import { User, Mail, Lock, ShieldCheck } from "lucide-react";

import buttonClasses from "../../components/controls/gen-button.module.css";
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
  const [onboardingDone, setOnboardingDone] = useState(
    () => !!localStorage.getItem("onboardingDone"),
  );

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

    if (!displayName.trim()) {
      setError(t("auth", "nameRequired"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError(t("auth", "emailError"));
      return;
    }

    if (!password || password.length < 6) {
      setError(t("auth", "passwordError"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth", "passwordsDontMatch"));
      return;
    }

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
        {error && <p className={classes.error}>{error}</p>}

        <FormInput
          type="text"
          placeholder={t("auth", "displayName")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          isLoading={isLoading}
          onFocus={handleFocus}
        >
          <User size={16} />
        </FormInput>

        <FormInput
          type="email"
          placeholder={t("auth", "email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          isLoading={isLoading}
          onFocus={handleFocus}
        >
          <Mail size={16} />
        </FormInput>

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
        >
          <Lock size={16} />
        </FormInput>

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
        >
          <ShieldCheck size={16} />
        </FormInput>

        <button type="submit" disabled={isLoading} className={buttonClasses.genButton}>
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
