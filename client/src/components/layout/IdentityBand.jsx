import React from 'react';

/**
 * Institutional Identity Band across the top of all pages.
 * Minimalist GovTech header asserting civic transparency and project purpose.
 */
const IdentityBand = () => (
  <div className="border-b border-brand-900/60 bg-brand-900 text-stone-200">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-1.5 text-xs sm:px-6">
      <p className="font-medium tracking-wide">
        GramSetu &middot; Public Civil Infrastructure Monitoring
      </p>
      <p className="text-stone-300 text-[11px]">
        Civic Transparency & Defect Audit Demonstration
      </p>
    </div>
  </div>
);

export default IdentityBand;
