import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
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
    <div className="hidden w-64 shrink-0 flex-col border-r border-brand-900 bg-brand-800 text-brand-100 md:flex">
      {/* The name is already in the header above the content. This panel just
          says which part of the service these links belong to. */}
      <div className="border-b border-brand-900 px-6 py-4">
        <p className="text-sm font-semibold text-white">
          {isCitizen ? 'Your reports' : 'Official tools'}
        </p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            // The citizen sections are one route with a ?tab= value, so React
            // Router would mark all of them active. Compare the whole link.
            className={() =>
              `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isCurrent(item.path)
                  ? 'bg-brand-600 text-white'
                  : 'text-brand-100/80 hover:bg-brand-700 hover:text-white'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="p-4 border-t border-brand-900">
          <div className="bg-brand-900/50 rounded-md p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-slate-700 text-slate-200 font-semibold rounded-full flex items-center justify-center uppercase text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-600 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-brand-900 hover:bg-red-950/40 hover:text-red-400 text-slate-600 text-xs font-medium rounded-md transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Sidebar;
