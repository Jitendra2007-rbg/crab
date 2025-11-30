import React, { useEffect, useState } from 'react';
import { Mic, X, Activity, Volume2 } from 'lucide-react';

interface AssistantSheetProps {
  isOpen: boolean;
  isProcessing: boolean; // True if AI is thinking OR speaking
  transcript: string;
  onClose: () => void;
  wakeword: string;
}

const AssistantSheet: React.FC<AssistantSheetProps> = ({ 
  isOpen, 
  isProcessing, 
  transcript, 
  onClose,
  wakeword
}) => {
  const [displayText, setDisplayText] = useState(`Listening...`);

  useEffect(() => {
    if (isOpen) {
        if (!isProcessing && !transcript) {
            setDisplayText("Listening...");
        } else if (transcript) {
            setDisplayText(transcript);
        } else if (isProcessing) {
            setDisplayText("Thinking...");
        }
    }
  }, [isOpen, transcript, isProcessing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
            onClick={onClose}
        ></div>
      
        {/* Modal / Sheet */}
        <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-8 z-10 shadow-2xl animate-slide-up mb-0 sm:mb-10 transition-all border-t border-white/20">
        
            {/* Drag Handle (Visual only) */}
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-8"></div>

            <div className="flex flex-col items-center justify-center space-y-8">
            
                {/* Visualizer */}
                <div className="relative h-28 w-28 flex items-center justify-center">
                    {isProcessing ? (
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full animate-pulse blur-xl opacity-50"></div>
                            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-2xl z-10 relative">
                                <Volume2 className="text-blue-500 dark:text-blue-400 w-10 h-10 animate-pulse" />
                            </div>
                            {/* Orbiting ring */}
                            <div className="absolute inset-[-10px] border-2 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {/* Listening Rings */}
                            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-[ping_2s_infinite]"></div>
                            <div className="absolute inset-4 border-4 border-blue-500/40 rounded-full animate-[ping_2s_infinite_0.5s]"></div>
                            
                            <button 
                                onClick={onClose} 
                                className="relative z-10 w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 transition-transform active:scale-95"
                            >
                                <Mic className="w-10 h-10 text-white" />
                            </button>
                        </>
                    )}
                </div>

                {/* Text Output */}
                <div className="text-center w-full min-h-[4rem]">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white leading-tight">
                        {isProcessing && !transcript ? "Processing..." : `"${displayText}"`}
                    </h2>
                    {!isProcessing && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Say "{wakeword}" or a command
                        </p>
                    )}
                </div>
                
                {/* Actions */}
                <div className="flex space-x-6">
                    <button 
                        onClick={onClose}
                        className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AssistantSheet;
