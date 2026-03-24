import React from "react";
import PropTypes from "prop-types";
import { Eye, EyeClosed, TriangleAlert, X } from "lucide-react";
import classes from "./FormInput.module.css";

function FormInput({
  type,
  placeholder,
  value,
  onChange,
  isLoading,
  onFocus,
  onBlur,
  isPassword,
  togglePassword,
  showPassword,
  inputRef,
  children,
  error,
  onClear,
}) {
  const hasIcon = !!children;
  const errorClass = error ? classes.inputError : "";
  const requiredPlaceholder = `${placeholder} *`;

  if (isPassword) {
    return (
      <div className={classes.fieldWrapper}>
        <div className={`${classes.passwordInput} ${hasIcon ? classes.hasIcon : ""} ${errorClass}`}>
          {hasIcon && <span className={classes.inputIcon}>{children}</span>}
          <input
            type="text"
            style={!showPassword ? { WebkitTextSecurity: "disc" } : undefined}
            placeholder={requiredPlaceholder}
            value={value}
            onChange={onChange}
            disabled={isLoading}
            required
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="current-password"
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
        {error && <span className={classes.fieldError}><TriangleAlert size={14} /> {error}</span>}
      </div>
    );
  }

  if (hasIcon) {
    const showClear = onClear && value;
    return (
      <div className={classes.fieldWrapper}>
        <div className={`${classes.inputWrapper} ${classes.hasIcon} ${showClear ? classes.hasClear : ""} ${errorClass}`}>
          <span className={classes.inputIcon}>{children}</span>
          <input
            ref={inputRef}
            type={type}
            placeholder={requiredPlaceholder}
            value={value}
            onChange={onChange}
            disabled={isLoading}
            required
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete={type === "email" ? "email" : "off"}
          />
          {showClear && (
            <button type="button" onClick={onClear} className={classes.clearButton} tabIndex={-1}>
              <X size={18} />
            </button>
          )}
        </div>
        {error && <span className={classes.fieldError}><TriangleAlert size={14} /> {error}</span>}
      </div>
    );
  }

  return (
    <div className={classes.fieldWrapper}>
      <div className={`${classes.inputWrapper} ${errorClass}`}>
        <input
          ref={inputRef}
          type={type}
          placeholder={requiredPlaceholder}
          value={value}
          onChange={onChange}
          disabled={isLoading}
          required
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete={type === "email" ? "email" : "off"}
        />
      </div>
      {error && <span className={classes.fieldError}><TriangleAlert size={14} /> {error}</span>}
    </div>
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
