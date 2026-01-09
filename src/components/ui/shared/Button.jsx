import React, { forwardRef } from 'react';
import './shared.css';

/**
 * Button - Reusable button component with multiple variants
 *
 * @param {string} variant - Button style: 'primary', 'secondary', 'danger', 'success', 'ghost', 'outline'
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} fullWidth - Make button full width
 * @param {boolean} iconOnly - Icon-only button (square)
 * @param {boolean} disabled - Disable button
 * @param {string} type - Button type: 'button', 'submit', 'reset'
 * @param {function} onClick - Click handler
 * @param {React.ReactNode} children - Button content
 * @param {string} className - Additional CSS classes
 */
const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
  title,
  ...props
}, ref) => {
  const buttonClassName = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    fullWidth ? 'btn-full' : '',
    iconOnly ? 'btn-icon' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

// Export variant-specific buttons for convenience
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;

export default Button;
