import React from 'react';
import btnClasses from '../../../styles/shared/buttons.module.css';

/**
 * Reusable Button component
 * @param {'main'|'primary'|'soft'|'danger'|'dangerStrong'|'success'|'successStrong'|'warning'|'outline'|'ghost'|'favorite'} variant
 * @param {'sm'|'lg'|undefined} size
 */
const Button = ({
  variant = 'primary',
  size,
  onClick,
  disabled,
  className,
  children,
  type = 'button',
  title,
}) => {
  const variantClass = btnClasses[variant] ?? btnClasses.primary;
  const sizeClass = size ? (btnClasses[size] ?? '') : '';

  return (
    <button
      className={[
        btnClasses.btnBase,
        variantClass,
        sizeClass,
        disabled ? btnClasses.disabled : '',
        className || '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      disabled={disabled}
      type={type}
      title={title}
    >
      {children}
    </button>
  );
};

export default Button;
