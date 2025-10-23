import { GoogleGenAI } from "@google/genai";
import { User, Post } from '../types';

export const getIntroSuggestion = async (currentUser: User, targetUser: User, context: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `You are an expert networking coach named 'ConnectAI'. 
    Your goal is to help users write friendly, concise, and professional introduction messages to connect with others.
    The message should be authentic and encourage a response.
    Do not use overly corporate or cliché phrases.
    Keep the message under 75 words.
    Do not add any preamble, just return the message text.`;

    const prompt = `
    My name is ${currentUser.name} and I'm a ${currentUser.headline}.
    I want to connect with ${targetUser.name}, who is a ${targetUser.headline}.
    Their stated intent is: "${targetUser.intent}".
    
    Here's some additional context from me: "${context}"

    Please draft a warm and professional opening message for me to send to ${targetUser.name}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Sorry, I couldn't generate a suggestion at this time. Please try again later.";
    }
};

export type EnhanceMode = 'improve' | 'hashtags';
export type ToneMode = 'professional' | 'casual' | 'confident';

export const enhancePost = async (text: string, mode: EnhanceMode | 'tone', tone?: ToneMode): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let systemInstruction = "You are 'ConnectAI', an expert writing assistant for a professional social network. Your goal is to help users improve their posts.";
    let prompt = "";

    switch (mode) {
        case 'improve':
            prompt = `Proofread and improve the clarity, grammar, and impact of the following post, while preserving its original meaning. Only return the improved text.\n\nPost:\n"${text}"`;
            break;
        case 'hashtags':
            prompt = `Generate 3 to 5 relevant hashtags for the following post. Return only the hashtags, separated by spaces (e.g., #professionaldevelopment #networking #tech).\n\nPost:\n"${text}"`;
            break;
        case 'tone':
            if (!tone) throw new Error("Tone must be specified for 'tone' mode.");
            systemInstruction += ` You will rewrite the user's post in a more ${tone} tone.`;
            prompt = `Rewrite the following post in a more ${tone} tone. Only return the rewritten text.\n\nPost:\n"${text}"`;
            break;
        default:
            throw new Error("Invalid enhancement mode.");
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
            },
        });
        
        const result = response.text.trim();

        if (mode === 'hashtags') {
            // Append hashtags to the original text, ensuring no double newlines if text is empty.
            return text ? `${text}\n\n${result}` : result;
        }
        
        // For improve and tone, replace the text
        return result;

    } catch (error) {
        console.error("Error calling Gemini API for post enhancement:", error);
        // Return original text on failure to prevent data loss.
        return text;
    }
};

export const getFeedDigest = async (posts: Post[]): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `You are 'ConnectAI', a friendly AI assistant for a professional network. Your task is to create a brief, engaging summary of recent popular posts to show users what they've missed.
    - Be encouraging and positive.
    - Mention the authors by name.
    - Keep it concise, under 50 words.
    - Do not use hashtags.
    - Do not add a greeting or preamble. Just return the summary.
    - Example: "There's a lot of great conversation happening! Ajia Abdulrasaq shared an update on a new project, and another user is asking for book recommendations."`;
    
    const postsContent = posts.map(p => `- A post by ${p.author}: "${p.text.substring(0, 150)}..."`).join('\n');

    const prompt = `Here are some of the top posts you've missed:\n${postsContent}\n\nCreate a friendly summary of what's been happening.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for feed digest:", error);
        return "Couldn't generate a summary right now. Check out the latest posts below!";
    }
};

export const getHashtagSuggestions = async (text: string): Promise<string[]> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set");
        return [];
    }
    // Return early if text is too short to provide meaningful suggestions
    if (text.trim().length < 20) {
        return [];
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = "You are 'ConnectAI', an expert social media assistant. Your goal is to suggest relevant hashtags for a professional network post.";
    const prompt = `Generate 3 to 5 relevant hashtags for the following post. Return ONLY the hashtags, separated by spaces (e.g., #professionaldevelopment #networking #tech). Do not include any other text, preamble, or formatting.\n\nPost:\n"${text}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
            },
        });
        
        const result = response.text.trim();
        if (!result) return [];

        // Clean up and split the string of hashtags into an array
        return result
            .split(/\s+/)
            .filter(tag => tag.startsWith('#') && tag.length > 1); // Ensure it's a valid hashtag

    } catch (error) {
        console.error("Error calling Gemini API for hashtag suggestions:", error);
        return [];
    }
};