
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { HealthStats, WorkoutSession, ExerciseType } from '../types';

const Pedometer = (window as any).Capacitor?.Plugins?.Pedometer;

export const useHealth = () => {
    const { user } = useAuth();
    
    const [todayStats, setTodayStats] = useState<HealthStats>({
        steps: 0, distance: 0, calories: 0, goal: 10000
    });

    const [gymSession, setGymSession] = useState<WorkoutSession>({
        isActive: false, startTime: null, currentSteps: 0, currentDistance: 0, currentCalories: 0, activeExercise: null, logs: []
    });

    const isPedometerActive = useRef(false);
    const motionListener = useRef<any>(null);
    const pendingSaveRef = useRef<boolean>(false);

    const calculateMetrics = (steps: number) => {
        return { distance: Math.round(steps * 0.762), calories: Math.round(steps * 0.04) };
    };

    const getTodayDate = () => new Date().toISOString().split('T')[0];

    // Load Initial Stats
    useEffect(() => {
        if (!user) {
            setTodayStats({ steps: 0, distance: 0, calories: 0, goal: 10000 });
            return;
        }
        
        const loadStats = async () => {
            try {
                const today = getTodayDate();
                // Explicitly select columns to ensure we get 'goal'
                const { data, error } = await supabase
                    .from('health_stats')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('date', today)
                    .maybeSingle();

                if (data) {
                    setTodayStats({ 
                        steps: data.steps, 
                        distance: data.distance, 
                        calories: data.calories, 
                        goal: data.goal || 10000 
                    });
                } else {
                    // Create entry for today if it doesn't exist
                    const { error: insertError } = await supabase.from('health_stats').insert({ 
                        user_id: user.id, 
                        date: today, 
                        steps: 0, 
                        distance: 0, 
                        calories: 0,
                        goal: 10000
                    });
                    if (!insertError) {
                        setTodayStats({ steps: 0, distance: 0, calories: 0, goal: 10000 });
                    }
                }
            } catch (e) {
                console.error("Health Load Error", e);
            }
        };

        loadStats();
        initStepCounter();

        return () => {
            if (motionListener.current) window.removeEventListener('devicemotion', motionListener.current);
        };
    }, [user]);

    const initStepCounter = async () => {
         if (isPedometerActive.current) return;
         
         // 1. Try Capacitor Pedometer (Native)
         if (Pedometer) {
             try {
                 await Pedometer.start();
                 isPedometerActive.current = true;
                 return;
             } catch (e) {}
         }
         
         // 2. Fallback to Web Accelerometer
         startWebPedometer();
    };

    const startWebPedometer = () => {
         let lastX = 0, lastY = 0, lastZ = 0;
         const limit = 4; // Sensitivity threshold
         let lastStepTime = 0;
         
         motionListener.current = (event: DeviceMotionEvent) => {
             if (!event.accelerationIncludingGravity) return;
             const { x, y, z } = event.accelerationIncludingGravity;
             if (!x || !y || !z) return;

             const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);

             if (delta > limit) {
                 const now = Date.now();
                 if (now - lastStepTime > 400) { // Debounce steps
                     handleStep(1);
                     lastStepTime = now;
                 }
             }
             lastX = x; lastY = y; lastZ = z;
         };

         window.addEventListener('devicemotion', motionListener.current);
         isPedometerActive.current = true;
    };

    const requestMotionPermission = async () => {
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceMotionEvent as any).requestPermission();
                if (permissionState === 'granted') {
                    startWebPedometer();
                    return true;
                }
            } catch (e) { return false; }
        }
        return true;
    };

    const handleStep = (count: number) => {
        setTodayStats(prev => {
            const newSteps = prev.steps + count;
            const metrics = calculateMetrics(newSteps);
            pendingSaveRef.current = true; // Mark as needing save
            
            // Check Goal Notification
            if (newSteps === prev.goal) {
                 alert(`🎉 Goal Reached! You hit ${prev.goal} steps.`);
            }
            
            return { ...prev, steps: newSteps, ...metrics };
        });

        // Update active gym session if running
        setGymSession(prev => {
            if (!prev.isActive) return prev;
            if (prev.activeExercise === 'Treadmill' || prev.activeExercise === null) {
                const newSteps = prev.currentSteps + count;
                const metrics = calculateMetrics(newSteps);
                return { 
                    ...prev, 
                    currentSteps: newSteps, 
                    currentDistance: metrics.distance, 
                    currentCalories: prev.currentCalories + (count * 0.04) 
                };
            }
            return prev;
        });
    };

    const updateGoal = async (newGoal: number) => {
        setTodayStats(prev => ({ ...prev, goal: newGoal }));
        if (user) {
            await supabase.from('health_stats')
                .update({ goal: newGoal })
                .eq('user_id', user.id)
                .eq('date', getTodayDate());
        }
    };

    // Auto-Save Interval (Every 10 seconds if changes detected)
    useEffect(() => {
        if (!user) return;
        const saveInterval = setInterval(async () => {
             if (pendingSaveRef.current) {
                 pendingSaveRef.current = false;
                 await supabase.from('health_stats').upsert({
                     user_id: user.id, 
                     date: getTodayDate(), 
                     steps: todayStats.steps, 
                     distance: todayStats.distance, 
                     calories: todayStats.calories,
                     goal: todayStats.goal
                 }, { onConflict: 'user_id, date' });
             }
        }, 10000);
        return () => clearInterval(saveInterval);
    }, [todayStats, user]);

    // Gym Methods
    const startGym = () => setGymSession({ isActive: true, startTime: Date.now(), currentSteps: 0, currentDistance: 0, currentCalories: 0, activeExercise: null, logs: [] });
    const startExercise = (type: ExerciseType) => setGymSession(prev => ({ ...prev, activeExercise: type }));
    const logSet = (weight: number, reps: number) => {
        setGymSession(prev => {
            let cal = 0;
            if (prev.activeExercise === 'Dumbbells' || prev.activeExercise === 'BenchPress') cal = weight * reps * 0.1;
            else cal = reps * 0.4;
            const newLog = { exercise: prev.activeExercise, weight, reps, calories: cal, timestamp: Date.now() };
            return { ...prev, currentCalories: prev.currentCalories + cal, logs: [...prev.logs, newLog] };
        });
    };
    const endExercise = () => setGymSession(prev => ({ ...prev, activeExercise: null }));
    const stopGym = async () => {
        if (!gymSession.isActive || !user) return;
        await supabase.from('workouts').insert({
            user_id: user.id, start_time: gymSession.startTime, end_time: Date.now(), type: 'GYM',
            steps: gymSession.currentSteps, distance: gymSession.currentDistance, calories: gymSession.currentCalories
        });
        const summary = `Workout ended. Steps: ${gymSession.currentSteps}, Cals: ${Math.round(gymSession.currentCalories)}`;
        setGymSession({ isActive: false, startTime: null, currentSteps: 0, currentDistance: 0, currentCalories: 0, activeExercise: null, logs: [] });
        return summary;
    };

    return { todayStats, gymSession, startGym, stopGym, startExercise, logSet, endExercise, requestMotionPermission, updateGoal };
};
