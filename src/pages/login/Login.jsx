import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import FormInput from "./FormInput";
import { useRecipeBook } from "../../context";
import { loginUser, resetPassword } from "../../firebase/authService";

import classes from "./login.module.css";

function Login() {
  const { login } = useRecipeBook();

  // State management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const navigate = useNavigate();

  // Welcome message effect
  useEffect(() => {
    setShowWelcome(true);
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

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
      {showWelcome && (
        <p className={classes.welcome}>Welcome to Recipe Book App! 👋</p>
      )}
      <form className={classes.loginForm} onSubmit={handleSubmit}>
        <p className={classes.title}>Login</p>
        {error && <p className={classes.error}>{error}</p>}

        <FormInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
          isLoading={isLoading}
          onFocus={handleFocus}
        />

        <FormInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          isLoading={isLoading}
          onFocus={handleFocus}
          isPassword={true}
          togglePassword={togglePassword}
          showPassword={showPassword}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <p className={classes.forgotPassword}>
          <span
            onClick={() => setShowForgotPassword(true)}
            className={classes.link}
          >
            Forgot Password?
          </span>
        </p>

        <p className={classes.signupLink}>
          Don't have an account?{" "}
          <span onClick={() => navigate("/signup")} className={classes.link}>
            Sign Up
          </span>
        </p>
      </form>

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
            <p className={classes.title}>Reset Password</p>
            <p className={classes.subtitle}>
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            {error && <p className={classes.error}>{error}</p>}
            {resetMessage && <p className={classes.success}>{resetMessage}</p>}

            <FormInput
              type="email"
              placeholder="Email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              isLoading={isResetting}
              onFocus={handleFocus}
            />

            <button type="submit" disabled={isResetting}>
              {isResetting ? "Sending..." : "Send Reset Link"}
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
              Back to Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Login;
