
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

// Global declaration for html2canvas
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
  
  // -- Navigation --
  const [historyStack, setHistoryStack] = useState<AppMode[]>([AppMode.CHAT]);
  const currentMode = historyStack[historyStack.length - 1];

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
  
  // Used to debounce commands
  const lastProcessedTranscript = useRef<string>('');
  const processingRef = useRef(false);

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

  // 1. Auto-Start Listening (Wakeword)
  useEffect(() => {
      // Only auto-listen if user is logged in, assistant is closed, and NOT dictating.
      if (user && !isListening && !isAssistantOpen && !isSpeaking && !isDictationMode) {
          const timer = setTimeout(() => {
              try { startListening(true); } catch(e) {}
          }, 200);
          return () => clearTimeout(timer);
      }
  }, [user, isAssistantOpen, isListening, isSpeaking, isDictationMode]); 

  // 2. Main Speech Processor
  useEffect(() => {
    if (!transcript) return;
    
    // If Dictating, do NOT process wakewords or commands.
    // The transcript flows down to ChatPage via props.
    if (isDictationMode) return;

    const lowerTranscript = transcript.toLowerCase().trim();
    if (!lowerTranscript) return;

    const agentTrigger = (settings.agentName || 'crab').toLowerCase();
    const wakewordTrigger = (settings.wakeword || 'hey crab').toLowerCase();
    
    // CASE A: Assistant CLOSED -> Listen for Wakeword
    if (!isAssistantOpen) {
        if (lowerTranscript.includes(agentTrigger) || lowerTranscript.includes(wakewordTrigger)) {
            console.log("Wake word detected");
            setIsAssistantOpen(true);
            // Don't stop listening completely, just reset to allow immediate command
            resetTranscript(); 
            lastProcessedTranscript.current = '';
            
            // Short greeting, then listen for command
            const greeting = "Hi"; 
            speak(greeting, settings.voiceId, () => {
                 resetTranscript();
                 startListening(true);
            });
        }
    } 
    // CASE B: Assistant OPEN -> Conversation Loop
    else {
        if (
            lowerTranscript !== lastProcessedTranscript.current && 
            !isSpeaking && 
            !processingRef.current
        ) {
             // Very short delay for snappy response (500ms)
             const timeoutId = setTimeout(() => {
                 // Check if text stabilized
                 if (transcript.toLowerCase().trim() === lowerTranscript && lowerTranscript.length > 0) {
                     handleAssistantConversation(lowerTranscript);
                 }
             }, 500); 

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
      processingRef.current = true;
      lastProcessedTranscript.current = rawText; 
      
      // Stop listening while thinking to prevent echoes
      stopListening(); 

      // Native Checks
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

      // Speak & Restart Loop Immediately
      speak(reply, settings.voiceId, () => {
          processingRef.current = false;
          resetTranscript();
          startListening(true); // Resume listening
      });
  };

  const executeNativeIntent = async (intent: ActionIntent): Promise<string> => {
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
                executeExternalLaunch(intent.payload); return `Opening ${intent.payload}`;
            case 'OPEN_WEBSITE':
                executeExternalLaunch(intent.payload, true); return `Opening ${intent.payload}`;
            case 'ADD_REMINDER': 
                addReminder(intent.payload.text, intent.payload.time || '09:00', intent.payload.date);
                return `Reminder set.`;
            case 'ADD_SCHEDULE':
                addSchedule(intent.payload.title, '10:00', '11:00', new Date().toISOString().split('T')[0]);
                return `Scheduled.`;
            case 'TOGGLE_SETTING':
                showToast(`${intent.payload.value ? 'On' : 'Off'}: ${intent.payload.setting}`);
                return `Done.`;
            case 'SCREENSHOT':
                 showToast("Screenshot captured"); return "Captured.";
            default: return "Done.";
       }
  };

  const handleVoiceChat = async (text: string): Promise<string> => {
      const userMsg: Message = { id: Date.now().toString(), text, sender: Sender.USER, timestamp: Date.now(), type: 'text' };
      setMessages(prev => [...prev, userMsg]);

      try {
          const actionResponse = await extractActionFromText([...messages, userMsg], text);
          if (actionResponse && actionResponse.hasAction) {
              return await handleComplexAction(actionResponse, [...messages, userMsg]);
          } else {
              const response = await sendMessageToGemini([...messages, userMsg], text);
              setMessages(prev => [...prev, { id: Date.now().toString(), text: response, sender: Sender.BOT, timestamp: Date.now() }]);
              return response;
          }
      } catch (e) {
          return "Connection error.";
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
          setMessages([...history, { id: Date.now().toString(), text: responseText, sender: Sender.BOT, timestamp: Date.now(), type: 'weather', metadata: data }]);
      }
      else if (action.actionType === 'FETCH_NEWS') {
          const articles = await fetchNews(action.data.query);
          responseText = action.reply || `Top headlines.`;
          setMessages([...history, { id: Date.now().toString(), text: responseText, sender: Sender.BOT, timestamp: Date.now(), type: 'news', metadata: articles }]);
      }
      else if (action.actionType === 'FETCH_STOCK') {
          const stock = await fetchStock(action.data.symbol);
          responseText = action.reply || `${stock.symbol} is ${stock.price}.`;
          setMessages([...history, { id: Date.now().toString(), text: responseText, sender: Sender.BOT, timestamp: Date.now(), type: 'stock', metadata: stock }]);
      }
      else if (action.actionType === 'FETCH_WEB_SEARCH') {
          const results = await searchWeb(action.data.query);
          const summary = await sendMessageToGemini(history, `Summarize: ${JSON.stringify(results)}`);
          responseText = summary;
          setMessages([...history, { id: Date.now().toString(), text: summary, sender: Sender.BOT, timestamp: Date.now(), type: 'research', metadata: results }]);
      }
      return responseText;
  };

  // --- Theme ---
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- Text Command Handler ---
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

  // --- Toggle Dictation from ChatPage ---
  const toggleDictation = () => {
      if (isDictationMode) {
          setIsDictationMode(false);
          stopListening();
          resetTranscript();
      } else {
          stopListening(); // Stop Wakeword listener
          setIsDictationMode(true);
          resetTranscript();
          startListening(true); // Start Dictation listener
      }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-dark-bg font-bold">Loading...</div>;
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

            // PASS SPEECH PROPS
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
