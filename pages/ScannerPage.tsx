import React, { useRef, useState, useEffect } from 'react';
import { X, RefreshCw, Type, Calculator, Leaf, Scan, Grid, CheckCircle, ArrowRight, Camera, Zap } from 'lucide-react';

interface ScannerPageProps {
  onAnalyze: (image: string, prompt: string) => Promise<string>;
  onClose: () => void;
}

type ScanMode = 'OBJECT' | 'BIO' | 'TEXT' | 'MATH';

// Enhanced prompts for better detail as requested
const MODES: { id: ScanMode; label: string; icon: React.ReactNode; prompt: string }[] = [
    { 
        id: 'OBJECT', 
        label: 'Identify', 
        icon: <Scan size={20} />, 
        prompt: "Look at this image. 1. Identify what exactly is in the image (the main subject). 2. Describe the surroundings and details about the context. 3. Provide 3 interesting facts about it." 
    },
    { 
        id: 'BIO', 
        label: 'Bio/Food', 
        icon: <Leaf size={20} />, 
        prompt: "Analyze this image. If it is food, provide nutritional estimation (calories, macros) and healthiness. If it is a plant/animal, identify the species, habitat, and care details." 
    },
    { 
        id: 'TEXT', 
        label: 'Read', 
        icon: <Type size={20} />, 
        prompt: "Transcribe all text in this image accurately, maintaining the structure. If the text is not English, provide a translation." 
    },
    { 
        id: 'MATH', 
        label: 'Solve', 
        icon: <Calculator size={20} />, 
        prompt: "Solve the math problem or logic puzzle presented in this image. Show step-by-step reasoning and the final solution." 
    }
];

