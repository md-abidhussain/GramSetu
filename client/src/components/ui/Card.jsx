import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-surface-border shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-b border-surface-border bg-surface-subtle/40 flex items-center justify-between gap-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-base font-semibold text-brand-900 tracking-tight ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-6 ${className}`}>
    {children}
  </div>
);
