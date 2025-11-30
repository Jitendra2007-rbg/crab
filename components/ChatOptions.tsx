import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, FileText } from 'lucide-react';

interface ChatOptionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}

const ChatOptions: React.FC<ChatOptionsProps> = ({ onEdit, onDelete, onExport }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-full transition-colors"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <div className="absolute right-0 top-10 z-20 w-48 bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-1 animate-zoom-in">
                <button 
                    onClick={() => { onEdit(); setIsOpen(false); }}
                    className="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                >
                    <Edit2 size={16} />
                    <span>Rename Chat</span>
                </button>
                <button 
                    onClick={() => { onExport(); setIsOpen(false); }}
                    className="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                >
                    <FileText size={16} />
                    <span>Export PDF</span>
                </button>
                <button 
                    onClick={() => { onDelete(); setIsOpen(false); }}
                    className="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-sm border-t border-gray-100 dark:border-gray-800"
                >
                    <Trash2 size={16} />
                    <span>Delete</span>
                </button>
            </div>
        </>
      )}
    </div>
  );
};

export default ChatOptions;