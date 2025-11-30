
import { GoogleGenAI } from "@google/genai";
import { Message, Sender, AIActionResponse } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY || ''; 
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_INSTRUCTION = `
You are CRAB (Cosmic Responsive AI Base), an advanced AI assistant.

CORE DIRECTIVES:
1. **ACCURACY & GRAMMAR**: You must ensure PERFECTION in spelling, grammar, and punctuation. Do not use slang unless requested.
2. **VOICE OPTIMIZED**: For voice interactions, your responses must be CONCISE (1-2 sentences max). Do not read out long lists or markdown formatting like tables.
3. **FORMATTING**: Use clean formatting for text.
4. **PERSONALITY**: Helpful, intelligent, and professional.
5. **JSON**: Do NOT output JSON unless explicitly asked.
`;

const ACTION_PARSER_INSTRUCTION = `
You are the Action Logic. Extract structured data from user input.
Current Time: ${new Date().toLocaleString()}

Rules:
1. DETECT actions: SCHEDULE, REMINDER, WEATHER, NEWS, STOCK, WEB_SEARCH.
2. COMPLEX RECURRENCE: Handle "Medicine every 4 hours" into batch reminders.
3. OUTPUT JSON ONLY.

Schema:
{
  "hasAction": boolean, 
  "actionType": "SCHEDULE" | "REMINDER_BATCH" | "FETCH_WEATHER" | "FETCH_NEWS" | "FETCH_STOCK" | "FETCH_WEB_SEARCH" | "NONE",
  "missingInfo": string | null,
  "reply": string,
  "data": { "title": string, "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM", "reminders": [{"text":string,"time":"HH:MM","date":"YYYY-MM-DD"}], "location":string, "query":string, "symbol":string }
}
`;

export const extractActionFromText = async (
    history: Message[], 
    lastUserText: string
): Promise<AIActionResponse | null> => {
    try {
        const client = getClient();
        // Optimize context size for speed
        const context = history.slice(-2).map(m => `${m.sender}: ${m.text}`).join('\n');
        const prompt = `Context:\n${context}\nInput: "${lastUserText}"\nJSON:`;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: ACTION_PARSER_INSTRUCTION,
                responseMimeType: 'application/json'
            }
        });

        const jsonStr = response.text;
        if (!jsonStr) return null;
        return JSON.parse(jsonStr) as AIActionResponse;
    } catch (e) {
        console.error("Action Parsing Error:", e);
        return null;
    }
};

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  base64Image?: string
): Promise<string> => {
  try {
    const client = getClient();
    // Reduce history context for faster token processing
    const recentHistory = history.slice(-6).map(msg => 
      `${msg.sender === Sender.USER ? 'User' : 'CRAB'}: ${msg.text}`
    ).join('\n');

    const prompt = `${recentHistory}\nUser: ${newMessage}\nCRAB:`;

    let response;

    if (base64Image) {
        response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: prompt }
                ]
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });
    } else {
        response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });
    }

    return response.text || "I'm having trouble processing that request.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the network right now.";
  }
};
