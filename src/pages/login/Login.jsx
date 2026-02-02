import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import UsersList from "./UsersList";
import FormInput from "./FormInput";
import { useRecipeBook } from "../../context";
import { users } from "../../app/data/users";

import classes from "./login.module.css";

function Login() {
  const { login } = useRecipeBook();

  // State management
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

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

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  // Login submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userExist = users.some(
        (u) => u.username === username && u.password === password
      );

      if (userExist) {
        const isAdmin = username === "admin";
        await login(isAdmin);
        navigate("/categories");
      } else {
        setError("Invalid username or password");
      }
    } catch (error) {
      setError("An error occurred during login. Please try again.");
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
          type="text"
          placeholder="Username"
          value={username}
          onChange={handleUsernameChange}
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

        <UsersList users={users} />
      </form>
    </div>
  );
}

export default Login;
