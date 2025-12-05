

import React from 'react';
import { AppMode, Message, Reminder, ScheduleItem, ChatSession, NotificationItem, UserSettings, HealthStats, WorkoutSession, ExerciseType } from './types';
import ChatPage from './pages/ChatPage';
import RemindersPage from './pages/RemindersPage';
import SchedulePage from './pages/SchedulePage';
import SettingsPage from './pages/SettingsPage';
import HistoryViewPage from './pages/HistoryViewPage';
import NotificationsPage from './pages/NotificationsPage';
import HealthPage from './pages/HealthPage';
import GymPage from './pages/GymPage';
import ScannerPage from './pages/ScannerPage';
import LoginPage from './pages/LoginPage';
import PageTransition from './components/PageTransition';

interface RouterProps {
  mode: AppMode;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  
  // Chat
  messages: Message[];
  onSendMessage: (text: string) => void;
  onImageAnalysis: (base64: string, prompt: string) => Promise<string>;
  sessionTitle: string;
  
  // Data props
  reminders: Reminder[];
  addReminder: (text: string, time: string, date?: string) => void;
  updateReminder: (id: string, text: string, time: string, date?: string) => void;
  toggleReminder: (id: string, completed: boolean) => void;
  deleteReminder: (id: string) => void;

  schedules: ScheduleItem[];
  addSchedule: (title: string, start: string, end: string, date: string) => void;
  updateSchedule: (id: string, title: string, start: string, end: string, date: string) => void;
  deleteSchedule: (id: string) => void;

  notifications: NotificationItem[];
  navigate: (mode: AppMode) => void;

  settings: UserSettings;
  updateSettings: (s: UserSettings) => void;

  // Health Props
  todayStats: HealthStats;
  gymSession: WorkoutSession;
  startGym: () => void;
  stopGym: () => Promise<string | undefined>;
  startExercise: (type: ExerciseType) => void;
  logSet: (weight: number, reps: number) => void;
  endExercise: () => void;

  // Speech Props
  speechTranscript: string;
  isSpeechListening: boolean;
  isDictationMode: boolean;
  toggleDictation: () => void;
}

const Router: React.FC<RouterProps> = (props) => {
  const renderContent = () => {
    switch (props.mode) {
      case AppMode.LOGIN:
        return <LoginPage />;
      
      case AppMode.CHAT:
        return (
          <ChatPage
            messages={props.messages}
            onSendMessage={props.onSendMessage}
            sessionTitle={props.sessionTitle}
            // Pass global speech state
            transcript={props.speechTranscript}
            isListening={props.isSpeechListening}
            isDictationMode={props.isDictationMode}
            toggleDictation={props.toggleDictation}
            navigate={props.navigate}
          />
        );
      
      case AppMode.SCANNER:
        return (
            <ScannerPage 
                onAnalyze={props.onImageAnalysis}
                onClose={() => props.navigate(AppMode.CHAT)}
            />
        );
        
      case AppMode.HISTORY_VIEW:
        return <HistoryViewPage messages={props.messages} sessionTitle={props.sessionTitle} />;
        
      case AppMode.NOTIFICATIONS:
        return <NotificationsPage notifications={props.notifications} />;
        
      case AppMode.REMINDERS:
        return (
          <RemindersPage
            reminders={props.reminders}
            addReminder={props.addReminder}
            updateReminder={props.updateReminder}
            toggleReminder={props.toggleReminder}
            deleteReminder={props.deleteReminder}
          />
        );
        
      case AppMode.SCHEDULE:
        return (
          <SchedulePage
            schedules={props.schedules}
            addSchedule={props.addSchedule}
            updateSchedule={props.updateSchedule}
            deleteSchedule={props.deleteSchedule}
          />
        );
      
      case AppMode.HEALTH:
        return (
            <HealthPage 
                todayStats={props.todayStats}
                gymSession={props.gymSession}
                navigate={props.navigate}
            />
        );

      case AppMode.GYM:
        return (
            <GymPage 
                gymSession={props.gymSession}
                startExercise={props.startExercise}
                logSet={props.logSet}
                endExercise={props.endExercise}
                stopGym={props.stopGym}
            />
        );
        
      case AppMode.SETTINGS:
      case AppMode.SETTINGS_WAKEWORD:
      case AppMode.SETTINGS_CUSTOMIZATION:
      case AppMode.SETTINGS_VOICE:
      case AppMode.SETTINGS_SUBSCRIBE:
      case AppMode.SETTINGS_SECURITY:
      case AppMode.SETTINGS_NOTIFICATIONS_CONFIG:
        return (
          <SettingsPage
            mode={props.mode}
            navigate={props.navigate}
            isDarkMode={props.isDarkMode}
            setIsDarkMode={props.setIsDarkMode}
            settings={props.settings}
            updateSettings={props.updateSettings}
          />
        );
        
      default:
        return <div className="p-10 text-center">Page Not Found</div>;
    }
  };

  return (
    <PageTransition mode={props.mode}>
      {renderContent()}
    </PageTransition>
  );
};

export default Router;
