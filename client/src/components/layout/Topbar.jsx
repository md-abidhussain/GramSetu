import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import NotificationBell from '../dashboard/NotificationBell.jsx';
import { LogIn } from 'lucide-react';

const Monogram = () => (
  <span
    aria-hidden="true"
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-700 text-sm font-bold text-white"
  >
    GS
  </span>
);

export const Topbar = ({ title }) => {
  const { user } = useAuth();
  const isAuthority = Boolean(user) && user.role !== 'citizen' && !user.isCitizen;

  return (
    <header className="z-30 border-b border-slate-200 bg-white">
      <div className="flex min-h-[4.5rem] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Monogram />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-800">GramSetu</p>
            {/* The page name is the heading for the content below it, so it is
                the h1 rather than decorative text. */}
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthority && <NotificationBell />}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-sm capitalize text-slate-600">{user.role}</p>
              </div>
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-base font-semibold text-brand-700"
              >
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            // Nobody is signed in, so no name is shown. It used to read
            // "Citizen User / Public Guest", which looked like an account.
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
