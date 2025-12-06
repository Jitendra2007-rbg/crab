import { GoogleGenAI, Type } from "@google/genai";
import { Message, Sender, AIActionResponse } from "../types";

// User provided API Keys for redundancy and load balancing.
// Hardcoded to ensure browser compatibility (no process.env).
const API_KEYS = [
  'AIzaSyCRFbLdi34z2uu_UfEICfwVAGA1n_ArUrU',
  'AIzaSyDN2TSZVLkkerNGKyRC2wn7gvbb_IGobzI',
  'AIzaSyDuMQT5nckYc69EjDdv0LNtMC3_hq-BN7g'
];

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
`;

/**
 * Executes an operation with automatic key rotation.
 * If a key fails (e.g. quota exceeded), it retries with the next key.
 */
async function withKeyRotation<T>(operation: (client: GoogleGenAI) => Promise<T>): Promise<T> {
    let lastError: any;
    
    // Pick a random starting index to distribute load across keys on app reload
    const startIndex = Math.floor(Math.random() * API_KEYS.length);
    
    // Try every key exactly once
    for (let i = 0; i < API_KEYS.length; i++) {
        const index = (startIndex + i) % API_KEYS.length;
        const apiKey = API_KEYS[index];
        
        try {
            const client = new GoogleGenAI({ apiKey });
            // Await the operation to ensure we catch failures here
            const result = await operation(client);
            return result;
        } catch (err: any) {
            console.warn(`Gemini API Key ${index + 1}/${API_KEYS.length} failed:`, err.message || err);
            lastError = err;
            // Loop continues to try next key
        }
    }
    
    // If all keys failed
    console.error("All Gemini API keys failed to respond. Please check quotas.");
    throw lastError;
}

/**
 * Generic helper to generate JSON data using Gemini
 * Used by external services to fallback to AI generation
 */
export const generateGeminiJSON = async (prompt: string, schema?: any): Promise<any> => {
    try {
        return await withKeyRotation(async (client) => {
            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema
                }
            });
            return JSON.parse(response.text || "{}");
        });
    } catch (e) {
        console.error("Gemini JSON Generation Error:", e);
        return null;
    }
};

export const extractActionFromText = async (
    history: Message[], 
    lastUserText: string
): Promise<AIActionResponse | null> => {
    try {
        return await withKeyRotation(async (client) => {
            const context = history.slice(-2).map(m => `${m.sender}: ${m.text}`).join('\n');
            const prompt = `Context:\n${context}\nInput: "${lastUserText}"\nJSON:`;

            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: ACTION_PARSER_INSTRUCTION,
                    responseMimeType: 'application/json',
                    temperature: 0.1,
                }
            });

            const jsonStr = response.text;
            if (!jsonStr) return null;
            return JSON.parse(jsonStr) as AIActionResponse;
        });
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
    return await withKeyRotation(async (client) => {
        // Only send last 10 messages to keep context relevant and reduce latency
        const recentHistory = history.slice(-10).map(msg => 
          `${msg.sender === Sender.USER ? 'User' : 'CRAB'}: ${msg.text}`
        ).join('\n');

        const prompt = `${recentHistory}\nUser: ${newMessage}\nCRAB:`;

        let response;

        const genConfig: any = {
            systemInstruction: isResearchMode ? SYSTEM_INSTRUCTION + "\n" + RESEARCH_INSTRUCTION : SYSTEM_INSTRUCTION,
            temperature: 0.4, 
            topK: 40,
            topP: 0.95,
        };

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

        return {
            text: response.text || "I didn't catch that.",
            groundingMetadata: response.candidates?.[0]?.groundingMetadata?.groundingChunks
        };
    });

  } catch (error) {
    console.error("Gemini Final Error:", error);
    return { text: "I'm having trouble connecting to the network right now. Please check your connection." };
  }
};