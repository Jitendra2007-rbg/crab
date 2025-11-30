
import { GoogleGenAI } from "@google/genai";
import { Message, Sender, AIActionResponse } from "../types";

const getClient = () => {
  // User provided API Key
  const apiKey = 'AIzaSyDuMQT5nckYc69EjDdv0LNtMC3_hq-BN7g'; 
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_INSTRUCTION = `
You are CRAB (Cosmic Responsive AI Base), an elite AI assistant.

CRITICAL RULES:
1. **PERFECT ENGLISH**: Your spelling, grammar, and punctuation must be FLAWLESS. Proofread every sentence twice before outputting.
2. **CONCISE VOICE**: You are speaking in a voice call. Keep answers SHORT (1-2 sentences maximum). Do not read long lists.
3. **NO MARKDOWN**: Do not use asterisks (*), bolding, or markdown symbols. Plain text only, optimized for Text-to-Speech readers.
4. **DIRECTNESS**: Answer the user immediately. Do not fluff.
`;

const ACTION_PARSER_INSTRUCTION = `
Extract structured data from user input.
Current Time: ${new Date().toLocaleString()}

Rules:
1. DETECT actions: SCHEDULE, REMINDER, WEATHER, NEWS, STOCK, WEB_SEARCH.
2. OUTPUT JSON ONLY.

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
        const context = history.slice(-2).map(m => `${m.sender}: ${m.text}`).join('\n');
        const prompt = `Context:\n${context}\nInput: "${lastUserText}"\nJSON:`;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: ACTION_PARSER_INSTRUCTION,
                responseMimeType: 'application/json',
                temperature: 0.1 // Very low temp for strict JSON parsing
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
    const recentHistory = history.slice(-6).map(msg => 
      `${msg.sender === Sender.USER ? 'User' : 'CRAB'}: ${msg.text}`
    ).join('\n');

    const prompt = `${recentHistory}\nUser: ${newMessage}\nCRAB:`;

    let response;

    // Common config for accuracy
    const genConfig = {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Extremely low temperature to ensure perfect grammar and no hallucinations
        topK: 40,
        topP: 0.95,
    };

    if (base64Image) {
        response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: prompt }
                ]
            },
            config: genConfig
        });
    } else {
        response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: genConfig
        });
    }

    return response.text || "I didn't catch that.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the network.";
  }
};
