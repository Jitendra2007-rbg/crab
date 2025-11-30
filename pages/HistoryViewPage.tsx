import React, { useRef, useEffect } from 'react';
import { Message, Sender } from '../types';

interface HistoryViewPageProps {
  sessionTitle: string;
  messages: Message[];
}

const HistoryViewPage: React.FC<HistoryViewPageProps> = ({ sessionTitle, messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg p-4 overflow-y-auto no-scrollbar pb-20">
      <div className="space-y-6 max-w-3xl mx-auto pt-4">
        <div className="text-center mb-6">
            <span className="text-xs font-medium bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                Archive: {sessionTitle}
            </span>
        </div>
        {messages.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
            >
                <div 
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm md:text-base leading-relaxed ${
                        msg.sender === Sender.USER 
                        ? 'bg-primary-600/80 text-white rounded-br-none' 
                        : 'bg-white dark:bg-dark-surface border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none'
                    }`}
                >
                    {msg.attachment && (
                        <img src={msg.attachment} alt="Upload" className="mb-3 rounded-lg max-h-60 w-full object-cover" />
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default HistoryViewPage;