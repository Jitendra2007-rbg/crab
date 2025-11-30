
import { useState, useEffect, useRef } from 'react';

// --- Voice Presets Configuration ---
const VOICE_PRESETS: Record<string, { gender: 'male' | 'female', terms: string[], pitch: number, rate: number }> = {
    // Female Voices
    Cosmic: { gender: 'female', terms: ['google us english', 'samantha', 'en-us', 'female'], pitch: 1.0, rate: 1.0 },
    Nebula: { gender: 'female', terms: ['google uk english female', 'zira', 'en-gb', 'female'], pitch: 1.1, rate: 1.0 },
    Star:   { gender: 'female', terms: ['google au english', 'karen', 'en-au', 'female'], pitch: 1.15, rate: 1.05 },
    Nova:   { gender: 'female', terms: ['google us english', 'samantha', 'en-us'], pitch: 1.25, rate: 1.0 }, 
    Galaxy: { gender: 'female', terms: ['irish', 'moira', 'tessa', 'en-ie'], pitch: 0.95, rate: 0.95 }, 

    // Male Voices
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
  const restartTimeoutRef = useRef<any>(null);

  // Load Voices
  useEffect(() => {
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            setAvailableVoices(voices);
        }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    const interval = setInterval(loadVoices, 500);
    return () => { 
        window.speechSynthesis.onvoiceschanged = null; 
        clearInterval(interval);
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false; // We manage restart manually for better control
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
          setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        // BARGE-IN: If AI is speaking, stop it immediately when user speaks
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const t = finalTranscript || interimTranscript;
        setTranscript(t);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            shouldBeListeningRef.current = false;
            setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Instant restart if we are supposed to be listening and not currently speaking via TTS
        if (shouldBeListeningRef.current && !window.speechSynthesis.speaking) {
            if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = setTimeout(() => {
                try { 
                    if (shouldBeListeningRef.current) recognitionRef.current.start(); 
                } catch(e) {}
            }, 50); // Very fast restart
        }
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        try { recognitionRef.current?.stop(); } catch(e){}
    };
  }, []);

  const startListening = (continuous = false) => {
    shouldBeListeningRef.current = continuous;
    // Cancel any speaking
    window.speechSynthesis.cancel(); 
    setIsSpeaking(false);
    
    if (isListening) return;
    try { recognitionRef.current?.start(); } catch(e) {}
  };

  const stopListening = () => {
    shouldBeListeningRef.current = false;
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    try { recognitionRef.current?.stop(); } catch(e) {}
    setIsListening(false);
  };

  const cancelSpeech = () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
  };
  
  const resetTranscript = () => setTranscript('');

  const speak = (text: string, voiceId?: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
    }

    // Stop listening temporarily
    try { recognitionRef.current?.stop(); } catch(e) {}
    
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/\*/g, '').replace(/\[.*?\]/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const handleEnd = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
    };

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = handleEnd;
    utterance.onerror = (e) => {
        console.error("TTS Error", e);
        handleEnd(); // Ensure we callback even on error to restart mic
    };
    
    // Voice Selection Logic
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
