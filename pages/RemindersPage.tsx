
import React, { useState } from 'react';
import { Plus, Check, Trash2, Clock, Edit2, X, List, Calendar } from 'lucide-react';
import { Reminder } from '../types';
import DateTimePicker from '../components/DateTimePicker';

interface RemindersPageProps {
  reminders: Reminder[];
  addReminder: (text: string, time: string, date?: string) => void;
  updateReminder: (id: string, text: string, time: string, date?: string) => void;
  toggleReminder: (id: string, completed: boolean) => void;
  deleteReminder: (id: string) => void;
}

const RemindersPage: React.FC<RemindersPageProps> = ({ reminders, addReminder, updateReminder, toggleReminder, deleteReminder }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Custom Picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'both'>('both');
  const [pickerContext, setPickerContext] = useState<'add' | 'edit'>('add');

  const [newText, setNewText] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDate, setNewDate] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDate, setEditDate] = useState('');

  const handleAdd = () => {
    if (!newText.trim()) return;
    const dateVal = newDate || new Date().toISOString().split('T')[0];
    addReminder(newText, newTime || '09:00', dateVal);
    setNewText('');
    setNewTime('');
    setNewDate('');
    setIsAdding(false);
  };

  const startEditing = (r: Reminder) => {
      setEditingId(r.id);
      setEditText(r.text);
      setEditTime(r.time.includes(':') ? r.time : ''); 
      setEditDate(r.date || '');
  };

  const saveEdit = () => {
      if (editingId && editText.trim()) {
          updateReminder(editingId, editText, editTime || '09:00', editDate);
          setEditingId(null);
      }
  };

  const openPicker = (context: 'add' | 'edit', mode: 'date' | 'time' | 'both') => {
      setPickerContext(context);
      setPickerMode(mode);
      setPickerOpen(true);
  };

  const handlePickerSelect = (d: string, t: string) => {
      if (pickerContext === 'add') {
          if (pickerMode === 'date' || pickerMode === 'both') setNewDate(d);
          if (pickerMode === 'time' || pickerMode === 'both') setNewTime(t);
      } else {
          if (pickerMode === 'date' || pickerMode === 'both') setEditDate(d);
          if (pickerMode === 'time' || pickerMode === 'both') setEditTime(t);
      }
  };

  const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h2>
            <p className="text-sm text-gray-500">Don't forget the small things.</p>
        </div>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="p-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:opacity-90 transition-opacity shadow-lg active:scale-95"
        >
            <Plus size={24} />
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-up">
            <input 
                autoFocus
                type="text" 
                placeholder="What needs to be done?"
                className="w-full bg-transparent text-lg font-medium outline-none text-gray-900 dark:text-white placeholder-gray-400 mb-3"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
            />
            <div className="flex space-x-3 mb-4">
                <button 
                    onClick={() => openPicker('add', 'time')}
                    className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg flex-1 text-left"
                >
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{newTime || 'Set Time'}</span>
                </button>
                <button 
                    onClick={() => openPicker('add', 'date')}
                    className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg flex-1 text-left"
                >
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{newDate || 'Set Date'}</span>
                </button>
            </div>
            <div className="flex justify-end space-x-2">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                <button onClick={handleAdd} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium">Add</button>
            </div>
        </div>
      )}

      <div className="space-y-3">
        {reminders.length === 0 && !isAdding && (
            <div className="text-center py-20 opacity-50">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <List size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500">No tasks yet.</p>
            </div>
        )}
        {reminders.map(r => (
            <div 
                key={r.id} 
                className={`group flex items-center justify-between p-4 bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md ${r.completed ? 'opacity-50' : ''}`}
            >
                {editingId === r.id ? (
                    <div className="w-full animate-fade-in">
                        <input 
                            type="text" 
                            className="w-full bg-gray-50 dark:bg-gray-800 p-2 rounded mb-2 text-gray-900 dark:text-white outline-none font-medium"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="flex space-x-2 mb-2">
                            <button onClick={() => openPicker('edit', 'time')} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded flex-1">
                                <Clock size={14} className="text-gray-400" />
                                <span className="text-sm dark:text-white">{editTime || 'Time'}</span>
                            </button>
                            <button onClick={() => openPicker('edit', 'date')} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded flex-1">
                                <Calendar size={14} className="text-gray-400" />
                                <span className="text-sm dark:text-white">{editDate || 'Date'}</span>
                            </button>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><X size={18} /></button>
                            <button onClick={saveEdit} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"><Check size={18} /></button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center space-x-4 flex-1">
                            <button 
                                onClick={() => toggleReminder(r.id, !r.completed)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${r.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}
                            >
                                {r.completed && <Check size={14} className="text-white" />}
                            </button>
                            <div className="overflow-hidden">
                                <p className={`font-medium text-gray-900 dark:text-white truncate ${r.completed ? 'line-through' : ''}`}>{r.text}</p>
                                <div className="flex items-center space-x-3 mt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                        <Clock size={12} className="mr-1" /> {r.time}
                                    </p>
                                    {r.date && (
                                        <p className="text-xs text-gray-400 flex items-center">
                                            <Calendar size={12} className="mr-1" /> {formatDate(r.date)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-1">
                            <button onClick={() => startEditing(r)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => deleteReminder(r.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        ))}

        <DateTimePicker 
            isOpen={pickerOpen} 
            onClose={() => setPickerOpen(false)} 
            onSelect={handlePickerSelect} 
            mode={pickerMode}
            initialDate={pickerContext === 'edit' ? editDate : newDate}
            initialTime={pickerContext === 'edit' ? editTime : newTime}
        />
      </div>
    </div>
  );
};

export default RemindersPage;
