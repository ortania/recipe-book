import React from "react";
import PropTypes from "prop-types";
import { Eye, EyeClosed } from "lucide-react";
import classes from "./FormInput.module.css";

function FormInput({
  type,
  placeholder,
  value,
  onChange,
  isLoading,
  onFocus,
  isPassword,
  togglePassword,
  showPassword,
  inputRef,
  children,
}) {
  const hasIcon = !!children;

  if (isPassword) {
    return (
      <div className={`${classes.passwordInput} ${hasIcon ? classes.hasIcon : ""}`}>
        {hasIcon && <span className={classes.inputIcon}>{children}</span>}
        <input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={isLoading}
          required
          readOnly
          onFocus={onFocus}
        />
        <button
          type="button"
          onClick={togglePassword}
          className={classes.eyeButton}
          disabled={isLoading}
        >
          {showPassword ? <Eye size={30} /> : <EyeClosed size={30} />}
        </button>
      </div>
    );
  }

  if (hasIcon) {
    return (
      <div className={`${classes.inputWrapper} ${classes.hasIcon}`}>
        <span className={classes.inputIcon}>{children}</span>
        <input
          ref={inputRef}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={isLoading}
          required
          readOnly
          onFocus={onFocus}
        />
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={isLoading}
      required
      readOnly
      onFocus={onFocus}
    />
  );
}

FormInput.propTypes = {
  type: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onFocus: PropTypes.func.isRequired,
  isPassword: PropTypes.bool,
  togglePassword: PropTypes.func,
  showPassword: PropTypes.bool,
  inputRef: PropTypes.object,
};

FormInput.defaultProps = {
  isPassword: false,
  togglePassword: () => {},
  showPassword: false,
};

export default FormInput;
