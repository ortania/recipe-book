import React from "react";
import PropTypes from "prop-types";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
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
}) {
  if (isPassword) {
    return (
      <div className={classes.passwordInput}>
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
          {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
        </button>
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
