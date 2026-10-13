import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { formatDate } from '../../lib/formatDate.js';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';

// Messages sent to this citizen as their complaints move along.
export const NotificationsPanel = ({ notifications, loading: loadingNotifications, onMarkRead: handleMarkNotificationRead }) => {
  return (
    <Card>
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="h-4 w-4" /> Message Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loadingNotifications ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-600 mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs italic">
            No notifications available.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notif => (
              <div key={notif._id} className={`p-4 flex items-start justify-between gap-3 ${notif.read ? 'opacity-60 bg-white' : 'bg-brand-50/10'}`}>
                <div className="flex gap-2.5">
                  <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center ${
                    notif.type === 'success' ? 'bg-emerald-50 text-emerald-600' : notif.type === 'warning' ? 'bg-amber-50 text-amber-600' : notif.type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {notif.type === 'success' ? <CheckCircle className="h-4.5 w-4.5" /> : <AlertCircle className="h-4.5 w-4.5" />}
                  </div>
                  <div>
                    <p className="text-xs text-dark-800 leading-normal font-medium">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">{formatDate(notif.createdAt)}</span>
                  </div>
                </div>

                {!notif.read && (
                  <button
                    onClick={() => handleMarkNotificationRead(notif._id)}
                    className="text-[10px] text-brand-600 hover:text-brand-700 font-bold shrink-0"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationsPanel;
