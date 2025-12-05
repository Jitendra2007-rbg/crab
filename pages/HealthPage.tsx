
import React, { useState } from 'react';
import { Activity, Flame, Footprints, Play, Smartphone, Edit2, Check } from 'lucide-react';
import { HealthStats, WorkoutSession, AppMode } from '../types';
import { useHealth } from '../hooks/useHealth'; 

interface HealthPageProps {
  todayStats: HealthStats;
  gymSession: WorkoutSession;
  navigate: (mode: AppMode) => void;
}

const HealthPage: React.FC<HealthPageProps> = ({ todayStats, gymSession, navigate }) => {
  const { requestMotionPermission, updateGoal } = useHealth();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(todayStats.goal.toString());

  // Calculate Ring Progress
  const progress = Math.min((todayStats.steps / todayStats.goal) * 100, 100);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const handleEnableSensors = async () => {
      const granted = await requestMotionPermission();
      if (granted) setPermissionGranted(true);
  };

  const saveGoal = () => {
      const g = parseInt(tempGoal);
      if (g > 0) updateGoal(g);
      setIsEditingGoal(false);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Fitness</h2>
            <p className="text-sm text-gray-500 mt-1">Daily Activity & Gym</p>
        </div>
        <div className="w-10 h-10 bg-white dark:bg-dark-surface rounded-full flex items-center justify-center shadow-sm">
            <Activity className="text-black dark:text-white" size={20} />
        </div>
      </div>

      {/* Progress Ring Card */}
      <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6 flex flex-col items-center justify-center relative overflow-hidden">
         <div className="relative w-48 h-48 flex items-center justify-center">
             {/* Background Circle */}
             <svg className="w-full h-full transform -rotate-90">
                 <circle
                    cx="50%" cy="50%" r={radius}
                    stroke="currentColor" strokeWidth="12"
                    fill="transparent"
                    className="text-gray-100 dark:text-gray-800"
                 />
                 {/* Progress Circle */}
                 <circle
                    cx="50%" cy="50%" r={radius}
                    stroke="currentColor" strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="text-blue-500 dark:text-blue-400 transition-all duration-1000 ease-out"
                 />
             </svg>
             <div className="absolute flex flex-col items-center">
                 <Footprints size={24} className="text-gray-400 mb-1" />
                 <span className="text-4xl font-bold text-gray-900 dark:text-white">{todayStats.steps.toLocaleString()}</span>
                 <span className="text-xs text-gray-500 uppercase tracking-wider">Steps Today</span>
             </div>
         </div>

         {/* Goal Editor */}
         <div className="mt-2 flex items-center space-x-2">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Goal:</span>
             {isEditingGoal ? (
                 <div className="flex items-center space-x-1">
                     <input 
                        type="number" 
                        value={tempGoal} 
                        onChange={(e) => setTempGoal(e.target.value)}
                        className="w-16 bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm font-bold outline-none"
                     />
                     <button onClick={saveGoal} className="text-green-500"><Check size={16}/></button>
                 </div>
             ) : (
                 <div className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors" onClick={() => setIsEditingGoal(true)}>
                     <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{todayStats.goal.toLocaleString()}</span>
                     <Edit2 size={12} className="text-gray-400" />
                 </div>
             )}
         </div>

         <div className="grid grid-cols-2 gap-8 mt-6 w-full">
             <div className="text-center">
                 <div className="flex items-center justify-center space-x-1 text-gray-500 dark:text-gray-400 mb-1">
                     <Flame size={14} />
                     <span className="text-xs font-bold uppercase">Calories</span>
                 </div>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(todayStats.calories)} <span className="text-xs font-normal text-gray-400">kcal</span></p>
             </div>
             <div className="text-center">
                 <div className="flex items-center justify-center space-x-1 text-gray-500 dark:text-gray-400 mb-1">
                     <Activity size={14} />
                     <span className="text-xs font-bold uppercase">Distance</span>
                 </div>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">{(todayStats.distance / 1000).toFixed(2)} <span className="text-xs font-normal text-gray-400">km</span></p>
             </div>
         </div>
      </div>

      {isIOS && !permissionGranted && (
          <button 
            onClick={handleEnableSensors}
            className="w-full py-3 mb-6 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-xl font-bold flex items-center justify-center space-x-2"
          >
              <Smartphone size={18} />
              <span>Enable iPhone Motion Sensors</span>
          </button>
      )}

      {/* Gym Mode Entry Card */}
      <button 
        onClick={() => navigate(AppMode.GYM)}
        className={`w-full text-left rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group ${
            gymSession.isActive 
            ? 'bg-black dark:bg-white text-white dark:text-black shadow-xl' 
            : 'bg-white dark:bg-dark-surface border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
          <div className="relative z-10 flex justify-between items-center">
              <div>
                  <h3 className="font-bold text-lg flex items-center space-x-2">
                      <span>Gym Mode</span>
                      {gymSession.isActive && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                  </h3>
                  <p className={`text-sm mt-1 ${gymSession.isActive ? 'opacity-80' : 'text-gray-500'}`}>
                      {gymSession.isActive 
                        ? `Active: ${Math.round(gymSession.currentCalories)} cal burned` 
                        : 'Exercises, Timer & Log'
                      }
                  </p>
              </div>
              <div className={`p-3 rounded-full ${gymSession.isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'} transition-transform group-hover:scale-110`}>
                  {gymSession.isActive ? <Activity size={24} /> : <Play size={24} fill="currentColor" />}
              </div>
          </div>
      </button>

    </div>
  );
};

export default HealthPage;
