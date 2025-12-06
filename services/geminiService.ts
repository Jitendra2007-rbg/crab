import { GoogleGenAI } from "@google/genai";
import { Message, Sender, AIActionResponse } from "../types";

// User provided API Key
const API_KEY = 'AIzaSyDuMQT5nckYc69EjDdv0LNtMC3_hq-BN7g';

const getClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

// STRICTER INSTRUCTION for Quality
const SYSTEM_INSTRUCTION = `
You are CRAB (Cosmic Responsive AI Base).

STRICT OUTPUT RULES:
1. **PERFECT GRAMMAR & SPELLING**: Do not make spelling mistakes. Use proper punctuation.
2. **MEANINGFUL CONTENT**: Do not use filler words or meaningless phrases. Be direct, intelligent, and helpful.
3. **CONCISENESS**: Provide the answer clearly. Do not ramble.
4. **FORMATTING**: Use paragraphs, lists, and bold text for readability.
5. **ACCURACY**: If you don't know something, admit it or ask for clarification. Do not hallucinate.
`;

const RESEARCH_INSTRUCTION = `
You are in RESEARCH MODE.
1. Use the provided Google Search tools to find the most recent and accurate information.
2. Cite your sources implicitly by mentioning where information comes from if relevant.
3. Provide a comprehensive summary of the findings.
4. Ensure all facts are up-to-date.
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
                temperature: 0.1 
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
  base64Image?: string,
  isResearchMode: boolean = false
): Promise<{ text: string, groundingMetadata?: any }> => {
  try {
    const client = getClient();
    
    // Only send last 10 messages to keep context relevant and reduce latency
    const recentHistory = history.slice(-10).map(msg => 
      `${msg.sender === Sender.USER ? 'User' : 'CRAB'}: ${msg.text}`
    ).join('\n');

    const prompt = `${recentHistory}\nUser: ${newMessage}\nCRAB:`;

    let response;

    // Config for natural but accurate conversation
    const genConfig: any = {
        systemInstruction: isResearchMode ? SYSTEM_INSTRUCTION + "\n" + RESEARCH_INSTRUCTION : SYSTEM_INSTRUCTION,
        temperature: 0.4, // Lower temperature for more accurate/proper responses
        topK: 40,
        topP: 0.95,
    };

    // Add Research Tool if enabled
    if (isResearchMode) {
        genConfig.tools = [{ googleSearch: {} }];
    }

    if (base64Image) {
        response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
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

    // Return text and grounding chunks if available (URLs)
    return {
        text: response.text || "I didn't catch that.",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "I'm having trouble connecting to the network right now. Please check your connection." };
  }
};