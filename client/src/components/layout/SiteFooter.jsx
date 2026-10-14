import React from 'react';
import Logo from '../ui/Logo.jsx';

const SiteFooter = () => (
  <footer className="border-t border-slate-200 bg-white">
    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center gap-2.5">
        <Logo className="h-6 w-6 shrink-0" />
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">GramSetu</span> — a student
          project. Everything shown here is sample data.
        </p>
      </div>

      <p className="text-sm text-slate-600 sm:text-right">
        Not run by any government department
      </p>
    </div>
  </footer>
);

export default SiteFooter;
