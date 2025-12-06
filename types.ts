
export enum Sender {
  USER = 'user',
  BOT = 'bot'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  type?: 'text' | 'image' | 'audio' | 'weather' | 'news' | 'stock' | 'research';
  attachment?: string; // base64 for images
  metadata?: any; // Stores the raw weather/news/stock/search object
  groundingMetadata?: any; // Stores sources from research
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  preview: string;
  createdAt: number;
  messages: Message[];
}

export enum AppMode {
  LOGIN = 'LOGIN',
  CHAT = 'CHAT',
  HISTORY_VIEW = 'HISTORY_VIEW',
  REMINDERS = 'REMINDERS',
  SCHEDULE = 'SCHEDULE',
  NOTIFICATIONS = 'NOTIFICATIONS',
  SETTINGS = 'SETTINGS',
  SETTINGS_WAKEWORD = 'SETTINGS_WAKEWORD',
  SETTINGS_CUSTOMIZATION = 'SETTINGS_CUSTOMIZATION',
  SETTINGS_VOICE = 'SETTINGS_VOICE',
  SETTINGS_SUBSCRIBE = 'SETTINGS_SUBSCRIBE',
  SETTINGS_SECURITY = 'SETTINGS_SECURITY',
  SETTINGS_NOTIFICATIONS_CONFIG = 'SETTINGS_NOTIFICATIONS_CONFIG',
  HEALTH = 'HEALTH',
  GYM = 'GYM',
  SCANNER = 'SCANNER'
}

export interface Suggestion {
  id: string;
  text: string;
  prompt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  text: string;
  time: string;
  date?: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: number;
}

export interface ScheduleItem {
  id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  date: string; 
}

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'info' | 'success' | 'warning';
    read: boolean;
}

export type PlanType = 'FREE' | 'PRO' | 'ULTRA';
export type AppFont = 'Inter' | 'Roboto Mono' | 'Merriweather' | 'Quicksand' | 'Orbitron' | 'Normal';

export interface UserSettings {
  userName: string; // The user's display name
  agentName: string; // The bot's name
  wakeword: string;
  voiceId: string;
  nameChangeCount: number;
  plan: PlanType;
  font: AppFont;
  
  // Notification Config
  notificationRingtone?: string;
  notifyReminders?: boolean;
  notifyUpdates?: boolean;
  notifyPromos?: boolean;

  // Permissions (App Level)
  enableMic: boolean;
  enableLocation: boolean;
}

// Complex AI Action Response
export interface AIActionResponse {
    hasAction: boolean;
    actionType?: 'SCHEDULE' | 'REMINDER_BATCH' | 'FETCH_WEATHER' | 'FETCH_NEWS' | 'FETCH_STOCK' | 'FETCH_WEB_SEARCH' | 'NONE';
    missingInfo?: string; 
    data?: any;
    reply?: string; 
}

export type ActionIntent = 
  | { type: 'NONE' }
  | { type: 'ADD_REMINDER'; payload: { text: string; time?: string; date?: string } }
  | { type: 'ADD_SCHEDULE'; payload: { title: string; time?: string } }
  | { type: 'OPEN_APP'; payload: string }
  | { type: 'OPEN_WEBSITE'; payload: string }
  | { type: 'NAVIGATE'; payload: AppMode }
  | { type: 'TOGGLE_SETTING'; payload: { setting: 'wifi' | 'bluetooth' | 'flashlight'; value: boolean } }
  | { type: 'SCREENSHOT' }
  | { type: 'READ_SCREEN' }
  | { type: 'STOP_LISTENING' }
  | { type: 'START_WORKOUT' }
  | { type: 'END_WORKOUT' }
  | { type: 'REPORT_HEALTH' }
  | { type: 'FETCH_WEATHER'; payload: { location: string } }
  | { type: 'FETCH_NEWS'; payload: { query?: string } }
  | { type: 'FETCH_STOCK'; payload: { symbol: string } }
  | { type: 'FETCH_WEB_SEARCH'; payload: { query: string } };

export interface HealthStats {
    steps: number;
    distance: number; // meters
    calories: number;
    goal: number;
}

export type ExerciseType = 'Treadmill' | 'Dumbbells' | 'Pushups' | 'Squats' | 'BenchPress' | 'Yoga' | null;

export interface WorkoutSession {
    isActive: boolean;
    startTime: number | null;
    currentSteps: number;
    currentDistance: number;
    currentCalories: number;
    
    // Gym Specifics
    activeExercise: ExerciseType;
    logs: {
        exercise: string;
        weight?: number;
        reps?: number;
        duration?: number; // seconds
        calories: number;
        timestamp: number;
    }[];
}

// External API Types
export interface WeatherData {
    location: string;
    temp: number;
    condition: string;
    icon: string; // url or code
    humidity: number;
    windSpeed: number;
}

export interface NewsArticle {
    title: string;
    source: string;
    time: string;
    url?: string;
}

export interface StockData {
    symbol: string;
    price: number;
    change: number;
    percentChange: number;
    high: number;
    low: number;
}

export interface SearchResult {
    title: string;
    snippet: string;
    url: string;
    source: string;
}
