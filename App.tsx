
import React, { useState, useEffect, useRef } from 'react';
import { Menu, ArrowLeft, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import Sidebar from './components/Sidebar';
import AssistantSheet from './components/AssistantSheet';
import ChatOptions from './components/ChatOptions';
import Router from './Router';
import { Message, Sender, AppMode, ChatSession, ActionIntent, AIActionResponse } from './types';
import { sendMessageToGemini, extractActionFromText } from './services/geminiService';
import { processNativeCommands, executeExternalLaunch } from './services/capabilityService';
import { fetchWeather, fetchNews, fetchStock, searchWeb } from './services/externalApiService'; 
import { useAuth } from './contexts/AuthContext';
import { useData } from './hooks/useData';
import { useSpeech } from './hooks/useSpeech'; 
import { useHealth } from './hooks/useHealth';
import { generateChatPDF } from './services/pdfService';
import LoginPage from './pages/LoginPage';

declare global {
    interface Window {
        html2canvas: any;
    }
}

export default function App() {
  const { user, loading } = useAuth();
  
  // -- Local UI State --
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // -- Navigation with Persistence --
  const [historyStack, setHistoryStack] = useState<AppMode[]>(() => {
      try {
          const saved = localStorage.getItem('crab_nav_stack');
          if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
          return [AppMode.CHAT];
      } catch {
          return [AppMode.CHAT];
      }
  });
  
  // FAILSAFE: Ensure we always have a valid mode
  const currentMode = historyStack.length > 0 ? historyStack[historyStack.length - 1] : AppMode.CHAT;

  useEffect(() => {
      localStorage.setItem('crab_nav_stack', JSON.stringify(historyStack));
  }, [historyStack]);

  const navigate = (newMode: AppMode) => {
    if (newMode === currentMode) return;
    setHistoryStack(prev => [...prev, newMode]);
  };

  const goBack = () => {
    if (historyStack.length > 1) {
      setHistoryStack(prev => prev.slice(0, -1));
    }
  };

  // -- Data Hook --
  const { 
      reminders, addReminder, updateReminder, toggleReminder, deleteReminder,
      schedules, addSchedule, updateSchedule, deleteSchedule,
      sessions, saveChatSession, deleteSession,
      dataError,
      settings, updateSettings
  } = useData();

  // -- Global Speech Hook --
  const { 
      isListening, transcript, setTranscript, resetTranscript,
      startListening, stopListening, speak, cancelSpeech, isSpeaking 
  } = useSpeech();
  
  // -- Dictation Mode (Chat Page) --
  const [isDictationMode, setIsDictationMode] = useState(false);

  // -- Health Hook --
  const { todayStats, gymSession, startGym, stopGym, startExercise, logSet, endExercise } = useHealth();

  // -- Active Chat State --
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("New Chat");
  const [messages, setMessages] = useState<Message[]>([]);
  
  const lastProcessedTranscript = useRef<string>('');
  const processingRef = useRef(false);
  const lastAiResponseRef = useRef<string>(''); // Track what AI said to avoid loop

  // -- Toast Logic --
  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Helper: Screen Capture ---
  const captureScreen = async (): Promise<string | null> => {
      try {
          if (!window.html2canvas) return null;
          const canvas = await window.html2canvas(document.getElementById('root'), {
              useCORS: true,
              logging: false,
              scale: 0.8 
          });
          return canvas.toDataURL('image/jpeg', 0.7).split(',')[1]; 
      } catch (e) {
          return null;
      }
  };

  // --- Voice Control Logic ---

  // 1. Auto-Start Listening (Wakeword) & Resume on Visibility
  useEffect(() => {
      // Logic: If user is logged in, we want to be listening for "Hey CRAB"
      if (user && !isListening && !isAssistantOpen && !isSpeaking && !isDictationMode) {
          startListening(true);
      }
      
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
              // FORCE RESTART when app comes to foreground (e.g. back from YouTube)
              console.log("App foregrounded - restarting listener");
              // Slight delay to ensure browser is ready
              setTimeout(() => {
                  startListening(true);
              }, 100);
          }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleVisibilityChange); // Extra redundancy

      return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('focus', handleVisibilityChange);
      };

  }, [user, isAssistantOpen, isListening, isSpeaking, isDictationMode]); 

  // 2. Main Speech Processor
  useEffect(() => {
    if (!transcript || isDictationMode) return;

    const lowerTranscript = transcript.toLowerCase().trim();
    if (!lowerTranscript) return;

    const agentTrigger = (settings.agentName || 'crab').toLowerCase();
    const wakewordTrigger = (settings.wakeword || 'hey crab').toLowerCase();
    
    // CASE A: Assistant CLOSED -> Listen for Wakeword
    if (!isAssistantOpen) {
        if (lowerTranscript.includes(agentTrigger) || lowerTranscript.includes(wakewordTrigger)) {
            setIsAssistantOpen(true);
            resetTranscript(); 
            lastProcessedTranscript.current = '';
            
            const greeting = "Hi, I'm listening."; 
            speak(greeting, settings.voiceId, () => {
                 lastAiResponseRef.current = greeting; // Store greeting
                 resetTranscript();
            });
        }
    } 
    // CASE B: Assistant OPEN -> Conversation Loop
    else {
        // Debounce: Wait for user to pause slightly (600ms)
        if (
            lowerTranscript !== lastProcessedTranscript.current && 
            !isSpeaking && 
            !processingRef.current
        ) {
             const timeoutId = setTimeout(() => {
                 if (transcript.toLowerCase().trim() === lowerTranscript && lowerTranscript.length > 0) {
                     handleAssistantConversation(lowerTranscript);
                 }
             }, 800); // 800ms debounce

             return () => clearTimeout(timeoutId);
        }
    }
  }, [transcript, isAssistantOpen, isSpeaking, settings, isDictationMode]);

  const closeAssistantCleanly = () => {
      setIsAssistantOpen(false);
      cancelSpeech();
      processingRef.current = false;
      resetTranscript();
      lastProcessedTranscript.current = ''; 
  };

  const handleAssistantConversation = async (rawText: string) => {
      if (processingRef.current) return;
      
      // SAFETY CHECK: ECHO CANCELLATION
      // Normalize comparison (remove punctuation, lowercase)
      const normInput = rawText.replace(/[^a-z0-9]/gi, '').toLowerCase();
      const normLast = lastAiResponseRef.current.replace(/[^a-z0-9]/gi, '').toLowerCase();
      
      // 1. Input contains Output (Standard Echo)
      if (normLast.length > 5 && normInput.includes(normLast)) {
          console.log("Ignored Echo (Full match)");
          resetTranscript();
          return;
      }
      
      // 2. Output contains Input (Tail Echo) - ROBUST CHECK
      if (normInput.length > 8 && normLast.includes(normInput)) {
           console.log("Ignored Echo (Tail match)");
           resetTranscript();
           return;
      }
      
      // 3. Exact Duplicate Check (prevents loops)
      if (rawText === lastProcessedTranscript.current) return;

      processingRef.current = true;
      lastProcessedTranscript.current = rawText; 
      
      const intent = processNativeCommands(rawText);
      if (intent.type === 'STOP_LISTENING') {
          closeAssistantCleanly();
          return;
      }

      let reply = "";
      if (intent.type !== 'NONE') {
          reply = await executeNativeIntent(intent);
      } else {
          reply = await handleVoiceChat(rawText);
      }

      // Store response for echo checking next turn
      lastAiResponseRef.current = reply;

      speak(reply, settings.voiceId, () => {
          processingRef.current = false;
          resetTranscript();
      });
  };

  const executeNativeIntent = async (intent: ActionIntent): Promise<string> => {
       const handleLaunch = (callback: () => void) => {
           // We do NOT want to start listening immediately if we are leaving the app
           // The visibility listener will handle restart when we return.
           callback();
       };

       switch (intent.type) {
            case 'READ_SCREEN':
                const base64 = await captureScreen();
                if (base64) return await sendMessageToGemini([...messages], "Describe screen.", base64);
                return "Screen capture failed.";
            case 'START_WORKOUT':
                startGym(); navigate(AppMode.GYM); return "Gym started.";
            case 'END_WORKOUT':
                return (await stopGym()) || "Stopped.";
            case 'REPORT_HEALTH':
                navigate(AppMode.HEALTH); return `${todayStats.steps} steps today.`;
            case 'NAVIGATE': 
                navigate(intent.payload); return `Opening ${intent.payload.toLowerCase()}.`;
            case 'OPEN_APP': 
                handleLaunch(() => executeExternalLaunch(intent.payload));
                return `Opening ${intent.payload}`;
            case 'OPEN_WEBSITE':
                handleLaunch(() => executeExternalLaunch(intent.payload, true));
                return `Opening`;
            case 'ADD_REMINDER': 
                addReminder(intent.payload.text, intent.payload.time || '09:00', intent.payload.date);
                return `Reminder set.`;
            case 'ADD_SCHEDULE':
                addSchedule(intent.payload.title, '10:00', '11:00', new Date().toISOString().split('T')[0]);
                return `Scheduled.`;
            case 'TOGGLE_SETTING':
                showToast(`${intent.payload.value ? 'On' : 'Off'}: ${intent.payload.setting}`);
                // In a real app, we would bridge to native code here.
                return `Toggling ${intent.payload.setting}.`;
            case 'SCREENSHOT':
                 showToast("Screenshot captured"); return "Captured.";
            default: return "Done.";
       }
  };

  const handleVoiceChat = async (text: string): Promise<string> => {
      const userMsg: Message = { id: Date.now().toString(), text, sender: Sender.USER, timestamp: Date.now(), type: 'text' };
      
      try {
          const actionResponse = await extractActionFromText([...messages, userMsg], text);
          if (actionResponse && actionResponse.hasAction) {
              const reply = await handleComplexAction(actionResponse, [...messages, userMsg]);
              setMessages(prev => [...prev, userMsg, { id: Date.now().toString(), text: reply, sender: Sender.BOT, timestamp: Date.now() }]);
              return reply;
          } else {
              const response = await sendMessageToGemini([...messages, userMsg], text);
              setMessages(prev => [...prev, userMsg, { id: Date.now().toString(), text: response, sender: Sender.BOT, timestamp: Date.now() }]);
              return response;
          }
      } catch (e) {
          return "I'm having trouble connecting.";
      }
  };

  const handleComplexAction = async (action: AIActionResponse, history: Message[]): Promise<string> => {
      let responseText = "Done.";
      if (action.actionType === 'SCHEDULE' && action.data) {
          addSchedule(action.data.title, action.data.startTime, action.data.endTime, action.data.date);
          responseText = action.reply || `Scheduled ${action.data.title}.`;
      } 
      else if (action.actionType === 'REMINDER_BATCH' && action.data) {
          if (Array.isArray(action.data.reminders)) action.data.reminders.forEach((r: any) => addReminder(r.text, r.time, r.date));
          responseText = action.reply || `Reminders set.`;
      } 
      else if (action.actionType === 'FETCH_WEATHER') {
          const data = await fetchWeather(action.data.location || 'London');
          responseText = action.reply || `${data.temp}° in ${data.location}.`;
      }
      else if (action.actionType === 'FETCH_NEWS') {
          const articles = await fetchNews(action.data.query);
          responseText = action.reply || `Here are the top headlines.`;
      }
      else if (action.actionType === 'FETCH_STOCK') {
          const stock = await fetchStock(action.data.symbol);
          responseText = action.reply || `${stock.symbol} is ${stock.price}.`;
      }
      else if (action.actionType === 'FETCH_WEB_SEARCH') {
          const results = await searchWeb(action.data.query);
          const summary = await sendMessageToGemini(history, `Summarize this search result in 1 sentence: ${JSON.stringify(results)}`);
          responseText = summary;
      }
      return responseText;
  };

  // --- Theme ---
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- Text Command Handler (Typing) ---
  const handleTextCommand = async (text: string) => {
    if (!text.trim()) return;
    const intent = processNativeCommands(text);
    if (intent.type !== 'NONE' && intent.type !== 'STOP_LISTENING') {
        const reply = await executeNativeIntent(intent);
        setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: Sender.USER, timestamp: Date.now() }, { id: (Date.now()+1).toString(), text: reply, sender: Sender.BOT, timestamp: Date.now() }]);
        return;
    }
    if (currentMode !== AppMode.CHAT) navigate(AppMode.CHAT);
    
    const userMsg: Message = { id: Date.now().toString(), text, sender: Sender.USER, timestamp: Date.now(), type: 'text' };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    try {
        const actionResponse = await extractActionFromText(updatedHistory, text);
        let responseText = "";
        if (actionResponse && actionResponse.hasAction) responseText = await handleComplexAction(actionResponse, updatedHistory);
        else {
            responseText = await sendMessageToGemini(messages, text);
            setMessages([...updatedHistory, { id: (Date.now()+1).toString(), text: responseText, sender: Sender.BOT, timestamp: Date.now() }]);
        }
        
        let title = sessionTitle;
        if (updatedHistory.length === 1) {
            title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
            setSessionTitle(title);
        }
        saveChatSession(title, [...updatedHistory, { id: Date.now().toString(), text: responseText, sender: Sender.BOT, timestamp: Date.now() }], currentSessionId || undefined)
            .then(savedId => { if (savedId && !savedId.startsWith('local')) setCurrentSessionId(savedId); });
    } catch (e) {
        setMessages([...updatedHistory, { id: Date.now().toString(), text: "Network Error", sender: Sender.BOT, timestamp: Date.now() }]);
    }
  };

  const handleNewChat = () => {
      setCurrentSessionId(null);
      setSessionTitle("New Chat");
      setMessages([]);
      navigate(AppMode.CHAT);
  };

  const handleLoadSession = (session: ChatSession) => {
      setMessages(session.messages);
      setSessionTitle(session.title);
      setCurrentSessionId(session.id);
      navigate(AppMode.CHAT); 
  };

  const toggleDictation = () => {
      if (isDictationMode) {
          setIsDictationMode(false);
          resetTranscript();
      } else {
          setIsDictationMode(true);
          resetTranscript();
          startListening(true); 
      }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-dark-bg font-bold text-gray-800 dark:text-white">Loading CRAB...</div>;
  if (!user) return <LoginPage />;

  let headerTitle = settings.agentName;
  if (currentMode === AppMode.CHAT) headerTitle = sessionTitle;
  else if (currentMode === AppMode.GYM) headerTitle = "Gym Mode";
  else if (currentMode !== AppMode.HISTORY_VIEW) headerTitle = currentMode.replace('SETTINGS_', '').replace('_', ' ');

  return (
    <div className="flex flex-col h-full relative bg-white dark:bg-dark-bg transition-colors duration-300">
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 px-6 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        {historyStack.length === 1 ? (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-700 dark:text-gray-200">
                <Menu className="w-6 h-6" />
            </button>
        ) : (
            <button onClick={goBack} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-700 dark:text-gray-200">
                <ArrowLeft className="w-6 h-6" />
            </button>
        )}
        <h1 className="font-bold text-sm tracking-widest text-gray-900 dark:text-white uppercase absolute left-1/2 transform -translate-x-1/2 w-48 text-center truncate">
            {headerTitle}
        </h1>
        <div className="flex items-center">
             {gymSession.isActive && currentMode !== AppMode.GYM && <div className="mr-3 animate-pulse text-red-500"><Activity size={20} /></div>}
             {currentMode === AppMode.CHAT && (
                 <ChatOptions 
                    onEdit={() => {}}
                    onDelete={() => { setMessages([]); setCurrentSessionId(null); setSessionTitle("New Chat"); }}
                    onExport={() => generateChatPDF(sessionTitle, messages)}
                 />
             )}
             {currentMode !== AppMode.CHAT && <div className="w-8"></div>}
        </div>
      </header>
      
      {dataError && (
          <div className="bg-orange-500 text-white text-[10px] p-2 text-center font-medium flex items-center justify-center space-x-2 animate-fade-in">
              <AlertTriangle size={12} /><span>{dataError}</span>
          </div>
      )}
      
      {toastMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/80 dark:bg-white/90 text-white dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-lg z-50 flex items-center space-x-2 animate-slide-up">
              <CheckCircle size={16} className="text-green-400 dark:text-green-600" /><span>{toastMessage}</span>
          </div>
      )}

      <main className="flex-1 overflow-hidden relative">
        <Router 
            mode={currentMode}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            messages={messages}
            onSendMessage={handleTextCommand}
            sessionTitle={sessionTitle}
            
            reminders={reminders}
            addReminder={addReminder}
            updateReminder={updateReminder}
            toggleReminder={toggleReminder}
            deleteReminder={deleteReminder}
            
            schedules={schedules}
            addSchedule={addSchedule}
            updateSchedule={updateSchedule}
            deleteSchedule={deleteSchedule}
            
            notifications={[]}
            navigate={navigate}
            
            settings={settings}
            updateSettings={updateSettings}

            todayStats={todayStats}
            gymSession={gymSession}
            startGym={startGym}
            stopGym={stopGym}
            startExercise={startExercise}
            logSet={logSet}
            endExercise={endExercise}

            speechTranscript={transcript}
            isSpeechListening={isListening}
            isDictationMode={isDictationMode}
            toggleDictation={toggleDictation}
        />
      </main>

      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        navigate={navigate}
        onNewChat={handleNewChat}
        onLoadSession={handleLoadSession}
        chatSessions={sessions}
        onDeleteSession={deleteSession}
      />

      <AssistantSheet 
        isOpen={isAssistantOpen}
        isProcessing={isSpeaking || processingRef.current}
        transcript={transcript}
        onClose={closeAssistantCleanly}
        wakeword={settings.wakeword}
      />
    </div>
  );
}
