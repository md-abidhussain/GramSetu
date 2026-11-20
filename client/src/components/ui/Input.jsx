import React from 'react';

export const Input = ({
  label,
  id,
  type = 'text',
  error,
  className = '',
  required = false,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-brand-900 mb-1.5">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        required={required}
        className={`w-full bg-white border border-surface-border rounded-md px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700 text-brand-900 placeholder-stone-400 min-h-[42px] ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
    </div>
  );
};

export const Textarea = ({
  label,
  id,
  error,
  className = '',
  rows = 4,
  required = false,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-brand-900 mb-1.5">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        required={required}
        className={`w-full bg-white border border-surface-border rounded-md px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700 text-brand-900 placeholder-stone-400 ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
    </div>
  );
};
