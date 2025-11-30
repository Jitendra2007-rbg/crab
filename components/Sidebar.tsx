

import React from 'react';
import { 
  MessageSquarePlus, 
  Clock, 
  Calendar, 
  User, 
  X, 
  ChevronRight,
  LogOut,
  Settings,
  Trash2
} from 'lucide-react';
import { AppMode, ChatSession } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  navigate: (mode: AppMode) => void;
  onNewChat: () => void;
  onLoadSession: (session: ChatSession) => void;
  chatSessions: ChatSession[];
  onDeleteSession: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  setIsOpen, 
  navigate, 
  onNewChat,
  onLoadSession,
  chatSessions,
  onDeleteSession
}) => {
  const { user, logout } = useAuth();

  const handleNav = (mode: AppMode) => {
      navigate(mode);
      setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 w-80 bg-white dark:bg-dark-bg 
        border-r border-gray-200 dark:border-gray-800 
        z-50 transform transition-transform duration-300 ease-in-out 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        shadow-2xl flex flex-col
      `}>
            
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                        <span className="font-bold text-white dark:text-black text-lg">C</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">CRAB</span>
                </div>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-500 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 pb-2 space-y-4">
                <button 
                    onClick={() => { onNewChat(); setIsOpen(false); }}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl transition-all active:scale-95 shadow-md"
                >
                    <MessageSquarePlus size={20} strokeWidth={2} />
                    <span className="font-semibold">New Chat</span>
                </button>
            </div>

            <nav className="px-4 py-2 space-y-1">
                <MenuItem icon={<Clock size={20} />} label="Reminders" onClick={() => handleNav(AppMode.REMINDERS)} />
                <MenuItem icon={<Calendar size={20} />} label="Schedule" onClick={() => handleNav(AppMode.SCHEDULE)} />
                {/* Settings removed from here, moved to Account bottom section */}
            </nav>

            <div className="flex-1 overflow-y-auto mt-6 px-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">History</h3>
                <div className="space-y-2">
                    {chatSessions.length === 0 ? (
                        <p className="text-gray-400 text-sm italic">No recent chats</p>
                    ) : (
                        chatSessions.map(session => (
                            <div 
                                key={session.id} 
                                className="w-full text-left group flex items-center justify-between py-2 pr-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors cursor-pointer"
                            >
                                <button 
                                    onClick={() => { onLoadSession(session); setIsOpen(false); }}
                                    className="flex-1 truncate"
                                >
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-full block truncate">
                                        {session.title}
                                    </span>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <button 
                        onClick={() => handleNav(AppMode.SETTINGS)}
                        className="flex-1 flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300">
                            <User size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Account</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{user?.email}</p>
                        </div>
                        <Settings size={16} className="text-gray-400" />
                    </button>
                    <button onClick={logout} className="ml-2 p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
      </div>
    </>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick} 
        className="w-full flex items-center space-x-4 px-4 py-3.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface hover:text-black dark:hover:text-white rounded-xl transition-all"
    >
        <span className="text-current">{icon}</span>
        <span className="font-medium">{label}</span>
    </button>
);

export default Sidebar;