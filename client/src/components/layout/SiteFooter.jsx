import React from 'react';

/**
 * Government service sites close with who is responsible for the page, when it
 * last changed, and how to raise an accessibility problem. Those three things
 * are what make a public site accountable, so they are here rather than in a
 * marketing footer.
 */
const SiteFooter = () => (
  <footer className="border-t border-slate-200 bg-white">
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">GramSetu</p>
          <p className="mt-1 max-w-md text-sm text-slate-600">
            Built as a student project to show how citizen reports, inspection
            and contractor accountability could work together. The data shown is
            sample data.
          </p>
        </div>

        <dl className="text-sm text-slate-600">
          <div className="flex gap-2">
            <dt className="font-medium text-slate-700">Content owner</dt>
            <dd>Project team</dd>
          </div>
          <div className="mt-1 flex gap-2">
            <dt className="font-medium text-slate-700">Accessibility</dt>
            <dd>Built to WCAG 2.1 AA</dd>
          </div>
        </dl>
      </div>

      <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
        This site is not operated by any government department. Do not submit
        real personal information.
      </p>
    </div>
  </footer>
);

export default SiteFooter;
