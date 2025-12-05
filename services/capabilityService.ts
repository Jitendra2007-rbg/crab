

import { ActionIntent, AppMode } from "../types";

/**
 * Parses user input to determine if a "native" action is required.
 * Returns an ActionIntent object.
 */
export const processNativeCommands = (text: string): ActionIntent => {
    const lower = text.toLowerCase().trim();
    
    // --- Stop / Cancel ---
    if (
        lower === 'stop' || 
        lower === 'cancel' || 
        lower === 'stop listening' || 
        lower === 'shut up' || 
        lower === 'quiet' || 
        lower === 'exit' ||
        lower === 'goodbye' ||
        lower === 'bye'
    ) {
        return { type: 'STOP_LISTENING' };
    }

    // --- DEEP SEARCH COMMANDS (YouTube, Spotify, etc) ---
    // Pattern: "Search for [X] on [Platform]" or "Open [Platform] and search [X]"
    
    // YouTube
    const ytMatch = lower.match(/(?:search for|play|watch|find) (.+) on youtube/i) || lower.match(/youtube.*(?:search|find|play|watch) (.+)/i);
    if (ytMatch && ytMatch[1]) {
        const query = ytMatch[1].replace('for', '').trim();
        return { type: 'OPEN_WEBSITE', payload: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` };
    }

    // Spotify
    const spotifyMatch = lower.match(/(?:play|listen to) (.+) on spotify/i) || lower.match(/spotify.*(?:play|listen to) (.+)/i);
    if (spotifyMatch && spotifyMatch[1]) {
        const query = spotifyMatch[1].trim();
        // Spotify web search url
        return { type: 'OPEN_WEBSITE', payload: `https://open.spotify.com/search/${encodeURIComponent(query)}` };
    }

    // Google
    const googleMatch = lower.match(/(?:google|search for) (.+)/i);
    if (lower.startsWith('google ') || (lower.startsWith('search for ') && !lower.includes('youtube') && !lower.includes('spotify'))) {
        const query = lower.replace(/^(google|search for)\s+/, '');
        return { type: 'OPEN_WEBSITE', payload: `https://www.google.com/search?q=${encodeURIComponent(query)}` };
    }


    // --- EXTERNAL DATA (News/Weather/Stocks) ---
    // Simple heuristic detection. Complex extraction is handled by Gemini (FETCH_... actions)
    if (lower.includes('weather') && !lower.includes('like')) {
         // Pass to Gemini usually, but we can return NONE to let Gemini handle it
    }

    // --- HEALTH & GYM ---
    if (lower.includes('start gym') || lower.includes('start workout') || lower.includes('begin workout') || lower.includes('track workout')) {
        return { type: 'START_WORKOUT' };
    }
    if (lower.includes('stop gym') || lower.includes('end workout') || lower.includes('finish workout') || lower.includes('stop workout')) {
        return { type: 'END_WORKOUT' };
    }
    if (
        lower.includes('how many steps') || 
        lower.includes('step count') || 
        lower.includes('daily report') || 
        lower.includes('health status') ||
        lower.includes('my stats') ||
        lower.includes('health report')
    ) {
        return { type: 'REPORT_HEALTH' };
    }
    if (lower.includes('open health') || lower.includes('show health') || lower.includes('open fitness')) {
        return { type: 'NAVIGATE', payload: AppMode.HEALTH };
    }


    // --- Screen Reading ---
    if (
        lower.includes('read screen') || 
        lower.includes('read the screen') || 
        lower.includes('read my screen') ||
        lower.includes('what is on the screen') || 
        lower.includes('what is on my screen') || 
        lower.includes("what's on my screen") || 
        lower.includes("what's on the screen") ||
        lower.includes("describe the screen") ||
        lower.includes("describe screen") ||
        lower.includes("look at my screen") ||
        lower.includes("what do you see")
    ) {
        return { type: 'READ_SCREEN' };
    }

    // --- Hardware / System Controls ---
    // Note: In a pure web environment, these are mock actions. In a Capacitor app with plugins, these would map to plugin calls.
    if (lower.includes('turn on wifi') || lower.includes('enable wifi') || lower.includes('wifi on')) return { type: 'TOGGLE_SETTING', payload: { setting: 'wifi', value: true } };
    if (lower.includes('turn off wifi') || lower.includes('disable wifi') || lower.includes('wifi off')) return { type: 'TOGGLE_SETTING', payload: { setting: 'wifi', value: false } };
    
    if (lower.includes('turn on bluetooth') || lower.includes('enable bluetooth') || lower.includes('bluetooth on')) return { type: 'TOGGLE_SETTING', payload: { setting: 'bluetooth', value: true } };
    if (lower.includes('turn off bluetooth') || lower.includes('disable bluetooth') || lower.includes('bluetooth off')) return { type: 'TOGGLE_SETTING', payload: { setting: 'bluetooth', value: false } };

    if (lower.includes('turn on flashlight') || lower.includes('flashlight on') || lower.includes('torch on')) return { type: 'TOGGLE_SETTING', payload: { setting: 'flashlight', value: true } };
    if (lower.includes('turn off flashlight') || lower.includes('flashlight off') || lower.includes('torch off')) return { type: 'TOGGLE_SETTING', payload: { setting: 'flashlight', value: false } };

    if (lower.includes('take screenshot') || lower.includes('capture screen') || lower.includes('screenshot this')) {
        return { type: 'SCREENSHOT' };
    }

    // --- Navigation ---
    if (lower.includes('go to settings') || lower.includes('open settings')) {
        return { type: 'NAVIGATE', payload: AppMode.SETTINGS };
    }
    if (lower.includes('show reminders') || lower.includes('open reminders') || lower.includes('show alarms') || lower.includes('open alarms')) {
        return { type: 'NAVIGATE', payload: AppMode.REMINDERS };
    }
    if (lower.includes('show schedule') || lower.includes('open schedule') || lower.includes('show calendar')) {
        return { type: 'NAVIGATE', payload: AppMode.SCHEDULE };
    }
    if (lower.includes('show notifications') || lower.includes('open notifications')) {
        return { type: 'NAVIGATE', payload: AppMode.NOTIFICATIONS };
    }

    // --- Web/App Launching (Generic) ---
    if (
        (lower.startsWith('open ') || lower.startsWith('launch ') || lower.startsWith('go to ') || lower.startsWith('start ')) &&
        !lower.includes('?') && 
        lower.split(' ').length < 6
    ) {
        const target = lower.replace(/^(open|launch|start|go to)\s+/, '');
        
        if (target.includes('.com') || target.includes('.org') || target.includes('.net') || target.includes('.io')) {
             return { type: 'OPEN_WEBSITE', payload: target };
        }
        
        return { type: 'OPEN_APP', payload: target };
    }
    
    // --- Reminders & Alarms ---
    if (
        lower.includes('remind me') || 
        lower.includes('set reminder') || 
        lower.includes('set a reminder') ||
        lower.includes('set alarm') || 
        lower.includes('set an alarm') ||
        lower.startsWith('wake me up')
    ) {
        let clean = lower;
        ['remind me to ', 'set a reminder to ', 'set reminder ', 'set an alarm for ', 'set alarm for ', 'wake me up at '].forEach(prefix => {
            clean = clean.replace(prefix, '');
        });
        
        const parts = clean.split(/\s(at|in|for|by)\s/);
        
        let taskText = parts[0];
        let timeText = parts.length > 2 ? parts[2] : 'Today';

        if (lower.startsWith('wake me up')) {
            taskText = "Wake up";
            timeText = clean.replace('wake me up at ', '');
            if (timeText === clean) timeText = "7:00 AM"; 
        }
        
        if (taskText.match(/^\d/) || taskText === '') {
            timeText = taskText;
            taskText = "Alarm";
        }

        return { 
            type: 'ADD_REMINDER', 
            payload: { 
                text: taskText.charAt(0).toUpperCase() + taskText.slice(1), 
                time: timeText 
            } 
        };
    }

    // --- Scheduling ---
    if (lower.startsWith('schedule ') || lower.startsWith('add to schedule ') || lower.startsWith('create event ')) {
        const clean = lower.replace(/^(schedule|add to schedule|create event)\s+/, '');
        return {
            type: 'ADD_SCHEDULE',
            payload: {
                title: clean,
                time: 'Upcoming'
            }
        }
    }

    return { type: 'NONE' };
};

export const executeExternalLaunch = (target: string, isWebsite: boolean = false) => {
    // If it's a full URL (likely from SEARCH command)
    if (target.startsWith('http')) {
        window.open(target, '_blank');
        return;
    }

    if (isWebsite) {
        let url = target.replace(/\s/g, '');
        if (!url.startsWith('http')) url = 'https://' + url;
        window.open(url, '_blank');
        return;
    }

    const name = target.toLowerCase();
    
    // Robust App URL Schemes for Mobile/PWA
    // Try to open app, fallback to website in new tab
    if (name.includes('google')) { window.open('https://google.com', '_blank'); return; }
    if (name.includes('youtube')) { 
        // Try deep link first
        window.location.href = 'vnd.youtube://';
        // Fallback (setTimeout)
        setTimeout(() => window.open('https://youtube.com', '_blank'), 500);
        return;
    }
    if (name.includes('spotify')) {
        window.location.href = 'spotify://';
        setTimeout(() => window.open('https://open.spotify.com', '_blank'), 500);
        return;
    }
    if (name.includes('maps')) { window.open('https://maps.google.com', '_blank'); return; }
    if (name.includes('instagram')) {
        window.location.href = 'instagram://app';
        setTimeout(() => window.open('https://instagram.com', '_blank'), 500);
        return;
    }
    if (name.includes('twitter') || name.includes('x')) {
        window.location.href = 'twitter://';
        setTimeout(() => window.open('https://twitter.com', '_blank'), 500);
        return;
    }
    if (name.includes('whatsapp')) { window.location.href = 'whatsapp://'; return; }
    if (name.includes('calculator')) { window.location.href = 'calculator://'; return; }
    
    // Fallback search
    window.open(`https://www.google.com/search?q=${target}`, '_blank');
};
