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

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, role: 'authority' },
    { name: 'Tender Intelligence', path: '/tenders', icon: FileText, role: 'authority' },
    { name: 'Project Monitoring', path: '/projects', icon: Activity, role: 'authority' },
    { name: 'Contractor Registry', path: '/contractors', icon: Users, role: 'authority' },
    { name: 'Contractor Analytics', path: '/contractors-analysis', icon: BarChart3, role: 'authority' },
    { name: 'Citizen Portal', path: '/verify', icon: ShieldAlert, role: 'any' },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.role === 'any') {
      // Citizens only see Citizen Portal; Officials can see everything
      return true;
    }
    return user && user.role !== 'citizen' && !user.isCitizen;
  });

  return (
    <div className="w-64 bg-dark-900 text-slate-300 h-full flex flex-col border-r border-dark-800">
      <div className="h-16 flex items-center px-6 border-b border-dark-800 gap-2">
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
                  : 'text-slate-400 hover:bg-dark-800 hover:text-slate-100'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="p-4 border-t border-dark-800">
          <div className="bg-dark-950/40 rounded-md p-4 flex flex-col gap-3">
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
              className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-dark-800 hover:bg-red-950/20 hover:text-red-400 text-slate-400 text-xs font-medium rounded-md transition-colors"
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
