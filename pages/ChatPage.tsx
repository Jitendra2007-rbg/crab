
import React, { useRef, useEffect, useState } from 'react';
import { Send, Sparkles, Paperclip, Mic, StopCircle, ArrowUpRight, TrendingUp, TrendingDown, Newspaper, ExternalLink, Sun, Wind, Droplets, Globe } from 'lucide-react';
import { Message, Sender, Suggestion } from '../types';

interface ChatPageProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  sessionTitle: string;
  // Speech Props
  transcript: string;
  isListening: boolean;
  isDictationMode: boolean;
  toggleDictation: () => void;
}

const SUGGESTIONS: Suggestion[] = [
    { id: '1', text: "Research Products", prompt: "Research the best gaming laptops 2024" },
    { id: '2', text: "Tech News", prompt: "Latest news about AI" },
    { id: '3', text: "Stock Price", prompt: "Stock price of Tesla" },
    { id: '4', text: "Plan a trip", prompt: "Create a 3-day itinerary for Tokyo" },
];

const Typewriter = ({ text }: { text: string }) => {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplay('');
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplay(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 10);
    return () => clearInterval(interval);
  }, [text]);
  return <p className="whitespace-pre-wrap leading-relaxed">{display}</p>;
};

// --- Custom Cards ---
const WeatherCard = ({ data }: { data: any }) => (
    <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-800 rounded-xl p-4 w-full max-w-sm my-2">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{data.location}</h3>
                <p className="text-gray-500 text-sm font-mono uppercase tracking-widest">{data.condition}</p>
            </div>
            {data.icon ? <img src={data.icon} className="w-12 h-12 grayscale opacity-80" alt="icon" /> : <Sun className="w-10 h-10 text-gray-400" />}
        </div>
        <div className="mt-4 flex items-end">
            <span className="text-5xl font-bold text-gray-900 dark:text-white">{data.temp}°</span>
            <span className="mb-1 ml-1 text-xl text-gray-500">C</span>
        </div>
        <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
            <div className="flex items-center space-x-1"><Wind size={14}/> <span>{data.windSpeed} KM/H</span></div>
            <div className="flex items-center space-x-1"><Droplets size={14}/> <span>{data.humidity}%</span></div>
        </div>
    </div>
);

