import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import Logo from '../ui/Logo.jsx';
import { isCitizenUser, makeIsCurrent, navItemsFor } from './navItems.js';

export const Sidebar = () => {
  const { logoutUser, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isCitizen = isCitizenUser(user);
  const isCurrent = makeIsCurrent(location.pathname + location.search);
  const filteredItems = navItemsFor(user);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-brand-900 bg-brand-800 text-brand-100 md:flex">
      <div className="flex items-center gap-3 border-b border-brand-900/80 px-6 py-4 bg-brand-900/40">
        <Logo className="h-7 w-7 shrink-0" onDark />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white tracking-tight">GramSetu</p>
          <p className="text-xs text-brand-200 truncate">
            {isCitizen ? 'Citizen Portal' : 'Official Portal'}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={() =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isCurrent(item.path)
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-brand-100/80 hover:bg-brand-700/50 hover:text-white'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="p-3 border-t border-brand-900/80">
          <div className="bg-brand-900/60 rounded-md p-3 flex flex-col gap-2.5 border border-brand-900/40">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-brand-700 text-brand-100 font-semibold rounded-full flex items-center justify-center uppercase text-xs shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-brand-200 capitalize truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-2.5 py-1.5 bg-brand-900 hover:bg-red-950/40 hover:text-red-200 text-brand-200 text-xs font-medium rounded transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
