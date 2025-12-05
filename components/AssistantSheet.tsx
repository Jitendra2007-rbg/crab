
import React, { useEffect, useState } from 'react';
import { X, Mic } from 'lucide-react';

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

  // Text Stability Logic
  useEffect(() => {
    if (isOpen) {
        if (transcript) {
            setDisplayText(transcript);
        } else if (isProcessing) {
            setDisplayText("Thinking...");
        } else {
             const timeout = setTimeout(() => setDisplayText("Listening..."), 500);
             return () => clearTimeout(timeout);
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
        <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-black rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 z-10 shadow-2xl animate-slide-up mb-0 sm:mb-10 transition-all border-t border-white/20 overflow-hidden">
            
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-10"></div>

            <div className="flex flex-col items-center justify-center relative z-10">
            
                {/* CLASSIC PULSE VISUALIZER (Requested Revert) */}
                <div className="relative h-40 w-40 flex items-center justify-center mb-6">
                    {/* Ring 1 */}
                    <div className={`absolute border-4 border-blue-500 rounded-full transition-all duration-1000 ${isProcessing ? 'animate-spin border-t-transparent w-24 h-24' : 'animate-ping opacity-20 w-32 h-32'}`}></div>
                    
                    {/* Ring 2 */}
                    <div className={`absolute border-2 border-blue-400 rounded-full transition-all duration-[1.5s] delay-100 ${isProcessing ? 'w-20 h-20 border-dashed animate-spin-slow' : 'w-28 h-28 animate-ping opacity-40'}`}></div>
                    
                    {/* Center Mic Button */}
                    <div 
                        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${isProcessing ? 'bg-white dark:bg-gray-800 scale-90' : 'bg-gradient-to-tr from-blue-600 to-blue-400 scale-100'}`}
                        onClick={onClose}
                    >
                        {isProcessing ? (
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                        ) : (
                            <Mic size={32} className="text-white" />
                        )}
                    </div>
                </div>

                {/* Text Output */}
                <div className="text-center w-full min-h-[5rem] flex flex-col justify-start items-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight transition-all duration-300">
                        {displayText}
                    </h2>
                    {!isProcessing && !transcript && (
                        <p className="text-sm text-gray-400 mt-3 font-medium tracking-wide">
                            Say "{wakeword}"
                        </p>
                    )}
                </div>
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="mt-4 p-4 rounded-full bg-gray-50 dark:bg-gray-900 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default AssistantSheet;
