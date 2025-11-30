import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsPageProps {
  notifications: NotificationItem[];
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications }) => {
  const getIcon = (type: string) => {
      switch(type) {
          case 'success': return <CheckCircle size={20} className="text-green-500" />;
          case 'warning': return <AlertTriangle size={20} className="text-orange-500" />;
          default: return <Info size={20} className="text-blue-500" />;
      }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg animate-fade-in">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          <span className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 text-xs font-bold px-2 py-1 rounded-full">{notifications.length} New</span>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
             <div className="flex flex-col items-center justify-center pt-20 opacity-50 space-y-4">
                 <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Bell size={32} className="text-gray-400" />
                 </div>
                 <p className="text-gray-500">No new notifications</p>
             </div>
        ) : (
            notifications.map((n) => (
                <div key={n.id} className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex space-x-4 animate-slide-up">
                    <div className="mt-1">
                        {getIcon(n.type)}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <h4 className="font-semibold text-gray-900 dark:text-white">{n.title}</h4>
                             <span className="text-xs text-gray-400">{n.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{n.message}</p>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;