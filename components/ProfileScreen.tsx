import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { fileToBase64 } from '../utils';
import Avatar from './Avatar';


interface ProfileScreenProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onUpdateProfile }) => {
  const [headline, setHeadline] = useState(user.headline);
  const [intent, setIntent] = useState(user.intent);
  const [isSaved, setIsSaved] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user.profilePictureUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    let profilePictureUrl = user.profilePictureUrl;
    if (imageFile) {
        try {
            profilePictureUrl = await fileToBase64(imageFile);
        } catch (error) {
            console.error("Error converting image to Base64", error);
            return; // Optionally show an error to the user
        }
    }
    onUpdateProfile({ ...user, headline, intent, profilePictureUrl });
    setIsSaved(true);
    setImageFile(null); // Clear the file state after saving
  };

  useEffect(() => {
    if (isSaved) {
      const timer = setTimeout(() => setIsSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);
  
  // Update local state if the user prop changes
  useEffect(() => {
    setHeadline(user.headline);
    setIntent(user.intent);
    setImagePreview(user.profilePictureUrl || null);
    setImageFile(null); // Reset file input state on user change
  }, [user]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Revoke old object URL to prevent memory leaks
      if (imagePreview && imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const hasChanges = headline !== user.headline || intent !== user.intent || imageFile !== null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row items-center mb-6">
        <div className="relative mb-4 md:mb-0 md:mr-6">
            <Avatar name={user.name} profilePictureUrl={imagePreview || undefined} size="2xl" />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition shadow-md border-2 border-white"
                aria-label="Change profile picture"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
        </div>
        <div>
            <h2 className="text-3xl font-bold text-gray-900 text-center md:text-left">{user.name}</h2>
            <p className="text-gray-600 text-center md:text-left">Edit your profile details below.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
            <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">Your Headline</label>
            <input
                type="text"
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g., Software Engineer, Product Designer"
            />
        </div>

        <div>
            <label htmlFor="intent" className="block text-sm font-medium text-gray-700 mb-1">Your Intent</label>
            <textarea
                id="intent"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                className="w-full h-28 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="What are you here for? e.g., Find a co-founder, Mentor others, Collaborate on projects"
            />
        </div>
        
        <div className="flex items-center justify-end space-x-4">
            {isSaved && <p className="text-green-600 text-sm font-semibold transition-opacity duration-300">Profile updated!</p>}
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="w-40 py-3 px-4 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all"
            >
              Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;