const NewsCard = ({ articles }: { articles: any[] }) => (
    <div className="w-full max-w-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-surface rounded-xl p-4 my-2">
        <div className="flex items-center space-x-2 mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
            <Newspaper size={16} className="text-gray-900 dark:text-white" />
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Live Feed</span>
        </div>
        <div className="space-y-4">
            {articles.map((a, i) => (
                <div key={i} className="group cursor-pointer">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight group-hover:underline transition-all">{a.title}</h4>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-gray-400 font-mono">{a.source} • {a.time}</span>
                        {a.url && <ExternalLink size={10} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"/>}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const StockCard = ({ data }: { data: any }) => {
    const isUp = data.change >= 0;
    return (
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-surface rounded-xl p-4 w-full max-w-xs my-2">
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest font-mono">{data.symbol}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-sm ${isUp ? 'bg-gray-100 dark:bg-white text-black' : 'bg-gray-100 dark:bg-white text-black'}`}>
                    {isUp ? '+' : ''}{data.percentChange}%
                </span>
            </div>
            <div className="flex items-center space-x-2">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white font-mono">${data.price}</h3>
                {isUp ? <TrendingUp size={24} className="text-gray-400"/> : <TrendingDown size={24} className="text-gray-400"/>}
            </div>
        </div>
    );
};

const ResearchCard = ({ results }: { results: any[] }) => (
    <div className="w-full max-w-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-surface rounded-xl p-4 my-2">
        <div className="flex items-center space-x-2 mb-3">
            <Globe size={16} className="text-gray-900 dark:text-white animate-pulse" />
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Research Data</span>
        </div>
        <div className="space-y-3">
            {results.slice(0, 3).map((r, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <a href={r.url} target="_blank" rel="noreferrer" className="block hover:underline">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{r.title}</h4>
                    </a>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{r.snippet}</p>
                    <span className="text-[10px] text-gray-400 font-mono mt-1 block">{r.source}</span>
                </div>
            ))}
        </div>
    </div>
);

const ChatPage: React.FC<ChatPageProps> = ({ 
    messages, onSendMessage, sessionTitle,
    transcript, isListening, isDictationMode, toggleDictation 
}) => {
  const [inputText, setInputText] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);

  // --- Handling Global Dictation ---
  useEffect(() => {
    if (isDictationMode && transcript) {
        // Overwrite or append based on preference. Here we just set it live.
        setInputText(transcript);
    }
  }, [transcript, isDictationMode]);

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotThinking, inputText]);

  useEffect(() => {
      if (messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg.sender === Sender.USER) setIsBotThinking(true);
          else setIsBotThinking(false);
      } else {
          setIsBotThinking(false);
      }
  }, [messages]);

  const handleSubmit = async () => {
    // If we were dictating, stop it first
    if (isDictationMode) toggleDictation();
    
    if (!inputText.trim() && !selectedImage) return;
    const tempText = inputText;
    setInputText('');
    setSelectedImage(undefined);
    onSendMessage(tempText);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#0b0c15] relative transition-colors duration-300">
      
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, gray 1px, transparent 0)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar z-10">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in px-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full animate-pulse-slow"></div>
                    <div className="w-24 h-24 bg-white dark:bg-[#1a1c2e] rounded-3xl flex items-center justify-center shadow-2xl relative border border-gray-100 dark:border-gray-800">
                        <Sparkles className="w-10 h-10 text-black dark:text-white" strokeWidth={1.5} />
                    </div>
                </div>
                
                <h2 className="text-3xl font-light text-gray-800 dark:text-white tracking-tight">
                    System <span className="font-bold">Online</span>
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                    {SUGGESTIONS.map((s) => (
                        <div 
                            key={s.id} 
                            className="group relative flex items-center bg-white dark:bg-[#151725] border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all overflow-hidden cursor-pointer"
                        >
                            <button
                                onClick={() => onSendMessage(s.prompt)}
                                className="flex-1 text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors z-10 outline-none"
                            >
                                {s.text}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setInputText(s.prompt);
                                    fileInputRef.current?.focus();
                                }}
                                className="p-4 border-l border-gray-100 dark:border-gray-800 text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 z-10 outline-none transition-colors"
                                title="Use text"
                            >
                                <ArrowUpRight size={16} />
                            </button>
                            <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="space-y-8 max-w-3xl mx-auto pt-4">
                {messages.map((msg, index) => {
                    const isLastMessage = index === messages.length - 1;
                    const isUser = msg.sender === Sender.USER;
                    
                    return (
                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
                            {isUser ? (
                                <div className="max-w-[85%] relative">
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 text-white dark:text-black rounded-2xl rounded-tr-sm px-6 py-4 shadow-xl">
                                        {msg.attachment && msg.type === 'image' && (
                                            <img src={msg.attachment} alt="Upload" className="mb-3 rounded-lg max-h-60 w-full object-cover border border-white/20" />
                                        )}
                                        <p className="text-[15px] leading-relaxed font-medium">{msg.text}</p>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 text-right font-mono opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                        SENT • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-[95%] w-full flex space-x-0">
                                    <div className="flex-1 space-y-3">
                                        {msg.type === 'weather' && msg.metadata && <WeatherCard data={msg.metadata} />}
                                        {msg.type === 'news' && msg.metadata && <NewsCard articles={msg.metadata} />}
                                        {msg.type === 'stock' && msg.metadata && <StockCard data={msg.metadata} />}
                                        {msg.type === 'research' && msg.metadata && <ResearchCard results={msg.metadata} />}
                                        
                                        <div className="text-gray-800 dark:text-gray-100 text-[15px]">
                                            {isLastMessage ? <Typewriter text={msg.text} /> : <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {isBotThinking && (
                    <div className="flex justify-start animate-fade-in pl-1">
                         <div className="flex items-center space-x-3">
                             <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                             <span className="text-xs font-mono text-gray-400 uppercase tracking-widest animate-pulse">Processing Data...</span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>
        )}
      </div>

      {/* COMMAND DECK INPUT */}
      <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-50">
          <div className={`w-full max-w-2xl bg-white/80 dark:bg-[#1a1c2e]/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-2 transition-all duration-300 ${isDictationMode ? 'ring-2 ring-red-500 shadow-red-500/20' : 'hover:shadow-blue-500/10 hover:border-blue-500/30'}`}>
              
              {selectedImage && (
                  <div className="px-4 pt-2 pb-1 flex justify-between items-center animate-slide-up">
                      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-black/30 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500">Image Attached</span>
                      </div>
                      <button onClick={() => setSelectedImage(undefined)} className="text-gray-400 hover:text-red-500"><span className="text-lg">×</span></button>
                  </div>
              )}

              <div className="flex items-end space-x-2">
                  <div className="flex-1 flex items-center bg-transparent px-2">
                       <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                           <Paperclip size={20} />
                       </button>
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                       
                       <input
                           type="text"
                           value={inputText}
                           onChange={(e) => setInputText(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                           placeholder={isDictationMode ? "Listening..." : "Type a command..."}
                           className="flex-1 bg-transparent py-4 px-2 outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-base"
                       />
                  </div>

                  <div className="flex items-center space-x-1 pr-1 pb-1">
                       <button 
                           onClick={toggleDictation}
                           className={`p-3 rounded-2xl transition-all duration-300 ${isDictationMode ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                       >
                           {isDictationMode ? <StopCircle size={20} /> : <Mic size={20} />}
                       </button>

                       <button 
                           onClick={handleSubmit}
                           disabled={!inputText.trim() && !selectedImage}
                           className={`p-3 rounded-2xl transition-all duration-300 ${(!inputText.trim() && !selectedImage) ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-black dark:bg-white text-white dark:text-black shadow-lg hover:scale-105 active:scale-95'}`}
                       >
                           <Send size={20} />
                       </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ChatPage;
