import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, Message } from '../types';
import { uid, getChatKey } from '../utils';
import * as api from '../services/apiService';
import Avatar from './Avatar';

interface ChatScreenProps {
  peer: User;
  currentUser: User;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ peer, currentUser }) => {
  const chatKey = getChatKey(currentUser.id, peer.id);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const loadMessages = useCallback(async () => {
    try {
      const messages = await api.fetchMessages(chatKey, peer.name);
      setMsgs(messages);
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      setIsLoading(false);
    }
  }, [chatKey, peer.name]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Polling for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
        const latestMessages = await api.fetchMessages(chatKey, peer.name);
        // Only update state if there's a new message to avoid re-renders
        if (latestMessages.length !== msgs.length) {
            setMsgs(latestMessages);
        }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [chatKey, peer.name, msgs.length]);


  useEffect(scrollToBottom, [msgs]);

  const handleSend = async () => {
    if (!text.trim()) return;
    
    const newMessage: Message = { id: uid('m'), from: currentUser.name, text: text.trim(), ts: Date.now() };
    
    // Optimistic update
    setMsgs([...msgs, newMessage]); 
    setText('');

    try {
        await api.sendMessage(chatKey, newMessage);
    } catch(e) {
        console.error("Failed to send message", e);
        // Revert on failure
        setMsgs(msgs.filter(m => m.id !== newMessage.id));
        alert("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b flex items-center">
        <Avatar name={peer.name} profilePictureUrl={peer.profilePictureUrl} size="lg" className="mr-4"/>
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-900">Chat with {peer.name}</h2>
          <p className="text-sm text-gray-500">{peer.headline}</p>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
        {isLoading ? (
            <div className="flex justify-center items-center h-full">
                 <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        ) : (
            msgs.map((item, index) => {
                const isFromCurrentUser = item.from === currentUser.name;
                const author = isFromCurrentUser ? currentUser : peer;
                const showAvatar = index === 0 || msgs[index - 1].from !== item.from;

                return (
                  <div key={item.id} className={`flex items-end gap-2 ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      {!isFromCurrentUser && (
                          <div className="w-8">
                              {showAvatar && <Avatar name={author.name} profilePictureUrl={author.profilePictureUrl} size="sm" />}
                          </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${isFromCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                        {showAvatar && <p className="font-bold text-sm mb-1">{item.from}</p>}
                        <p>{item.text}</p>
                        <p className={`text-xs mt-2 text-right ${isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>{new Date(item.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                      </div>
                       {isFromCurrentUser && (
                          <div className="w-8">
                             {showAvatar && <Avatar name={author.name} profilePictureUrl={author.profilePictureUrl} size="sm" />}
                          </div>
                      )}
                  </div>
                );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <button
            onClick={handleSend}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 disabled:bg-blue-300 transition"
            disabled={!text.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;