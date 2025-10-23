import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, Message } from '../types';
import { uid, getChatKey, getTypingKey, formatUserActivity } from '../utils';
import Avatar from './Avatar';

interface ChatScreenProps {
  peer: User;
  currentUser: User;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ peer, currentUser }) => {
  const chatKey = getChatKey(currentUser.id, peer.id);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const { text: activityText, isOnline } = formatUserActivity(peer.lastActive);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Load messages from localStorage or create an initial conversation
  const loadMessages = useCallback(() => {
    const storedMessages = localStorage.getItem(chatKey);
    if (storedMessages) {
      setMsgs(JSON.parse(storedMessages));
    } else {
      const initialMsg: Message = { id: uid('m'), from: peer.name, text: 'Hey — nice to connect!', ts: Date.now() };
      const initialHistory = [initialMsg];
      setMsgs(initialHistory);
      localStorage.setItem(chatKey, JSON.stringify(initialHistory));
    }
  }, [chatKey, peer.name]);

  // Effect to load messages on component mount and mark as read
  useEffect(() => {
    loadMessages();
    const lastReadKey = `connectplus_lastread_${chatKey}`;
    localStorage.setItem(lastReadKey, Date.now().toString());
  }, [loadMessages, chatKey]);

  // Effect to listen for real-time updates from other tabs/windows and keep read status current
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the change is for our current chat window
      if (event.key === chatKey && event.newValue) {
         setMsgs(JSON.parse(event.newValue));
         // If a new message arrives from another tab, this tab is now up-to-date
         const lastReadKey = `connectplus_lastread_${chatKey}`;
         localStorage.setItem(lastReadKey, Date.now().toString());
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [chatKey]);

  // Effect to listen for peer typing status
  useEffect(() => {
    const peerTypingKey = getTypingKey(chatKey, peer.id);
    const interval = setInterval(() => {
      const typingTimestamp = localStorage.getItem(peerTypingKey);
      if (typingTimestamp && Date.now() - parseInt(typingTimestamp, 10) < 3000) {
        setIsPeerTyping(true);
      } else {
        setIsPeerTyping(false);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [chatKey, peer.id]);


  // Effect to scroll to the bottom when new messages are added
  useEffect(scrollToBottom, [msgs]);

  const handleSend = () => {
    if (!text.trim()) return;
    
    // Create the new message object
    const newMessage: Message = { id: uid('m'), from: currentUser.name, text: text.trim(), ts: Date.now() };
    const updatedMsgs = [...msgs, newMessage];
    
    // Update state for immediate feedback in the current tab
    setMsgs(updatedMsgs); 
    
    // Persist to localStorage to trigger the 'storage' event for other tabs
    localStorage.setItem(chatKey, JSON.stringify(updatedMsgs));
    
    // Clear typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    localStorage.removeItem(getTypingKey(chatKey, currentUser.id));

    // Clear the input field
    setText('');
  };

  const handleTyping = (newText: string) => {
    setText(newText);
    const typingKey = getTypingKey(chatKey, currentUser.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    localStorage.setItem(typingKey, Date.now().toString());

    typingTimeoutRef.current = window.setTimeout(() => {
      localStorage.removeItem(typingKey);
    }, 2500); // Considered "stopped" after 2.5 seconds
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b flex items-center">
        <Avatar name={peer.name} profilePictureUrl={peer.profilePictureUrl} size="lg" className="mr-4"/>
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-900">Chat with {peer.name}</h2>
          <p className="text-sm text-gray-500">{peer.headline}</p>
          {activityText && (
            <div className="flex items-center mt-1.5">
              {isOnline && <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>}
              <p className={`text-xs ${isOnline ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>{activityText}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
        {msgs.map((item, index) => {
            const isFromCurrentUser = item.from === currentUser.name;
            const author = isFromCurrentUser ? currentUser : peer;
            // Show avatar only for the first message in a block from the same user
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
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 h-6 text-sm text-gray-500 italic flex items-center">
          {isPeerTyping && (
             <div className="flex items-center space-x-1 text-gray-500">
                <span>{peer.name} is typing</span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          )}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-4">
          <input
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
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