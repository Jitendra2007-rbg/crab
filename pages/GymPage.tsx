
import React, { useState, useEffect } from 'react';
import { Play, Square, ChevronLeft, Timer, Dumbbell, Activity, Check, Circle, Flame, Footprints } from 'lucide-react';
import { WorkoutSession, ExerciseType } from '../types';

interface GymPageProps {
  gymSession: WorkoutSession;
  startExercise: (type: ExerciseType) => void;
  logSet: (weight: number, reps: number) => void;
  endExercise: () => void;
  stopGym: () => Promise<string | undefined>;
}

const EXERCISES = [
    { id: 'Treadmill', label: 'Treadmill', icon: <Footprints size={24}/>, type: 'cardio' },
    { id: 'Dumbbells', label: 'Dumbbells', icon: <Dumbbell size={24}/>, type: 'strength' },
    { id: 'BenchPress', label: 'Bench Press', icon: <Dumbbell size={24} className="rotate-90"/>, type: 'strength' },
    { id: 'Squats', label: 'Squats', icon: <Activity size={24} />, type: 'bodyweight' },
    { id: 'Pushups', label: 'Pushups', icon: <Activity size={24} className="rotate-180"/>, type: 'bodyweight' },
    { id: 'Yoga', label: 'Yoga', icon: <div className="font-bold text-xl">Y</div>, type: 'cardio' },
];

