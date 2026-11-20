import React from 'react';

export const Select = ({
  label,
  id,
  options = [],
  error,
  placeholder,
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
      <select
        id={id}
        required={required}
        className={`w-full bg-white border border-surface-border rounded-md px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700 text-brand-900 min-h-[42px] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3D%22www.w3.org%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2378716c%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:1.25em] bg-[right_1rem_center] bg-no-repeat ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''
        }`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
    </div>
  );
};

export default Select;
