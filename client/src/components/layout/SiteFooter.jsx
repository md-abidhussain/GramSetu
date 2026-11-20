import React from 'react';
import Logo from '../ui/Logo.jsx';

const SiteFooter = () => (
  <footer className="border-t border-surface-border bg-white mt-auto">
    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center gap-2.5">
        <Logo className="h-5 w-5 shrink-0" />
        <p className="text-xs text-stone-600">
          <span className="font-semibold text-brand-900">GramSetu</span> &mdash; Open GovTech Demonstration Platform.
        </p>
      </div>

      <p className="text-xs text-stone-500 sm:text-right">
        Verification & AI Monitoring System
      </p>
    </div>
  </footer>
);

export default SiteFooter;