const GymPage: React.FC<GymPageProps> = ({ gymSession, startExercise, logSet, endExercise, stopGym }) => {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
      let interval: any;
      if (gymSession.activeExercise === 'Treadmill' || gymSession.activeExercise === 'Yoga') {
          interval = setInterval(() => {
              setElapsed(prev => prev + 1);
          }, 1000);
      } else {
          setElapsed(0);
      }
      return () => clearInterval(interval);
  }, [gymSession.activeExercise]);

  const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleLogSet = () => {
      if (!reps) return;
      const w = parseFloat(weight) || 0;
      const r = parseInt(reps);
      logSet(w, r);
      setReps(''); 
  };

  if (!gymSession.activeExercise) {
      return (
          <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg animate-fade-in pb-32">
              <div className="mb-8 flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Workout</h2>
                    <p className="text-gray-500 mt-1">Select an activity to start</p>
                  </div>
                  {gymSession.isActive && (
                      <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-green-500 uppercase tracking-wider animate-pulse">Session Active</span>
                          <span className="text-xl font-bold dark:text-white">{formatTime(Math.floor((Date.now() - (gymSession.startTime || 0)) / 1000))}</span>
                      </div>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  {EXERCISES.map(ex => (
                      <button 
                        key={ex.id}
                        onClick={() => startExercise(ex.id as ExerciseType)}
                        className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all flex flex-col items-center justify-center space-y-4 aspect-square group"
                      >
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-black dark:text-white transition-transform group-hover:scale-110">
                              {ex.icon}
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">{ex.label}</span>
                      </button>
                  ))}
              </div>

              {gymSession.isActive && (
                 <div className="mt-8 bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800">
                     <div className="flex justify-between items-center mb-6">
                         <div className="text-center flex-1 border-r border-gray-100 dark:border-gray-800">
                             <p className="text-xs uppercase text-gray-400 font-bold mb-1">Calories</p>
                             <div className="flex items-center justify-center space-x-1">
                                 <Flame size={16} className="text-black dark:text-white" />
                                 <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(gymSession.currentCalories)}</p>
                             </div>
                         </div>
                         <div className="text-center flex-1">
                             <p className="text-xs uppercase text-gray-400 font-bold mb-1">Exercises</p>
                             <p className="text-2xl font-bold text-gray-900 dark:text-white">{gymSession.logs.length}</p>
                         </div>
                     </div>
                     <button 
                        onClick={() => stopGym()}
                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-transform"
                     >
                         <Square size={16} fill="currentColor" />
                         <span>Complete Workout</span>
                     </button>
                 </div>
              )}
          </div>
      );
  }

  // --- View 2: Cardio ---
  if (gymSession.activeExercise === 'Treadmill' || gymSession.activeExercise === 'Yoga') {
      return (
          <div className="h-full flex flex-col bg-white dark:bg-dark-bg animate-slide-up transition-colors">
               <div className="p-6 flex items-center justify-between">
                   <button onClick={endExercise} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-900 dark:text-white"><ChevronLeft /></button>
                   <span className="font-bold text-gray-900 dark:text-white tracking-widest uppercase text-sm">{gymSession.activeExercise}</span>
                   <div className="w-10"></div>
               </div>

               <div className="flex-1 flex flex-col items-center justify-center relative">
                   <div className="relative w-72 h-72 flex items-center justify-center">
                       <div className="absolute inset-0 rounded-full border-[6px] border-gray-100 dark:border-gray-800"></div>
                       <div className="absolute inset-0 rounded-full border-[6px] border-t-black dark:border-t-white border-r-black dark:border-r-white border-b-transparent border-l-transparent animate-spin duration-[3s]"></div>
                       
                       <div className="text-center z-10 flex flex-col items-center">
                           <span className="text-7xl font-mono font-bold text-gray-900 dark:text-white tracking-tighter tabular-nums">
                               {formatTime(elapsed)}
                           </span>
                           <div className="flex items-center space-x-2 mt-4 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                               <Timer size={14} className="text-black dark:text-white" />
                               <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Elapsed</span>
                           </div>
                       </div>
                   </div>
                   
                   {gymSession.activeExercise === 'Treadmill' && (
                       <div className="mt-12 flex items-center space-x-8">
                           <div className="text-center">
                               <p className="text-3xl font-bold text-gray-900 dark:text-white">{gymSession.currentSteps}</p>
                               <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold mt-1">Steps</p>
                           </div>
                           <div className="w-px h-10 bg-gray-200 dark:bg-gray-800"></div>
                           <div className="text-center">
                               <p className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(gymSession.currentCalories)}</p>
                               <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold mt-1">Calories</p>
                           </div>
                       </div>
                   )}
               </div>

               <div className="p-8">
                    <button 
                        onClick={endExercise}
                        className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-3xl font-bold shadow-xl active:scale-95 transition-transform"
                    >
                        Pause / Finish
                    </button>
               </div>
          </div>
      );
  }

  // --- View 3: Strength ---
  return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-dark-bg animate-slide-up overflow-y-auto">
          <div className="p-6 pb-2">
            <div className="flex items-center space-x-4 mb-6">
                <button onClick={endExercise} className="p-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-full text-gray-900 dark:text-white"><ChevronLeft /></button>
                <div>
                    <h2 className="font-bold text-2xl text-gray-900 dark:text-white">{gymSession.activeExercise}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <p className="text-gray-500 text-sm">Logging Active</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="px-6">
            <div className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
                <div className="flex space-x-4 mb-6">
                    {(gymSession.activeExercise === 'Dumbbells' || gymSession.activeExercise === 'BenchPress') && (
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Weight (kg)</label>
                            <div className="relative">
                                <input 
                                        type="number" 
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl text-3xl font-bold text-center outline-none focus:ring-2 ring-black dark:ring-white dark:text-white transition-all"
                                        placeholder="0"
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Reps</label>
                        <input 
                                type="number" 
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl text-3xl font-bold text-center outline-none focus:ring-2 ring-black dark:ring-white dark:text-white transition-all"
                                placeholder="0"
                        />
                    </div>
                </div>
                
                <button 
                    onClick={handleLogSet}
                    disabled={!reps}
                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-2"
                >
                    <Check size={20} />
                    <span>Log Set</span>
                </button>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Session History</h3>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(gymSession.currentCalories)} kcal total</span>
            </div>
          </div>

          <div className="flex-1 px-6 pb-24 overflow-y-auto">
              <div className="space-y-3">
                  {gymSession.logs.filter(l => l.exercise === gymSession.activeExercise).length === 0 && (
                      <div className="text-center py-10 opacity-50 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                          <Dumbbell className="mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-400 italic">No sets logged yet.</p>
                      </div>
                  )}
                  {[...gymSession.logs].reverse().filter(l => l.exercise === gymSession.activeExercise).map((log, i) => (
                      <div key={i} className="flex justify-between items-center bg-white dark:bg-dark-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 animate-slide-in shadow-sm">
                          <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center font-bold text-gray-500 text-sm">
                                  #{gymSession.logs.filter(l => l.exercise === gymSession.activeExercise).length - i}
                              </div>
                              <div>
                                <span className="font-bold text-xl text-gray-900 dark:text-white block">
                                    {log.reps} <span className="text-sm text-gray-500 font-normal">reps</span>
                                </span>
                                {log.weight ? <span className="text-sm text-gray-500">{log.weight} kg</span> : null}
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="text-sm font-bold text-black dark:text-white">+{Math.round(log.calories)}</span>
                              <p className="text-[10px] text-gray-400 uppercase">kcal</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );
};

export default GymPage;