const ScannerPage: React.FC<ScannerPageProps> = ({ onAnalyze, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeMode, setActiveMode] = useState<ScanMode>('OBJECT');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("Initializing...");
  const [showGrid, setShowGrid] = useState(true);
  const [autoScan, setAutoScan] = useState(false);

  // Auto-Scan Timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (autoScan && !capturedImage && !isAnalyzing && !result) {
        setKeyword("Auto-scan enabled. Hold steady...");
        timer = setTimeout(() => {
            handleCapture();
        }, 5000); // 5 Seconds "long time" before auto capture
    }
    return () => clearTimeout(timer);
  }, [autoScan, capturedImage, isAnalyzing, result]);

  // Start Camera Logic
  useEffect(() => {
    let mounted = true;
    
    const startCamera = async () => {
      setError(null);
      try {
          // 1. Try Environment Camera (Rear)
          let s: MediaStream;
          try {
             s = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
             });
          } catch (firstErr) {
             console.warn("Environment camera failed, trying default.", firstErr);
             s = await navigator.mediaDevices.getUserMedia({ video: true });
          }

          if(mounted) {
              setStream(s);
              if (videoRef.current) {
                  videoRef.current.srcObject = s;
                  videoRef.current.play().catch(e => console.error("Play error:", e));
              }
          } else {
              s.getTracks().forEach(t => t.stop());
          }
      } catch (e: any) {
          if(mounted) setError("Camera access denied or unavailable. Please check permissions.");
          console.error(e);
      }
    };

    startCamera();

    return () => {
        mounted = false;
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
    };
  }, []); 

  const handleClose = () => {
      if (stream) {
          stream.getTracks().forEach(t => t.stop());
      }
      onClose();
  };

  const handleCapture = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Flash Effect
      const flash = document.getElementById('camera-flash');
      if(flash) {
          flash.style.opacity = '1';
          setTimeout(() => flash.style.opacity = '0', 100);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      setCapturedImage(`data:image/jpeg;base64,${base64}`);
      setIsAnalyzing(true);
      setKeyword("Analyzing details...");
      
      try {
          const modeConfig = MODES.find(m => m.id === activeMode);
          const response = await onAnalyze(base64, modeConfig?.prompt || "Analyze this.");
          setResult(response);
      } catch (e) {
          setResult("Analysis failed. Please try again.");
      } finally {
          setIsAnalyzing(false);
          setAutoScan(false); // Disable auto-scan after capture
      }
  };

  const handleReset = () => {
      setCapturedImage(null);
      setResult(null);
      setIsAnalyzing(false);
      if (videoRef.current) {
          videoRef.current.play().catch(console.error);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col font-mono bg-white dark:bg-black transition-colors duration-300">
        <div id="camera-flash" className="absolute inset-0 bg-white opacity-0 pointer-events-none transition-opacity duration-100 z-[110]"></div>
        <canvas ref={canvasRef} className="hidden" />

        <div className="relative flex-1 overflow-hidden bg-black">
            {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            ) : (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover"
                />
            )}

            {!capturedImage && !error && (
                <div className="absolute inset-0 pointer-events-none p-6">
                    {showGrid && (
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
                             <div className="border-r border-b border-white"></div>
                             <div className="border-r border-b border-white"></div>
                             <div className="border-b border-white"></div>
                             <div className="border-r border-b border-white"></div>
                             <div className="border-r border-b border-white"></div>
                             <div className="border-b border-white"></div>
                             <div className="border-r border-white"></div>
                             <div className="border-r border-white"></div>
                             <div></div>
                        </div>
                    )}
                    
                    {/* Simulated Analysis Ticker */}
                    <div className="absolute bottom-10 left-6">
                         <div className={`flex items-center space-x-2 bg-black/60 px-3 py-1.5 rounded-md backdrop-blur-md border-l-2 ${autoScan ? 'border-green-500' : 'border-blue-500'}`}>
                             <div className={`w-2 h-2 rounded-full animate-ping ${autoScan ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                             <span className="text-xs font-bold text-white tracking-wider uppercase">{keyword}</span>
                         </div>
                    </div>
                </div>
            )}
            
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-50">
                    <Camera size={48} className="text-gray-500 mb-4" />
                    <p className="text-white text-center px-6 text-lg font-bold">{error}</p>
                    <button onClick={handleClose} className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-lg">Close</button>
                </div>
            )}

            {(isAnalyzing || result) && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in z-30">
                     {isAnalyzing ? (
                         <div className="text-center">
                             <div className="relative w-24 h-24 mx-auto mb-6">
                                 <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                                 <div className="absolute inset-0 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                             </div>
                             <h3 className="text-2xl font-bold tracking-widest uppercase mb-2 text-white">Analyzing</h3>
                             <p className="text-blue-400 text-sm animate-pulse">{keyword}</p>
                         </div>
                     ) : (
                         <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-2xl animate-slide-up max-h-[80vh] flex flex-col">
                             <div className="flex items-center space-x-3 mb-4 border-b border-gray-100 dark:border-gray-800 pb-4 shrink-0">
                                 <CheckCircle className="text-green-500" />
                                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Analysis Complete</h3>
                             </div>
                             
                             <div className="bg-gray-50 dark:bg-black/50 rounded-lg p-4 mb-6 overflow-y-auto text-sm text-gray-800 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-gray-800 flex-1">
                                 {result}
                             </div>

                             <div className="flex space-x-3 shrink-0">
                                 <button 
                                     onClick={handleReset} 
                                     className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
                                 >
                                     <RefreshCw size={18} />
                                     <span>Retake</span>
                                 </button>
                                 <button 
                                     onClick={handleClose} 
                                     className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2"
                                 >
                                     <span>Done</span>
                                     <ArrowRight size={18} />
                                 </button>
                             </div>
                         </div>
                     )}
                </div>
            )}

            <div className="absolute top-0 left-0 right-0 p-4 pt- safe-top flex justify-between items-center z-20">
                <button onClick={handleClose} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors border border-white/10">
                    <X size={24} />
                </button>
                <button 
                    onClick={() => setAutoScan(!autoScan)}
                    className={`px-4 py-1.5 backdrop-blur-md rounded-full border transition-all flex items-center space-x-2 ${autoScan ? 'bg-green-500/80 border-green-400' : 'bg-black/60 border-blue-500/30'}`}
                >
                    <Zap size={14} className={autoScan ? 'fill-white text-white' : 'text-blue-400'} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${autoScan ? 'text-white' : 'text-blue-400'}`}>
                        {autoScan ? 'Auto-Scan On' : 'Auto-Scan Off'}
                    </span>
                </button>
                <button onClick={() => setShowGrid(!showGrid)} className={`p-3 backdrop-blur-md rounded-full transition-colors border border-white/10 ${showGrid ? 'bg-white text-black' : 'bg-black/40 text-white'}`}>
                    <Grid size={20} />
                </button>
            </div>
        </div>

        {!result && !isAnalyzing && (
            <div className="bg-white dark:bg-black pb-8 pt-4 px-6 border-t border-gray-100 dark:border-gray-800 transition-colors">
                <div className="flex justify-center items-center mb-8 space-x-6 overflow-x-auto no-scrollbar">
                    {MODES.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setActiveMode(mode.id)}
                            className={`flex flex-col items-center space-y-2 transition-all min-w-[60px] ${activeMode === mode.id ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-70'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-lg ${
                                activeMode === mode.id 
                                ? 'bg-black dark:bg-white text-white dark:text-black' 
                                : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
                            }`}>
                                {mode.icon}
                            </div>
                            <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">{mode.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex justify-center items-center">
                    <button 
                        onClick={handleCapture}
                        className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-700 flex items-center justify-center p-1.5 active:scale-95 transition-transform shadow-xl"
                    >
                        <div className="w-full h-full bg-red-500 rounded-full hover:bg-red-600 transition-colors"></div>
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default ScannerPage;