
import React, { useState } from 'react';
import { Activity, Flame, Footprints, Play, Square, Trophy, ChevronRight, Smartphone } from 'lucide-react';
import { HealthStats, WorkoutSession, AppMode } from '../types';
import { useHealth } from '../hooks/useHealth'; 

interface HealthPageProps {
  todayStats: HealthStats;
  gymSession: WorkoutSession;
  navigate: (mode: AppMode) => void;
}

const HealthPage: React.FC<HealthPageProps> = ({ todayStats, gymSession, navigate }) => {
  const { requestMotionPermission } = useHealth();
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Calculate Ring Progress
  const progress = Math.min((todayStats.steps / todayStats.goal) * 100, 100);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const handleEnableSensors = async () => {
      const granted = await requestMotionPermission();
      if (granted) setPermissionGranted(true);
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
                    className="text-black dark:text-white transition-all duration-1000 ease-out"
                 />
             </svg>
             <div className="absolute flex flex-col items-center">
                 <Footprints size={24} className="text-gray-400 mb-1" />
                 <span className="text-4xl font-bold text-gray-900 dark:text-white">{todayStats.steps.toLocaleString()}</span>
                 <span className="text-xs text-gray-500 uppercase tracking-wider">Steps Today</span>
             </div>
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
                     <Trophy size={14} />
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

      {/* Recent History Stub */}
      <div className="mt-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h3>
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between opacity-60">
               <div className="flex items-center space-x-3">
                   <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-black dark:text-white">
                       <Footprints size={18} />
                   </div>
                   <div>
                       <p className="font-bold text-sm text-gray-900 dark:text-white">Morning Walk</p>
                       <p className="text-xs text-gray-500">Yesterday</p>
                   </div>
               </div>
               <span className="font-mono font-medium text-sm text-gray-900 dark:text-white">2.4 km</span>
          </div>
      </div>

    </div>
  );
};

export default HealthPage;
