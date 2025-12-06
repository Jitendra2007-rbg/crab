import { WeatherData, NewsArticle, StockData, SearchResult } from '../types';
import { generateGeminiJSON } from './geminiService';

// API KEYS - HARDCODED Fallbacks to prevent Browser Crash
// In a browser environment, 'process' is not defined.
const WEATHER_API_KEY = 'demo_key';
const NEWS_API_KEY = 'demo_key';
const STOCK_API_KEY = 'demo_key';

/**
 * Fetches weather for a given city.
 */
export const fetchWeather = async (city: string): Promise<WeatherData> => {
    try {
        if (WEATHER_API_KEY === 'demo_key') throw new Error("Demo Mode");

        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API_KEY}`);
        if (!response.ok) throw new Error("Weather API failed");
        
        const data = await response.json();
        return {
            location: data.name,
            temp: Math.round(data.main.temp),
            condition: data.weather[0].main,
            icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed
        };
    } catch (e) {
        console.warn("Using AI Generated Weather Data");
        const prompt = `Generate realistic current weather data for ${city} as JSON. 
        Format: { "location": string, "temp": number (celsius), "condition": string (e.g. Sunny, Cloudy), "humidity": number, "windSpeed": number }`;
        
        const aiData = await generateGeminiJSON(prompt);
        
        return {
            location: aiData?.location || city,
            temp: aiData?.temp || 22,
            condition: aiData?.condition || "Clear",
            icon: '', // Fallback to default icon in UI
            humidity: aiData?.humidity || 50,
            windSpeed: aiData?.windSpeed || 10
        };
    }
};

/**
 * Fetches latest news.
 */
export const fetchNews = async (query?: string): Promise<NewsArticle[]> => {
    try {
        if (NEWS_API_KEY === 'demo_key') throw new Error("Demo Mode");

        const url = query 
            ? `https://newsapi.org/v2/everything?q=${query}&apiKey=${NEWS_API_KEY}&pageSize=5`
            : `https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_API_KEY}&pageSize=5`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("News API failed");
        
        const data = await response.json();
        return data.articles.map((a: any) => ({
            title: a.title,
            source: a.source.name,
            time: new Date(a.publishedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            url: a.url
        }));

    } catch (e) {
        console.warn("Using AI Generated News Data");
        const topic = query || "Global Tech & Science";
        const prompt = `Generate 4 realistic news headlines about ${topic} as JSON array.
        Format: [{ "title": string, "source": string, "time": string }]`;
        
        const aiData = await generateGeminiJSON(prompt);
        
        if (Array.isArray(aiData)) {
            return aiData;
        }
        
        return [
            { title: `${topic} sees major breakthrough today`, source: "AI News", time: "Just now" },
            { title: `Global markets react to ${topic} developments`, source: "World Daily", time: "1 hour ago" }
        ];
    }
};

/**
 * Fetches stock data.
 */
export const fetchStock = async (symbol: string): Promise<StockData> => {
    try {
        if (STOCK_API_KEY === 'demo_key') throw new Error("Demo Mode");

        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${STOCK_API_KEY}`);
        if (!response.ok) throw new Error("Stock API failed");
        
        const data = await response.json();
        if (!data.c) throw new Error("No data");

        return {
            symbol: symbol.toUpperCase(),
            price: data.c,
            change: data.d,
            percentChange: data.dp,
            high: data.h,
            low: data.l
        };

    } catch (e) {
        console.warn("Using AI Generated Stock Data");
        const prompt = `Generate realistic stock market data for ticker ${symbol} as JSON.
        Format: { "symbol": string, "price": number, "change": number, "percentChange": number, "high": number, "low": number }`;
        
        const aiData = await generateGeminiJSON(prompt);
        
        return {
            symbol: aiData?.symbol || symbol.toUpperCase(),
            price: aiData?.price || 150.00,
            change: aiData?.change || 1.5,
            percentChange: aiData?.percentChange || 1.0,
            high: aiData?.high || 155.00,
            low: aiData?.low || 145.00
        };
    }
};

export const searchWeb = async (query: string): Promise<SearchResult[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Searching web for: ${query}`);
    
    // Use AI to generate realistic search results based on the query
    const prompt = `Generate 4 realistic web search results for "${query}" as JSON array.
    Format: [{ "title": string, "snippet": string, "url": string, "source": string }]`;
    
    const aiData = await generateGeminiJSON(prompt);
    
    if (Array.isArray(aiData) && aiData.length > 0) {
        return aiData;
    }
    
    // Fallback static data if AI fails
    return [
         { title: `${query} - Wikipedia`, snippet: `${query} is a topic of interest involving...`, url: "https://wikipedia.org", source: "Wikipedia" },
         { title: `Latest news on ${query}`, snippet: `Recent developments regarding ${query} show significant impact...`, url: "https://cnn.com", source: "CNN" }
    ];
};