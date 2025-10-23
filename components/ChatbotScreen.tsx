import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import Avatar from './Avatar';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const ChatbotScreen: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'model',
            text: "Hi! I'm ConnectAI, your personal career and networking coach. How can I help you today? You can ask me for career advice, to practice interviews, or to brainstorm ideas."
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize the chat session when the component mounts
        try {
            if (!process.env.API_KEY) {
                throw new Error("API key is not configured.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const chatSession = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: "You are 'ConnectAI', a friendly and expert career and networking coach. Your goal is to provide helpful, encouraging, and actionable advice. Keep your responses concise and easy to understand. Use formatting like bullet points when appropriate.",
                }
            });
            chatRef.current = chatSession;
        } catch (e: any) {
            console.error("Failed to initialize AI Chat:", e);
            setError("Sorry, the AI chatbot could not be started. Please check the configuration.");
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || isLoading || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', text: inputText.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await chatRef.current.sendMessage({ message: userMessage.text });
            const modelMessage: ChatMessage = { role: 'model', text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (e) {
            console.error("Error sending message to Gemini:", e);
            setError("Sorry, something went wrong. Please try again.");
            // Optional: remove the user's message if the API call fails to allow retry
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl mr-4 shadow-md flex-shrink-0">
                    AI
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">AI Chatbot</h2>
                    <p className="text-sm text-gray-500">Your personal career coach</p>
                </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 flex-shrink-0">
                                <Avatar name="AI" />
                            </div>
                        )}
                        <div className={`max-w-md lg:max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 flex-shrink-0">
                            <Avatar name="AI" />
                        </div>
                        <div className="max-w-md lg:max-w-lg p-3 rounded-lg bg-gray-200 text-gray-800">
                             <div className="flex items-center space-x-1 text-gray-500">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                 )}
                 {error && (
                    <div className="flex justify-center">
                        <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm">{error}</p>
                    </div>
                 )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white">
                <div className="flex items-center gap-4">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Ask for career advice..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 transition"
                        disabled={!inputText.trim() || isLoading}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatbotScreen;