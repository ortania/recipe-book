import React from "react";
import PropTypes from "prop-types";
import { Eye, EyeClosed, TriangleAlert } from "lucide-react";
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
            type={showPassword ? "text" : "password"}
            placeholder={requiredPlaceholder}
            value={value}
            onChange={onChange}
            disabled={isLoading}
            required
            readOnly
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="off"
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
    return (
      <div className={classes.fieldWrapper}>
        <div className={`${classes.inputWrapper} ${classes.hasIcon} ${errorClass}`}>
          <span className={classes.inputIcon}>{children}</span>
          <input
            ref={inputRef}
            type={type}
            placeholder={requiredPlaceholder}
            value={value}
            onChange={onChange}
            disabled={isLoading}
            required
            readOnly
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="off"
          />
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
          readOnly
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete="off"
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
