import React, { useState, useEffect, useCallback } from 'react';
import { User, Message } from '../types';
import { getChatKey } from '../utils';
import Avatar from './Avatar';

interface MessagesScreenProps {
  currentUser: User;
  people: User[];
  onOpenChat: (peer: User) => void;
}

interface Conversation {
  peer: User;
  lastMessage: Message;
  isUnread: boolean;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ currentUser, people, onOpenChat }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadConversations = useCallback(() => {
    const foundConversations: Conversation[] = [];
    
    people.forEach(peer => {
      if (peer.id === currentUser.id) return;

      const chatKey = getChatKey(currentUser.id, peer.id);
      const storedMessages = localStorage.getItem(chatKey);

      if (storedMessages) {
        try {
            const messages: Message[] = JSON.parse(storedMessages);
            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              const lastReadKey = `connectplus_lastread_${chatKey}`;
              const lastReadTimestamp = parseInt(localStorage.getItem(lastReadKey) || '0', 10);

              // A conversation is unread if its last message is newer than the last time
              // the user viewed it, AND the last message was not from the current user.
              const isUnread = lastMessage.ts > lastReadTimestamp && lastMessage.from !== currentUser.name;
              
              foundConversations.push({
                peer: peer,
                lastMessage: lastMessage,
                isUnread,
              });
            }
        } catch(e) {
            console.error("Failed to parse messages for key:", chatKey, e);
        }
      }
    });

    // Sort conversations by the most recent message
    foundConversations.sort((a, b) => b.lastMessage.ts - a.lastMessage.ts);
    
    setConversations(foundConversations);
  }, [currentUser, people]);

  useEffect(() => {
    loadConversations(); // Initial load

    // Listen for storage changes to update conversations in real-time (e.g., from other tabs)
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key && (event.key.startsWith('connectplus_chat_') || event.key.startsWith('connectplus_lastread_'))) {
            loadConversations();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadConversations]);


  const handleDeleteConversation = (peerToDelete: User) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete your conversation with ${peerToDelete.name}? This action cannot be undone.`
    );

    if (isConfirmed) {
      const chatKey = getChatKey(currentUser.id, peerToDelete.id);
      localStorage.removeItem(chatKey);
      setConversations(prev => prev.filter(c => c.peer.id !== peerToDelete.id));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
      {conversations.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm">
            <p>You have no messages yet.</p>
            <p className="text-sm mt-1">Connect with someone to start a conversation.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-200">
            {conversations.map(({ peer, lastMessage, isUnread }) => (
                <li key={peer.id} onClick={() => onOpenChat(peer)} className="p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer group">
                    <div className="flex items-center flex-grow overflow-hidden">
                        <Avatar name={peer.name} profilePictureUrl={peer.profilePictureUrl} size="lg" className="mr-4" />
                        <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div className="overflow-hidden mr-2">
                                    <p className={`font-bold text-gray-800 truncate ${isUnread ? 'font-extrabold' : ''}`}>{peer.name}</p>
                                    <p className={`text-sm truncate ${isUnread ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                                        {lastMessage.from === currentUser.name ? 'You: ' : ''}{lastMessage.text}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                    <p className="text-xs text-gray-500 whitespace-nowrap">{new Date(lastMessage.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    {isUnread && (
                                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full ml-auto mt-1.5" aria-label="Unread message"></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(peer);
                      }}
                      className="ml-4 p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 flex-shrink-0"
                      aria-label={`Delete conversation with ${peer.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                </li>
            ))}
            </ul>
        </div>
      )}
    </div>
  );
};

export default MessagesScreen;