
import React, { useState } from 'react';
import { Plus, Calendar as CalendarIcon, Edit2, Check, X, Clock, Trash2, ChevronRight } from 'lucide-react';
import { ScheduleItem } from '../types';
import DateTimePicker from '../components/DateTimePicker';

interface SchedulePageProps {
  schedules: ScheduleItem[];
  addSchedule: (title: string, start: string, end: string, date: string) => void;
  updateSchedule: (id: string, title: string, start: string, end: string, date: string) => void;
  deleteSchedule: (id: string) => void;
}

const SchedulePage: React.FC<SchedulePageProps> = ({ schedules, addSchedule, updateSchedule, deleteSchedule }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Custom Picker State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'both'>('both');
  const [pickerTarget, setPickerTarget] = useState<'addStart' | 'addEnd' | 'addDate'>('addStart');

  // Add State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    addSchedule(title, startTime || '09:00', endTime || '10:00', date);
    setTitle('');
    setStartTime('');
    setEndTime('');
    setIsAdding(false);
  };

  const startEditing = (item: ScheduleItem) => {
      setEditingId(item.id);
      setEditTitle(item.title);
      setEditDate(item.date);
      setEditStart(item.startTime);
      setEditEnd(item.endTime);
  };

  const saveEdit = () => {
      if (editingId && editTitle.trim()) {
          updateSchedule(editingId, editTitle, editStart, editEnd, editDate);
          setEditingId(null);
      }
  };

  const openPicker = (target: 'addStart' | 'addEnd' | 'addDate', mode: 'date' | 'time' | 'both') => {
      setPickerTarget(target);
      setPickerMode(mode);
      setPickerOpen(true);
  };

  const handlePickerSelect = (d: string, t: string) => {
      if (pickerTarget === 'addDate') setDate(d);
      else if (pickerTarget === 'addStart') setStartTime(t);
      else if (pickerTarget === 'addEnd') setEndTime(t);
  };

  // Group schedules by date
  const groupedSchedules = schedules.reduce((acc, curr) => {
      const d = curr.date || 'Upcoming';
      if (!acc[d]) acc[d] = [];
      acc[d].push(curr);
      return acc;
  }, {} as Record<string, ScheduleItem[]>);

  const sortedDates = Object.keys(groupedSchedules).sort();

  return (
    <div className="p-4 md:p-8 pb-24 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg">
        <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Schedule</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your timeline intelligently.</p>
            </div>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center space-x-2 px-5 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-all shadow-xl active:scale-95"
            >
                <Plus size={20} />
                <span className="font-semibold hidden sm:inline">Add Event</span>
            </button>
        </div>

        {/* Add Modal */}
        {isAdding && (
            <div className="mb-8 bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white">New Event</h3>
                    <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                </div>
                
                <input 
                    autoFocus
                    type="text" 
                    placeholder="Event Title (e.g. Project Meeting)"
                    className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-lg font-bold outline-none text-gray-900 dark:text-white placeholder-gray-400 mb-4 border border-transparent focus:border-blue-500 transition-colors"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Date Picker Trigger */}
                    <button 
                        onClick={() => openPicker('addDate', 'date')}
                        className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-left"
                    >
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Date</label>
                        <div className="flex items-center space-x-2">
                             <CalendarIcon size={16} className="text-gray-500" />
                             <span className="text-gray-900 dark:text-white font-medium">{date}</span>
                        </div>
                    </button>

                    {/* Start Time Trigger */}
                    <button 
                        onClick={() => openPicker('addStart', 'time')}
                        className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-left"
                    >
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Start Time</label>
                        <div className="flex items-center space-x-2">
                             <Clock size={16} className="text-gray-500" />
                             <span className="text-gray-900 dark:text-white font-medium">{startTime || '--:--'}</span>
                        </div>
                    </button>

                    {/* End Time Trigger */}
                    <button 
                        onClick={() => openPicker('addEnd', 'time')}
                        className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-left"
                    >
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">End Time</label>
                        <div className="flex items-center space-x-2">
                             <Clock size={16} className="text-gray-500" />
                             <span className="text-gray-900 dark:text-white font-medium">{endTime || '--:--'}</span>
                        </div>
                    </button>
                </div>

                <div className="flex justify-end">
                    <button onClick={handleAdd} className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-colors">
                        Confirm Schedule
                    </button>
                </div>
            </div>
        )}

        {/* Tabular View */}
        <div className="space-y-8">
            {schedules.length === 0 ? (
                 <div className="text-center py-20 opacity-50 bg-white dark:bg-dark-surface rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No events scheduled.</p>
                </div>
            ) : (
                sortedDates.map((dateKey) => (
                    <div key={dateKey} className="animate-fade-in">
                        <div className="flex items-center space-x-3 mb-4 sticky top-0 bg-gray-50 dark:bg-dark-bg z-10 py-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                {new Date(dateKey).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h3>
                            <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                        </div>

                        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                                            <th className="p-4 font-bold w-32">Time</th>
                                            <th className="p-4 font-bold">Event</th>
                                            <th className="p-4 font-bold w-40 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {groupedSchedules[dateKey].sort((a,b) => a.startTime.localeCompare(b.startTime)).map((item) => (
                                            <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                {editingId === item.id ? (
                                                    <td colSpan={3} className="p-4 bg-blue-50/50 dark:bg-blue-900/10">
                                                        <div className="flex flex-col md:flex-row gap-3">
                                                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="flex-1 bg-white dark:bg-gray-900 p-2 rounded-lg border border-blue-200 dark:border-blue-800 outline-none text-sm font-bold dark:text-white" />
                                                            <div className="flex items-center space-x-2">
                                                                <button onClick={saveEdit} className="p-2 bg-blue-600 text-white rounded-lg"><Check size={16}/></button>
                                                                <button onClick={() => setEditingId(null)} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-lg"><X size={16}/></button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                ) : (
                                                    <>
                                                        <td className="p-4 align-top">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-900 dark:text-white font-mono">{item.startTime}</span>
                                                                <span className="text-xs text-gray-400">{item.endTime}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 align-top">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <p className="font-bold text-gray-800 dark:text-gray-100">{item.title}</p>
                                                                </div>
                                                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => startEditing(item)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 align-top text-right">
                                                            <button onClick={() => deleteSchedule(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        <DateTimePicker 
            isOpen={pickerOpen} 
            onClose={() => setPickerOpen(false)} 
            onSelect={handlePickerSelect}
            mode={pickerMode}
        />
    </div>
  );
};

export default SchedulePage;
