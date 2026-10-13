import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  ShieldAlert, 
  LogOut,
  Shield,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export const Sidebar = () => {
  const { logoutUser, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isCitizen = Boolean(user && (user.isCitizen || user.role === 'citizen'));

  // Citizens report problems. Officials review what citizens reported, from
  // the complaints list on their dashboard. Neither needs the other's menu.
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, audience: 'official' },
    { name: 'Tender Intelligence', path: '/tenders', icon: FileText, audience: 'official' },
    { name: 'Project Monitoring', path: '/projects', icon: Activity, audience: 'official' },
    { name: 'Contractor Registry', path: '/contractors', icon: Users, audience: 'official' },
    { name: 'Contractor Analytics', path: '/contractors-analysis', icon: BarChart3, audience: 'official' },
    { name: 'Complaints', path: '/verify', icon: ShieldAlert, audience: 'citizen' },
  ];

  const filteredItems = navItems.filter((item) =>
    item.audience === (isCitizen ? 'citizen' : 'official')
  );

  return (
    <div className="w-64 bg-brand-800 text-brand-100 h-full flex flex-col border-r border-brand-900">
      <div className="h-16 flex items-center px-6 border-b border-brand-900 gap-2">
        <div className="h-9 w-9 bg-brand-600 rounded-md flex items-center justify-center text-white font-bold">
          GS
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-tight">GramSetu AI</h1>
          <span className="text-[10px] text-brand-500 font-semibold tracking-wider uppercase flex items-center gap-0.5">
            <Shield className="h-2.5 w-2.5" /> Audit Platform
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
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
                <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-brand-900 hover:bg-red-950/40 hover:text-red-400 text-slate-400 text-xs font-medium rounded-md transition-colors"
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
