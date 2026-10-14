import React from 'react';

/**
 * The strip across the top of every page.
 *
 * Indian government service portals open with a band that says plainly who
 * runs the site before anything else appears. This follows that pattern, and
 * says in the same breath that GramSetu is a demonstration project rather than
 * a live government service, because a portal that looks official while not
 * being official is the one thing this design must not do.
 */
const IdentityBand = () => (
  <div className="border-b border-brand-900/40 bg-brand-900 text-white">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-1.5 text-xs sm:px-6">
      <p className="font-medium">
        Public Infrastructure Transparency Platform
      </p>
      <p className="text-brand-100">
        Demonstration project &middot; not an official government service
      </p>
    </div>
  </div>
);

export default IdentityBand;
