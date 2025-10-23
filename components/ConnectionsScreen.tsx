import React from 'react';
import { User } from '../types';
import Avatar from './Avatar';

interface ConnectionsScreenProps {
  connections: User[];
  onOpenChat: (peer: User) => void;
  onViewProfile: (peer: User) => void;
}

const ConnectionsScreen: React.FC<ConnectionsScreenProps> = ({ connections, onOpenChat, onViewProfile }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Your Connections ({connections.length})</h2>
      {connections.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm">
            <p>You haven't made any connections yet.</p>
            <p className="text-sm mt-1">Head over to the Discover page to find people to connect with.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-200">
            {connections.map((item) => {
                return (
                    <li key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex items-center flex-grow cursor-pointer min-w-0" onClick={() => onViewProfile(item)}>
                            <Avatar name={item.name} profilePictureUrl={item.profilePictureUrl} size="lg" className="mr-4" />
                            <div className="flex-grow min-w-0">
                                <p className="font-bold text-gray-800 truncate">{item.name}</p>
                                <p className="text-sm text-gray-600 truncate">{item.headline}</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent profile view from triggering
                                onOpenChat(item);
                            }}
                            className="px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition bg-green-500 text-white hover:bg-green-600 ml-4 flex-shrink-0"
                        >
                            Message
                        </button>
                    </li>
                );
            })}
            </ul>
        </div>
      )}
    </div>
  );
};

export default ConnectionsScreen;