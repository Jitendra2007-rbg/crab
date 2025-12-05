
import { GoogleGenAI } from "@google/genai";
import { Message, Sender, AIActionResponse } from "../types";

const getClient = () => {
  // Use process.env.API_KEY as per guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const SYSTEM_INSTRUCTION = `
You are CRAB (Cosmic Responsive AI Base), an advanced and helpful AI assistant.

CORE BEHAVIORS:
1. **PROFESSIONALISM**: Your responses must be grammatically perfect, well-structured, and helpful. Avoid spelling errors completely.
2. **CLARITY**: Explain concepts clearly similar to Perplexity AI or Gemini. Use paragraphs where necessary.
3. **TONE**: Be friendly, intelligent, and precise.
4. **FORMATTING**: You may use standard text formatting. If the user asks for code, provide it. If they ask for a list, use a list.
5. **CONCISENESS**: While you should be detailed, avoid unnecessary fluff. Get straight to the answer.
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
    // Include more history for better context
    const recentHistory = history.slice(-10).map(msg => 
      `${msg.sender === Sender.USER ? 'User' : 'CRAB'}: ${msg.text}`
    ).join('\n');

    const prompt = `${recentHistory}\nUser: ${newMessage}\nCRAB:`;

    let response;

    // Config for natural conversation
    const genConfig = {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Higher temperature for more natural, creative language
        topK: 40,
        topP: 0.95,
    };

    if (base64Image) {
        // Use gemini-2.5-flash for vision tasks (text from image) as per guidelines
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

    return response.text || "I didn't catch that.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the network.";
  }
};
