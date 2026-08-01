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
        <label htmlFor={id} className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        required={required}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-dark-800 placeholder-slate-400 ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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
        <label htmlFor={id} className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        required={required}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-dark-800 placeholder-slate-400 ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
