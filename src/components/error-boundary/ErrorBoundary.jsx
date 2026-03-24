import React from "react";
import { BackButton } from "../controls/back-button";
import classes from "./error-boundary.module.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={classes.errorContainer}>
          <p className={classes.errorMessage}>
            {this.props.fallbackMessage || "Something went wrong"}
          </p>
          <BackButton
            onClick={() => {
              this.handleReset();
              window.history.back();
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
