
import { WeatherData, NewsArticle, StockData, SearchResult } from '../types';

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
        console.warn("Using Mock Weather Data");
        const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Clear'];
        const cond = conditions[Math.floor(Math.random() * conditions.length)];
        return {
            location: city || "Unknown Location",
            temp: Math.floor(Math.random() * 15) + 20, 
            condition: cond,
            icon: '', 
            humidity: 65,
            windSpeed: 12
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
        console.warn("Using Mock News Data");
        const topic = query || "Global";
        return [
            { title: `${topic} Markets hit all-time high amidst positive global signals`, source: "Finance Daily", time: "10:30 AM" },
            { title: `New breakthrough in ${topic} technology announced today`, source: "TechCrunch", time: "09:15 AM" },
            { title: `Local updates: Key developments in ${topic} sector`, source: "The Times", time: "08:00 AM" },
            { title: "Global weather patterns shifting unexpectedly", source: "Nature Journal", time: "Yesterday" }
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
        console.warn("Using Mock Stock Data");
        const base = Math.random() * 1000 + 100;
        const change = (Math.random() * 20) - 10;
        return {
            symbol: symbol.toUpperCase(),
            price: parseFloat(base.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            percentChange: parseFloat((change / base * 100).toFixed(2)),
            high: parseFloat((base + 10).toFixed(2)),
            low: parseFloat((base - 10).toFixed(2))
        };
    }
};

export const searchWeb = async (query: string): Promise<SearchResult[]> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(`Searching web for: ${query}`);
    
    const results: SearchResult[] = [];
    
    if (query.toLowerCase().includes("phone") || query.toLowerCase().includes("iphone") || query.toLowerCase().includes("samsung")) {
        results.push({ title: "Best Smartphones 2024 - TechRadar", snippet: "The best phones right now including iPhone 15 Pro, Samsung S24 Ultra...", url: "https://techradar.com", source: "TechRadar" });
        results.push({ title: "Smartphone Reviews & Ratings", snippet: "Comprehensive reviews of the latest mobile devices...", url: "https://gsmarena.com", source: "GSMArena" });
    } else if (query.toLowerCase().includes("laptop") || query.toLowerCase().includes("macbook")) {
         results.push({ title: "Best Laptops of 2024", snippet: "Our picks for the best laptops you can buy...", url: "https://theverge.com", source: "The Verge" });
    } else {
         results.push({ title: `${query} - Wikipedia`, snippet: `${query} is a topic of interest involving...`, url: "https://wikipedia.org", source: "Wikipedia" });
         results.push({ title: `Latest news on ${query}`, snippet: `Recent developments regarding ${query} show significant impact...`, url: "https://cnn.com", source: "CNN" });
    }
    
    return results;
};
