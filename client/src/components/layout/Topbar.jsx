import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import NotificationBell from '../dashboard/NotificationBell.jsx';
import Logo from '../ui/Logo.jsx';
import { LogIn } from 'lucide-react';

export const Topbar = ({ title }) => {
  const { user } = useAuth();
  const isAuthority = Boolean(user) && user.role !== 'citizen' && !user.isCitizen;

  return (
    <header className="z-30 border-b border-surface-border bg-white">
      <div className="flex min-h-[4.25rem] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Logo className="h-8 w-8 shrink-0 md:hidden" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-700 tracking-wide uppercase">GramSetu</p>
            <h1 className="truncate text-lg sm:text-xl font-bold tracking-tight text-brand-900">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthority && <NotificationBell />}

          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-brand-900 truncate max-w-[180px]">{user.name}</p>
                <p className="text-xs capitalize text-stone-500">{user.role}</p>
              </div>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-brand-200 bg-brand-50 text-sm font-semibold text-brand-800"
              >
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-brand-800 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-900"
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
