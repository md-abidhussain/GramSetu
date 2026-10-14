import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications.js';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="p-2 text-slate-600 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 focus:outline-none relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-xs font-semibold text-white rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
          <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
            <span className="font-semibold text-sm text-dark-800">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs text-brand-600 font-medium">{unreadCount} new</span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-600">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markAsRead(n._id)}
                  className={`p-3.5 flex gap-3 cursor-pointer transition-colors ${
                    n.read ? 'bg-white hover:bg-slate-50' : 'bg-brand-50/30 hover:bg-brand-50/50'
                  }`}
                >
                  {getIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs text-dark-800 leading-normal ${!n.read ? 'font-medium' : ''}`}>
                      {n.message}
                    </p>
                    <span className="text-xs text-slate-600 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationBell;
