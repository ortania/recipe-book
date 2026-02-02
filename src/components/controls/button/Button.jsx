import React from 'react';
import classes from './button.module.css';
import commonClasses from '../controls.module.css';

/**
 * Reusable Button component for various button types
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (primary, danger, success)
 * @param {Function} props.onClick - Click handler function
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.type - Button type attribute
 * @param {string} props.title - Button title attribute
 * @returns {JSX.Element} - Button component
 */
const Button = ({ 
  variant = 'primary', 
  onClick, 
  disabled, 
  className, 
  children,
  type = 'button',
  title
}) => {
  // Get the variant class based on the variant prop
  const getVariantClass = () => {
    switch (variant) {
      case 'danger':
        return classes.danger;
      case 'success':
        return classes.success;
      case 'favorite':
        return classes.favorite;
      case 'primary':
      default:
        return classes.primary;
    }
  };

  return (
    <button
      className={`${commonClasses.button} ${getVariantClass()} ${disabled ? commonClasses.disabled : ''} ${className || ''}`}
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
