
import React, { useState } from 'react';
import { User } from '../types';
import { getIntroSuggestion } from '../services/geminiService';

interface CoachScreenProps {
  user: User;
  connections: User[];
}

const CoachScreen: React.FC<CoachScreenProps> = ({ user, connections }) => {
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [context, setContext] = useState('');
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetSuggestion = async () => {
    const targetUser = connections.find(c => c.id === targetUserId);
    if (!targetUser) {
        setError("Please select a connection.");
        return;
    }
    
    setIsLoading(true);
    setError('');
    setReply('');

    try {
        const suggestion = await getIntroSuggestion(user, targetUser, context);
        setReply(suggestion);
    } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl mr-4 shadow-md">
          AI
        </div>
        <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Connection Coach</h2>
            <p className="text-gray-600">Craft the perfect introduction message.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
            <label htmlFor="connection" className="block text-sm font-medium text-gray-700 mb-1">Who do you want to message?</label>
            <select
                id="connection"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                disabled={connections.length === 0}
            >
                <option value="">{connections.length > 0 ? 'Select a connection...' : 'No connections available'}</option>
                {connections.map(c => <option key={c.id} value={c.id}>{c.name} - {c.headline}</option>)}
            </select>
        </div>

        <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">Add some context (optional)</label>
            <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="e.g., Mention a shared interest, a past project, or why you want to connect."
            />
        </div>
        
        <button
          onClick={handleGetSuggestion}
          disabled={isLoading || !targetUserId}
          className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          {isLoading ? (
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
            </>
          ) : "Get Suggestion"}
        </button>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {reply && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-md font-semibold text-gray-800 mb-2">Here's a draft:</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{reply}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachScreen;
