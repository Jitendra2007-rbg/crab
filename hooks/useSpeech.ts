import { useState, useEffect, useRef, useCallback } from 'react';

// --- Voice Presets Configuration ---
const VOICE_PRESETS: Record<string, { gender: 'male' | 'female', terms: string[], pitch: number, rate: number }> = {
    Cosmic: { gender: 'female', terms: ['google us english', 'samantha', 'en-us', 'female'], pitch: 1.0, rate: 1.0 },
    Nebula: { gender: 'female', terms: ['google uk english female', 'zira', 'en-gb', 'female'], pitch: 1.1, rate: 1.0 },
    Star:   { gender: 'female', terms: ['google au english', 'karen', 'en-au', 'female'], pitch: 1.15, rate: 1.05 },
    Nova:   { gender: 'female', terms: ['google us english', 'samantha', 'en-us'], pitch: 1.25, rate: 1.0 }, 
    Galaxy: { gender: 'female', terms: ['irish', 'moira', 'tessa', 'en-ie'], pitch: 0.95, rate: 0.95 }, 
    Void:   { gender: 'male', terms: ['google uk english male', 'daniel', 'en-gb', 'male'], pitch: 0.9, rate: 0.9 },
    Pulsar: { gender: 'male', terms: ['google us english', 'david', 'en-us', 'male'], pitch: 1.0, rate: 1.0 },
    Orbit:  { gender: 'male', terms: ['google in english', 'rishi', 'en-in', 'male'], pitch: 1.0, rate: 1.1 },
    Quantum:{ gender: 'male', terms: ['microsoft mark', 'google uk english male', 'male'], pitch: 0.8, rate: 0.95 }, 
    Atlas:  { gender: 'male', terms: ['google us english', 'male'], pitch: 0.7, rate: 0.9 }
};

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef(false);
  
  // Gating Refs
  const isSpeakingRef = useRef(false); // True if TTS is active
  const ignoreInputRef = useRef(false); // True if we are in "Cool-down" mode
  const restartTimerRef = useRef<any>(null);

  // 1. Robust Voice Loading for Mobile
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            setAvailableVoices(voices);
        }
    };

    loadVoices();
    
    // Chrome/Android loads asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Backup interval for stubborn mobile browsers
    const interval = setInterval(() => {
        if (availableVoices.length === 0) loadVoices();
        else clearInterval(interval);
    }, 500);

    return () => {
        clearInterval(interval);
        try { window.speechSynthesis.onvoiceschanged = null; } catch(e) {}
    };
  }, [availableVoices.length]);

  // 2. Setup Recognition
  const setupRecognition = useCallback(() => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) return;

    try {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true; 
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
          if (isSpeakingRef.current || ignoreInputRef.current) return;

          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          const t = finalTranscript || interimTranscript;
          if (t.trim()) {
              setTranscript(t);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              shouldBeListeningRef.current = false;
              setIsListening(false);
          } else {
              // Ignore network errors, try restart
          }
        };

        recognition.onend = () => {
            if (shouldBeListeningRef.current) {
                 clearTimeout(restartTimerRef.current);
                 restartTimerRef.current = setTimeout(() => {
                     try { recognition.start(); } catch(e) {}
                 }, 100);
            } else {
                 setIsListening(false);
            }
        };

        recognitionRef.current = recognition;
    } catch (e) {
        console.error("Speech Setup Error", e);
    }
  }, []);

  useEffect(() => {
      setupRecognition();
      
      const handleVisibility = () => {
          if (document.visibilityState === 'visible' && shouldBeListeningRef.current) {
               try { recognitionRef.current?.start(); } catch(e){}
          }
      };
      
      document.addEventListener("visibilitychange", handleVisibility);
      return () => {
          document.removeEventListener("visibilitychange", handleVisibility);
          shouldBeListeningRef.current = false;
          try { recognitionRef.current?.stop(); } catch(e) {}
      };
  }, [setupRecognition]);

  const startListening = (continuous = true) => {
    if (shouldBeListeningRef.current && isListening) return;

    shouldBeListeningRef.current = true;
    isSpeakingRef.current = false;
    ignoreInputRef.current = false;
    
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    try { recognitionRef.current?.start(); } catch(e) {}
  };

  const stopListening = () => {
    shouldBeListeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch(e) {}
    setIsListening(false);
  };

  const cancelSpeech = () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      ignoreInputRef.current = false;
      setIsSpeaking(false);
  };
  
  const resetTranscript = () => {
      setTranscript('');
  };

  const speak = (text: string, voiceId?: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
    }

    // Stop listening temporarily
    isSpeakingRef.current = true; 
    ignoreInputRef.current = true; 
    setIsSpeaking(true);
    setTranscript(''); 

    // Cancel existing
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/[*#]/g, '').replace(/\[.*?\]/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const handleEnd = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setTimeout(() => {
            ignoreInputRef.current = false;
            if (onEnd) onEnd();
        }, 800);
    };

    utterance.onend = handleEnd;
    utterance.onerror = (e) => {
        console.error("Speech Error:", e);
        handleEnd();
    };
    
    // Voice Selection Logic - RETRY if voices empty
    let voices = availableVoices;
    if (voices.length === 0) {
        try { voices = window.speechSynthesis.getVoices(); } catch(e) {}
    }

    const presetId = voiceId && VOICE_PRESETS[voiceId] ? voiceId : 'Cosmic';
    const preset = VOICE_PRESETS[presetId];

    // Priority: Exact Name match -> Lang match -> Gender match -> Default
    let selectedVoice = voices.find(v => 
        preset.terms.some(term => v.name.toLowerCase().includes(term))
    );

    if (!selectedVoice) {
         selectedVoice = voices.find(v => 
            preset.terms.some(term => v.lang.toLowerCase().includes(term))
         );
    }
    
    if (!selectedVoice && voices.length > 0) {
        // Fallback to first available
        selectedVoice = voices[0];
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang; // Important for Android
    }
    
    utterance.pitch = preset.pitch;
    utterance.rate = preset.rate;

    window.speechSynthesis.speak(utterance);
  };

  return { isListening, transcript, setTranscript, resetTranscript, startListening, stopListening, speak, cancelSpeech, isSpeaking };
};