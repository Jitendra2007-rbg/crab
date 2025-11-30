

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

    // --- EXTERNAL DATA (News/Weather/Stocks) ---
    // Simple heuristic detection. Complex extraction is handled by Gemini (FETCH_... actions)
    // But we can shortcut simple cases here if we wanted. 
    // For now, we rely on Gemini to extract "Weather in London" properly.
    // We only add specific shortcuts that don't require deep NLU.
    
    if (lower.includes('weather') && !lower.includes('like')) {
         // "What's the weather like" -> Handled by Gemini usually, but let's pass to generic chat if unsure
         // or if it's "Weather in X", Gemini does it better.
         // We'll let Gemini handle the extraction for high accuracy.
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
    if (lower.includes('turn on wifi') || lower.includes('enable wifi')) return { type: 'TOGGLE_SETTING', payload: { setting: 'wifi', value: true } };
    if (lower.includes('turn off wifi') || lower.includes('disable wifi')) return { type: 'TOGGLE_SETTING', payload: { setting: 'wifi', value: false } };
    
    if (lower.includes('turn on bluetooth') || lower.includes('enable bluetooth')) return { type: 'TOGGLE_SETTING', payload: { setting: 'bluetooth', value: true } };
    if (lower.includes('turn off bluetooth') || lower.includes('disable bluetooth')) return { type: 'TOGGLE_SETTING', payload: { setting: 'bluetooth', value: false } };

    if (lower.includes('turn on flashlight') || lower.includes('flashlight on')) return { type: 'TOGGLE_SETTING', payload: { setting: 'flashlight', value: true } };
    if (lower.includes('turn off flashlight') || lower.includes('flashlight off')) return { type: 'TOGGLE_SETTING', payload: { setting: 'flashlight', value: false } };

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

    // --- Web/App Launching ---
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
    if (isWebsite) {
        let url = target.replace(/\s/g, '');
        if (!url.startsWith('http')) url = 'https://' + url;
        window.open(url, '_blank');
        return;
    }

    const name = target.toLowerCase();
    if (name.includes('google')) window.open('https://google.com', '_blank');
    else if (name.includes('youtube')) window.open('https://youtube.com', '_blank');
    else if (name.includes('spotify')) window.open('https://open.spotify.com', '_blank');
    else if (name.includes('maps')) window.open('https://maps.google.com', '_blank');
    else if (name.includes('instagram')) window.open('https://instagram.com', '_blank');
    else if (name.includes('twitter') || name.includes('x')) window.open('https://twitter.com', '_blank');
    else if (name.includes('whatsapp')) window.open('whatsapp://', '_self');
    else if (name.includes('calculator')) window.open('calculator://', '_self');
    else if (name.includes('camera')) window.open('camera://', '_self');
    else {
        window.open(`https://www.google.com/search?q=${target}`, '_blank');
    }
};
