
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Clock, Calendar as CalIcon, Check } from 'lucide-react';

interface DateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: string, time: string) => void;
  initialDate?: string;
  initialTime?: string;
  mode?: 'both' | 'date' | 'time';
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  initialDate, 
  initialTime,
  mode = 'both'
}) => {
  const [view, setView] = useState<'date' | 'time'>(mode === 'time' ? 'time' : 'date');
  
  // Date State
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  
  // Time State
  const [hour, setHour] = useState(initialTime ? parseInt(initialTime.split(':')[0]) : 9);
  const [minute, setMinute] = useState(initialTime ? parseInt(initialTime.split(':')[1]) : 0);
  const [ampm, setAmpm] = useState(initialTime ? (parseInt(initialTime.split(':')[0]) >= 12 ? 'PM' : 'AM') : 'AM');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
        // Fix: Explicitly set view based on mode whenever it opens
        setView(mode === 'time' ? 'time' : 'date');

        if(initialDate) {
            const d = new Date(initialDate);
            setCurrentDate(d);
            setSelectedDate(initialDate);
        }
        if(initialTime) {
            let h = parseInt(initialTime.split(':')[0]);
            const m = parseInt(initialTime.split(':')[1]);
            setAmpm(h >= 12 ? 'PM' : 'AM');
            if(h > 12) h -= 12;
            if(h === 0) h = 12;
            setHour(h);
            setMinute(m);
        }
    }
  }, [isOpen, mode, initialDate, initialTime]);

  const handleConfirm = () => {
      // Format Time
      let h = hour;
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      const timeStr = `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      onSelect(selectedDate, timeStr);
      onClose();
  };

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const changeMonth = (delta: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + delta);
      setCurrentDate(newDate);
  };

  const handleDayClick = (day: number) => {
      const newDate = new Date(currentDate);
      newDate.setDate(day);
      const iso = newDate.toISOString().split('T')[0];
      setSelectedDate(iso);
      if (mode === 'both') setView('time');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-sm bg-white dark:bg-dark-surface rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up sm:mb-10 border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {view === 'date' ? 'Select Date' : 'Select Time'}
            </h3>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <X size={20} className="text-gray-600 dark:text-gray-300"/>
            </button>
        </div>

        {/* --- DATE VIEW --- */}
        {view === 'date' && (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-4 px-2">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><ChevronLeft /></button>
                    <span className="font-bold text-lg dark:text-white">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><ChevronRight /></button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-400 uppercase">
                    {['S','M','T','W','T','F','S'].map((d,i) => <div key={i}>{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
                        const isSelected = dStr === selectedDate;
                        return (
                            <button
                                key={day}
                                onClick={() => handleDayClick(day)}
                                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                    isSelected 
                                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg scale-105' 
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* --- TIME VIEW --- */}
        {view === 'time' && (
            <div className="flex flex-col items-center justify-center py-6 animate-fade-in">
                <div className="flex items-center space-x-2 text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    {/* Hour */}
                    <div className="flex flex-col space-y-2">
                        <button onClick={() => setHour(h => h === 12 ? 1 : h + 1)} className="text-gray-300 hover:text-black dark:hover:text-white"><ChevronLeft className="rotate-90 w-6 h-6"/></button>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 w-20 text-center border border-gray-100 dark:border-gray-700">
                            {hour.toString().padStart(2, '0')}
                        </div>
                        <button onClick={() => setHour(h => h === 1 ? 12 : h - 1)} className="text-gray-300 hover:text-black dark:hover:text-white"><ChevronRight className="rotate-90 w-6 h-6"/></button>
                    </div>
                    <span>:</span>
                    {/* Minute */}
                    <div className="flex flex-col space-y-2">
                        <button onClick={() => setMinute(m => m >= 55 ? 0 : m + 5)} className="text-gray-300 hover:text-black dark:hover:text-white"><ChevronLeft className="rotate-90 w-6 h-6"/></button>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 w-20 text-center border border-gray-100 dark:border-gray-700">
                            {minute.toString().padStart(2, '0')}
                        </div>
                        <button onClick={() => setMinute(m => m <= 0 ? 55 : m - 5)} className="text-gray-300 hover:text-black dark:hover:text-white"><ChevronRight className="rotate-90 w-6 h-6"/></button>
                    </div>
                    {/* AM/PM */}
                    <div className="flex flex-col space-y-2 ml-4">
                        <button 
                            onClick={() => setAmpm(p => p === 'AM' ? 'PM' : 'AM')} 
                            className="bg-black dark:bg-white text-white dark:text-black text-sm font-bold px-3 py-4 rounded-xl"
                        >
                            {ampm}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            {mode === 'both' && (
                <div className="flex space-x-2">
                    <button 
                        onClick={() => setView('date')} 
                        className={`p-2 rounded-lg ${view === 'date' ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white' : 'text-gray-400'}`}
                    >
                        <CalIcon size={20} />
                    </button>
                    <button 
                         onClick={() => setView('time')} 
                         className={`p-2 rounded-lg ${view === 'time' ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white' : 'text-gray-400'}`}
                    >
                        <Clock size={20} />
                    </button>
                </div>
            )}
            <div className="flex-1 flex justify-end">
                <button 
                    onClick={handleConfirm}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                    <Check size={18} />
                    <span>Confirm</span>
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default DateTimePicker;
