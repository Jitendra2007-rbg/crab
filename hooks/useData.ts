
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Reminder, ScheduleItem, ChatSession, Message, UserSettings, PlanType } from '../types';

export const useData = () => {
  const { user } = useAuth();
  
  // Data State
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
      userName: 'User',
      agentName: 'CRAB',
      wakeword: 'Hey CRAB',
      voiceId: 'Cosmic',
      nameChangeCount: 0,
      plan: 'FREE',
      notificationRingtone: 'Default',
      notifyReminders: true,
      notifyUpdates: true,
      notifyPromos: false
  });
  
  // Status State
  const [dataError, setDataError] = useState<string | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // --- Local Storage Helpers ---
  const loadLocal = (key: string) => {
      try {
          const item = localStorage.getItem(`crab_${key}_${user?.id}`);
          return item ? JSON.parse(item) : undefined;
      } catch (e) { return undefined; }
  };

  const saveLocal = (key: string, data: any) => {
      if (!user) return;
      localStorage.setItem(`crab_${key}_${user.id}`, JSON.stringify(data));
  };

  // --- Fetch & Realtime Effect ---
  useEffect(() => {
    if (!user) {
        setReminders([]);
        setSchedules([]);
        setSessions([]);
        return;
    }

    // 1. Initial Load from Local Storage (Instant UI)
    setReminders(loadLocal('reminders') || []);
    setSchedules(loadLocal('schedules') || []);
    setSessions(loadLocal('sessions') || []);
    const localSettings = loadLocal('settings');
    if (localSettings) setSettings(localSettings);

    const fetchData = async () => {
        try {
            // Fetch Settings
            const { data: setData, error: setError } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (setData) {
                const newSettings: UserSettings = {
                    userName: setData.user_name || 'User',
                    agentName: setData.agent_name || 'CRAB',
                    wakeword: setData.wakeword || 'Hey CRAB',
                    voiceId: setData.voice_id || 'Cosmic',
                    nameChangeCount: setData.name_change_count || 0,
                    plan: (setData.plan as PlanType) || 'FREE',
                    notificationRingtone: setData.notification_ringtone || 'Default',
                    notifyReminders: setData.notify_reminders !== false,
                    notifyUpdates: setData.notify_updates !== false,
                    notifyPromos: setData.notify_promos === true,
                };
                setSettings(newSettings);
                saveLocal('settings', newSettings);
            }

            // Fetch Reminders
            const { data: remData, error: remError } = await supabase
                .from('reminders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (remError) throw remError;
            if (remData) {
                const mappedReminders = remData.map((r: any) => ({
                    id: r.id,
                    userId: r.user_id,
                    text: r.text,
                    time: r.time,
                    date: r.date,
                    completed: r.completed,
                    createdAt: r.created_at
                }));
                setReminders(mappedReminders);
                saveLocal('reminders', mappedReminders);
            }

            // Fetch Schedules
            const { data: schData, error: schError } = await supabase
                .from('schedules')
                .select('*')
                .eq('user_id', user.id);

            if (schError) throw schError;
            if (schData) {
                const mappedSchedules = schData.map((s: any) => ({
                    id: s.id,
                    userId: s.user_id,
                    title: s.title,
                    startTime: s.start_time,
                    endTime: s.end_time,
                    description: s.description,
                    date: s.date
                }));
                setSchedules(mappedSchedules);
                saveLocal('schedules', mappedSchedules);
            }

             // Fetch Sessions
             const { data: sessData, error: sessError } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (sessError) throw sessError;
            if (sessData) {
                const mappedSessions = sessData.map((s: any) => ({
                    id: s.id,
                    userId: s.user_id,
                    title: s.title,
                    preview: s.preview,
                    messages: s.messages, // JSONB stored as array
                    createdAt: s.created_at
                }));
                setSessions(mappedSessions);
                saveLocal('sessions', mappedSessions);
            }

            // If we succeed, clear errors
            setIsLocalMode(false);
            setDataError(null);

        } catch (e: any) {
            console.error("Supabase Load Error:", e);
            // Only switch to local mode on serious errors, not just 'not found'
            if (e.code !== 'PGRST116') {
                setDataError("Sync Issue: " + e.message);
                setIsLocalMode(true);
            }
        }
    };

    fetchData();

    // 2. Setup Realtime Subscriptions
    const channel = supabase.channel('user_data_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user.id}` }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules', filter: `user_id=eq.${user.id}` }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `user_id=eq.${user.id}` }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${user.id}` }, () => fetchData())
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };

  }, [user]);

  const handleError = (err: any) => {
      console.error("Data Operation Error:", err);
      setDataError("Save failed: " + (err.message || "Unknown error"));
  };

  // --- Actions ---

  const updateSettings = async (newSettings: UserSettings) => {
      if (!user) return;
      
      let currentCount = settings.nameChangeCount;
      if (newSettings.agentName !== settings.agentName) {
          currentCount += 1;
      }

      const settingsToSave = {
          ...newSettings,
          nameChangeCount: currentCount
      };

      setSettings(settingsToSave);
      saveLocal('settings', settingsToSave);
      
      if (!isLocalMode) {
          const { error } = await supabase.from('user_settings').upsert({
              user_id: user.id,
              user_name: settingsToSave.userName,
              agent_name: settingsToSave.agentName,
              wakeword: settingsToSave.wakeword,
              voice_id: settingsToSave.voiceId,
              name_change_count: settingsToSave.nameChangeCount,
              plan: settingsToSave.plan,
              notification_ringtone: settingsToSave.notificationRingtone,
              notify_reminders: settingsToSave.notifyReminders,
              notify_updates: settingsToSave.notifyUpdates,
              notify_promos: settingsToSave.notifyPromos,
              updated_at: Date.now()
          });
          if (error) handleError(error);
      }
  };

  const addReminder = async (text: string, time: string, date?: string) => {
    if (!user) return;
    const tempId = `local_${Date.now()}`;
    const newReminder: Reminder = {
        id: tempId,
        userId: user.id,
        text,
        time,
        date: date || new Date().toISOString().split('T')[0],
        completed: false,
        createdAt: Date.now()
    };
    const updated = [newReminder, ...reminders];
    setReminders(updated);
    saveLocal('reminders', updated);

    if (!isLocalMode) {
        const { error } = await supabase.from('reminders').insert({
            user_id: user.id,
            text,
            time,
            date: date || new Date().toISOString().split('T')[0],
            completed: false,
            created_at: Date.now()
        });
        if (error) handleError(error);
    }
  };

  const updateReminder = async (id: string, text: string, time: string, date?: string) => {
      const updated = reminders.map(r => r.id === id ? { ...r, text, time, date: date || r.date } : r);
      setReminders(updated);
      saveLocal('reminders', updated);

      if (!isLocalMode && !id.startsWith('local_')) {
          const { error } = await supabase.from('reminders').update({ text, time, date: date }).eq('id', id);
          if (error) handleError(error);
      }
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    const updated = reminders.map(r => r.id === id ? { ...r, completed } : r);
    setReminders(updated);
    saveLocal('reminders', updated);

    if (!isLocalMode && !id.startsWith('local_')) {
        const { error } = await supabase.from('reminders').update({ completed }).eq('id', id);
        if (error) handleError(error);
    }
  };

  const deleteReminder = async (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    saveLocal('reminders', updated);

    if (!isLocalMode && !id.startsWith('local_')) {
        const { error } = await supabase.from('reminders').delete().eq('id', id);
        if (error) handleError(error);
    }
  };

  const addSchedule = async (title: string, startTime: string, endTime: string, date: string) => {
    if (!user) return;
    const tempId = `local_${Date.now()}`;
    const newItem: ScheduleItem = {
        id: tempId,
        userId: user.id,
        title,
        startTime,
        endTime,
        description: '',
        date
    };
    const updated = [...schedules, newItem];
    setSchedules(updated);
    saveLocal('schedules', updated);

    if (!isLocalMode) {
        const { error } = await supabase.from('schedules').insert({
            user_id: user.id,
            title,
            start_time: startTime,
            end_time: endTime,
            date,
            created_at: Date.now()
        });
        if (error) handleError(error);
    }
  };

  const updateSchedule = async (id: string, title: string, startTime: string, endTime: string, date: string) => {
      const updated = schedules.map(s => s.id === id ? { ...s, title, startTime, endTime, date } : s);
      setSchedules(updated);
      saveLocal('schedules', updated);

      if (!isLocalMode && !id.startsWith('local_')) {
          const { error } = await supabase.from('schedules').update({
              title,
              start_time: startTime,
              end_time: endTime,
              date
          }).eq('id', id);
          if (error) handleError(error);
      }
  };

  const deleteSchedule = async (id: string) => {
      const updated = schedules.filter(s => s.id !== id);
      setSchedules(updated);
      saveLocal('schedules', updated);

      if (!isLocalMode && !id.startsWith('local_')) {
          const { error } = await supabase.from('schedules').delete().eq('id', id);
          if (error) handleError(error);
      }
  };

  const saveChatSession = async (title: string, messages: Message[], id?: string): Promise<string> => {
      if (!user) return 'local-only';
      
      const preview = messages.length > 0 ? messages[messages.length-1].text.substring(0, 50) : "Empty chat";
      const createdAt = Date.now();
      const localId = id || `local_${Date.now()}`;
      
      let updatedSessions = [...sessions];
      const existingIndex = updatedSessions.findIndex(s => s.id === localId || s.id === id);
      
      if (existingIndex >= 0) {
          updatedSessions[existingIndex] = { ...updatedSessions[existingIndex], title, messages, preview };
      } else {
          updatedSessions = [{ id: localId, userId: user.id, title, preview, messages, createdAt }, ...updatedSessions];
      }
      setSessions(updatedSessions);
      saveLocal('sessions', updatedSessions);

      if (isLocalMode) return localId;

      try {
        if (id && !id.startsWith('local_')) {
            const { error } = await supabase.from('sessions').update({ title, messages, preview }).eq('id', id);
            if (error) throw error;
            return id;
        } else {
            const { data, error } = await supabase.from('sessions').insert({
                user_id: user.id,
                title,
                preview,
                messages,
                created_at: createdAt
            }).select().single();
            
            if (error) throw error;
            return data.id;
        }
      } catch (e) {
          handleError(e);
          return localId;
      }
  };

  const deleteSession = async (id: string) => {
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      saveLocal('sessions', updated);

      if(!isLocalMode && !id.startsWith('local_')) {
          const { error } = await supabase.from('sessions').delete().eq('id', id);
          if (error) handleError(error);
      }
  };

  return {
    reminders,
    addReminder,
    updateReminder,
    toggleReminder,
    deleteReminder,
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    sessions,
    saveChatSession,
    deleteSession,
    dataError,
    settings,
    updateSettings
  };
};
