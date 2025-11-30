
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

  useEffect(() => {
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const setupRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true; 
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      // --- STRICT GATING ---
      // If AI is speaking OR we are in the cool-down period, IGNORE EVERYTHING.
      if (isSpeakingRef.current || ignoreInputRef.current) {
          return; 
      }

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
      // If not-allowed, we must stop. Otherwise (no-speech, network), we ignore and restart.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          shouldBeListeningRef.current = false;
          setIsListening(false);
      } else {
          // Silent error - will restart in onend
      }
    };

    recognition.onend = () => {
        // Only update state to false if we REALLY stopped
        if (!shouldBeListeningRef.current) {
             setIsListening(false);
        } else {
             // Aggressive Instant Restart
             // Do NOT set isListening(false) here to avoid UI blink
             clearTimeout(restartTimerRef.current);
             restartTimerRef.current = setTimeout(() => {
                 try { recognition.start(); } catch(e) {}
             }, 10);
        }
    };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
      setupRecognition();
      
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && shouldBeListeningRef.current) {
              if (recognitionRef.current) {
                  try { recognitionRef.current.start(); } catch(e){}
              }
          }
      };
      
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          shouldBeListeningRef.current = false;
          try { recognitionRef.current?.stop(); } catch(e) {}
      };
  }, [setupRecognition]);

  const startListening = (continuous = true) => {
    shouldBeListeningRef.current = true;
    
    // Stop any current speech to open the gate
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    ignoreInputRef.current = false; // Reset gate
    setIsSpeaking(false);

    try { 
        recognitionRef.current?.start(); 
    } catch(e) {}
  };

  const stopListening = () => {
    shouldBeListeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch(e) {}
    setIsListening(false);
  };

  const cancelSpeech = () => {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      ignoreInputRef.current = false;
      setIsSpeaking(false);
  };
  
  const resetTranscript = () => {
      setTranscript('');
  };

  const speak = (text: string, voiceId?: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
    }

    // 1. ENGAGE GATES
    isSpeakingRef.current = true; 
    ignoreInputRef.current = true; // Block input immediately
    setIsSpeaking(true);
    
    // 2. Clear Transcript to prevent processing old text
    setTranscript(''); 

    window.speechSynthesis.cancel();
    
    // Remove emojis/markdown before speaking
    const cleanText = text.replace(/[*#]/g, '').replace(/\[.*?\]/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const handleEnd = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        
        // 3. COOL-DOWN PERIOD
        // Wait 1 second AFTER speech ends before listening again.
        // This prevents the tail-end echo ("...help you") from triggering a loop.
        setTimeout(() => {
            ignoreInputRef.current = false;
            if (onEnd) onEnd();
        }, 1000);
    };

    utterance.onend = handleEnd;
    utterance.onerror = (e) => {
        console.error("TTS Error", e);
        handleEnd(); 
    };
    
    // Voice Selection
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const presetId = voiceId && VOICE_PRESETS[voiceId] ? voiceId : 'Cosmic';
    const preset = VOICE_PRESETS[presetId];

    let selectedVoice: SpeechSynthesisVoice | undefined;
    if (voices.length > 0) {
        for (const term of preset.terms) {
            const match = voices.find(v => v.name.toLowerCase().includes(term) || v.lang.toLowerCase().includes(term));
            if (match) {
                selectedVoice = match;
                break;
            }
        }
        if (!selectedVoice) selectedVoice = voices[0];
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = preset.pitch;
    utterance.rate = preset.rate;

    window.speechSynthesis.speak(utterance);
  };

  return { isListening, transcript, setTranscript, resetTranscript, startListening, stopListening, speak, cancelSpeech, isSpeaking };
};
