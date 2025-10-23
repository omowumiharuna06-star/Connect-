import React from 'react';
import { User } from '../types';
import Avatar from './Avatar';

interface ViewProfileScreenProps {
  profileUser: User;
  currentUser: User;
  connections: User[];
  onConnect: (user: User) => void;
}

const ViewProfileScreen: React.FC<ViewProfileScreenProps> = ({ profileUser, currentUser, connections, onConnect }) => {
  const isConnected = connections.some(c => c.id === profileUser.id);
  const isSelf = currentUser.id === profileUser.id;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center mb-6">
        <Avatar name={profileUser.name} profilePictureUrl={profileUser.profilePictureUrl} size="2xl" className="mb-4 shadow-md" />
        <h2 className="text-3xl font-bold text-gray-900">{profileUser.name}</h2>
        <p className="text-lg text-gray-600 mt-1">{profileUser.headline}</p>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg border">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Intent</label>
          <p className="text-gray-800">{profileUser.intent}</p>
        </div>
        
        {!isSelf && (
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => onConnect(profileUser)}
              disabled={isConnected}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 transition-all"
            >
              {isConnected ? 'Connected' : 'Connect'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewProfileScreen;