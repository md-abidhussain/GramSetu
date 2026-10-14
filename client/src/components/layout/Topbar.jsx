import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import NotificationBell from '../dashboard/NotificationBell.jsx';
import { Shield } from 'lucide-react';

export const Topbar = ({ title }) => {
  const { user } = useAuth();
  const isAuthority = user && user.role !== 'citizen' && !user.isCitizen;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-30 shrink-0">
      <div>
        <h2 className="text-base font-bold text-dark-800 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {isAuthority && <NotificationBell />}
        
        {!user && (
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Official Login</span>
          </Link>
        )}
        
        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-dark-800">{user ? user.name : 'Citizen User'}</p>
            <p className="text-xs text-slate-400 capitalize">{user ? user.role : 'Public Guest'}</p>
          </div>
          <div className="h-9 w-9 bg-brand-50 text-brand-600 rounded-md flex items-center justify-center font-bold text-sm select-none border border-brand-100">
            {user ? user.name.charAt(0).toUpperCase() : 'C'}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Topbar;

