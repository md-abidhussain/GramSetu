import React from 'react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px] touch-manipulation';
  
  const variants = {
    primary: 'bg-brand-800 hover:bg-brand-900 text-white shadow-sm',
    secondary: 'bg-surface-subtle hover:bg-surface-border text-brand-900 border border-surface-border',
    outline: 'border border-surface-border hover:border-brand-400 text-brand-900 hover:bg-surface-subtle',
    danger: 'bg-red-700 hover:bg-red-800 text-white shadow-sm',
    ghost: 'hover:bg-surface-subtle text-stone-600 hover:text-brand-900'
  };

  const sizes = 'px-4 py-2.5';

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${sizes} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
