import React, { useState, useEffect } from 'react';
import { User, Tribe } from '../types';
import Avatar from './Avatar';

interface DiscoverScreenProps {
  currentUser: User;
  people: User[];
  tribes: Tribe[];
  onConnect: (person: User) => void;
  connections: User[];
  onViewProfile: (person: User) => void;
  onOpenChat: (person: User) => void;
}

const DiscoverScreen: React.FC<DiscoverScreenProps> = ({ currentUser, people, tribes, onConnect, connections, onViewProfile, onOpenChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<User[]>([]);
  
  const isConnected = (personId: string) => connections.some(c => c.id === personId);

  useEffect(() => {
    if (!currentUser) return;
    
    // Simple recommendation logic based on shared keywords in headline and intent.
    const getRecommendations = () => {
      // Create a set of significant words from the current user's profile.
      const currentUserWords = new Set(
        `${currentUser.headline} ${currentUser.intent}`
          .toLowerCase()
          .replace(/[.,]/g, '') // remove basic punctuation
          .split(/\s+/)
          .filter(word => word.length > 3) // Ignore short/common words
      );
      
      // Filter out some very common words to improve relevance
      const stopWords = new Set(['and', 'the', 'for', 'with', 'new', 'connect', 'people']);
      stopWords.forEach(word => currentUserWords.delete(word));

      const scoredPeople = people
        .map(person => {
          // Exclude self and existing connections from recommendations
          if (person.id === currentUser.id || isConnected(person.id)) {
            return { person, score: -1 }; 
          }

          const personWords = new Set(
            `${person.headline} ${person.intent}`
              .toLowerCase()
              .replace(/[.,]/g, '')
              .split(/\s+/)
          );
          
          let score = 0;
          for (const word of currentUserWords) {
            if (personWords.has(word)) {
              score++;
            }
          }
          
          return { person, score };
        })
        .filter(item => item.score > 0) // Only include people with at least one match
        .sort((a, b) => b.score - a.score);

      // Set the top 3 recommendations
      setRecommendations(scoredPeople.slice(0, 3).map(item => item.person));
    };

    getRecommendations();
  }, [currentUser, people, connections]);


  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-8">
        
        {/* 'For You' Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">For You</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center text-center transition duration-300 hover:shadow-lg hover:border-blue-500">
                  <div className="cursor-pointer" onClick={() => onViewProfile(item)}>
                    <Avatar name={item.name} profilePictureUrl={item.profilePictureUrl} size="xl" className="mb-3" />
                  </div>
                  <div className="flex-grow flex flex-col justify-center mb-3">
                    <p 
                      className="font-bold text-gray-800 cursor-pointer hover:underline"
                      onClick={() => onViewProfile(item)}
                    >{item.name}</p>
                    <p className="text-sm text-gray-600 ">{item.headline}</p>
                  </div>
                  <div className="w-full mt-auto space-y-2">
                    <button
                        onClick={() => onOpenChat(item)}
                        className="w-full px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition bg-green-500 text-white hover:bg-green-600"
                    >
                        Message
                    </button>
                    <button
                        onClick={() => onConnect(item)}
                        disabled={isConnected(item.id)}
                        className="w-full px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition disabled:cursor-not-allowed
                                bg-blue-600 text-white hover:bg-blue-700 
                                disabled:bg-gray-300 disabled:text-gray-500"
                    >
                        {isConnected(item.id) ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Browse All People Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Browse All People</h2>

          <div className="relative">
            <input
              type="text"
              placeholder="Search for people by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
              </div>
          </div>

          <div className="space-y-4">
            {filteredPeople.length > 0 ? (
              filteredPeople.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between transition duration-200 hover:shadow-md">
                  <div className="flex items-center flex-grow cursor-pointer" onClick={() => onViewProfile(item)}>
                      <Avatar name={item.name} profilePictureUrl={item.profilePictureUrl} size="lg" className="mr-4"/>
                      <div className="flex-grow">
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.headline}</p>
                        <p className="text-xs text-gray-500 mt-1">Intent: <span className="font-medium">{item.intent}</span></p>
                      </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <button
                        onClick={() => onOpenChat(item)}
                        className="px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition bg-green-500 text-white hover:bg-green-600"
                    >
                        Message
                    </button>
                    <button
                        onClick={() => onConnect(item)}
                        disabled={isConnected(item.id)}
                        className="px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition disabled:cursor-not-allowed
                                  bg-blue-600 text-white hover:bg-blue-700 
                                  disabled:bg-gray-300 disabled:text-gray-500"
                    >
                        {isConnected(item.id) ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm">
                  <p>No people found matching "{searchQuery}".</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Explore Tribes</h2>
        <div className="space-y-4">
          {tribes.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm">
              <p className="font-bold text-gray-800">{item.name}</p>
              <p className="text-sm text-gray-600 mb-2">{item.tagline}</p>
              <span className="text-xs text-white bg-green-500 font-semibold px-2 py-1 rounded-full">{item.members} members</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoverScreen;