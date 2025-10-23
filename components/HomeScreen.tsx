import React, { useState, useRef, useEffect } from 'react';
import { Post, User } from '../types';
import { uid, fileToBase64, calculatePostScore } from '../utils';
import { enhancePost, EnhanceMode, ToneMode, getFeedDigest, getHashtagSuggestions } from '../services/geminiService';
import Avatar from './Avatar';

// New FeedDigest sub-component
const FeedDigest: React.FC<{ posts: Post[], onDismiss: () => void }> = ({ posts, onDismiss }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generateDigest = async () => {
            setIsLoading(true);
            const result = await getFeedDigest(posts);
            setSummary(result);
            setIsLoading(false);
        };
        generateDigest();
    }, [posts]);

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-lg shadow-sm border border-blue-200 relative mb-6">
            <button
                onClick={onDismiss}
                className="absolute top-2 right-2 p-1.5 text-blue-500 hover:bg-blue-200 rounded-full transition"
                aria-label="Dismiss summary"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-md mr-3 shadow-md flex-shrink-0">
                    AI
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">While you were away...</h3>
                    {isLoading ? (
                        <div className="flex items-center text-sm text-gray-500 animate-pulse mt-1">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            ConnectAI is summarizing the highlights...
                        </div>
                    ) : (
                        <p className="text-gray-700 text-sm mt-1">{summary}</p>
                    )}
                </div>
            </div>
        </div>
    );
};


interface HomeScreenProps {
  posts: Post[];
  onCreatePost: (post: Post) => void;
  currentUser: User;
  onLikePost: (postId: string) => void;
  onCommentOnPost: (postId: string, text: string) => void;
  onEditPost: (postId: string, newText: string) => void;
  people: User[];
  lastHomeVisit: number;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ posts, onCreatePost, currentUser, onLikePost, onCommentOnPost, onEditPost, people, lastHomeVisit }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showEditMenu, setShowEditMenu] = useState<string | null>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showToneOptions, setShowToneOptions] = useState(false);

  const [digestPosts, setDigestPosts] = useState<Post[]>([]);
  const [digestDismissed, setDigestDismissed] = useState(false);

  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const [isSuggestingHashtags, setIsSuggestingHashtags] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);


  // Effect for the AI Newsfeed Digest
  useEffect(() => {
    if (digestDismissed) return;

    // Only show digest if the last visit was more than 30 minutes ago
    const thirtyMinutes = 30 * 60 * 1000;
    if (Date.now() - lastHomeVisit < thirtyMinutes && lastHomeVisit !== 0) {
        return;
    }

    const newPosts = posts.filter(p => p.timestamp > lastHomeVisit && p.author !== currentUser.name);
    
    if (newPosts.length > 0) {
        const scoredPosts = newPosts
            .map(post => ({ post, score: calculatePostScore(post) }))
            .sort((a, b) => b.score - a.score);
        
        const topPosts = scoredPosts.slice(0, 2).map(item => item.post);
        
        // Only show digest if there's at least one new interesting post with some engagement
        if (topPosts.length > 0 && scoredPosts[0].score > 0.1) {
            setDigestPosts(topPosts);
        }
    }
  }, [posts, lastHomeVisit, digestDismissed, currentUser.name]);

  // Effect for AI Hashtag suggestions
  useEffect(() => {
    if (text.trim().length < 20) {
        setHashtagSuggestions([]);
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        return;
    }

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    
    const timeoutId = window.setTimeout(async () => {
        setIsSuggestingHashtags(true);
        try {
            const suggestions = await getHashtagSuggestions(text);
            const currentWords = new Set(text.split(/[\s\n]+/));
            const filteredSuggestions = suggestions.filter(s => !currentWords.has(s));
            setHashtagSuggestions(filteredSuggestions);
        } catch (error) {
            console.error("Failed to get hashtag suggestions:", error);
            setHashtagSuggestions([]);
        } finally {
            setIsSuggestingHashtags(false);
        }
    }, 1200); // 1.2 second debounce

    debounceTimeoutRef.current = timeoutId;

    return () => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [text]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editMenuRef.current && !editMenuRef.current.contains(event.target as Node)) {
        setShowEditMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getCommenterAvatar = (authorId: string) => {
    const author = people.find(p => p.id === authorId);
    return author?.profilePictureUrl;
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if(imagePreview) {
        URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  }

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if(videoPreview) {
        URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleRemoveVideo();
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
    if (event.target) {
        event.target.value = ''; // Allow selecting the same file again
    }
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleRemoveImage();
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
    if (event.target) {
        event.target.value = ''; // Allow selecting the same file again
    }
  };
  
  const handlePost = async () => {
    if (!text.trim() && !imageFile && !videoFile) return;
    
    let imageUrl: string | undefined = undefined;
    if (imageFile) {
        try {
            imageUrl = await fileToBase64(imageFile);
        } catch (error) {
            console.error("Error converting image to Base64", error);
            return;
        }
    }

    let videoUrl: string | undefined = undefined;
    if (videoFile) {
        try {
            videoUrl = await fileToBase64(videoFile);
        } catch (error) {
            console.error("Error converting video to Base64", error);
            return;
        }
    }

    onCreatePost({
      id: uid('p'),
      author: currentUser.name,
      text: text.trim(),
      timestamp: Date.now(),
      imageUrl: imageUrl,
      videoUrl: videoUrl,
      likedBy: [],
      comments: [],
    });
    setText('');
    handleRemoveImage();
    handleRemoveVideo();
  };
  
  const handlePostComment = (postId: string) => {
    if (!commentText.trim()) return;
    onCommentOnPost(postId, commentText.trim());
    setCommentText('');
    setActiveCommentBox(null);
  };
  
  const handleStartEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditingText(post.text);
    setShowEditMenu(null);
  };
  
  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingText('');
  };

  const handleSaveEdit = () => {
    if (!editingPostId || !editingText.trim()) return;
    onEditPost(editingPostId, editingText.trim());
    handleCancelEdit();
  };

  const handleEnhanceRequest = async (mode: EnhanceMode | 'tone', tone?: ToneMode) => {
    if (!text.trim()) return;
    setShowToneOptions(false); // Hide tone options after any selection
    setIsEnhancing(true);
    try {
        const enhancedText = await enhancePost(text, mode, tone);
        setText(enhancedText);
    } catch (error) {
        console.error("AI enhancement request failed:", error);
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleAddHashtag = (tagToAdd: string) => {
      setText(prevText => {
          const trimmedText = prevText.trim();
          const words = trimmedText.split(/[\s\n]+/);
          if (words.includes(tagToAdd)) return prevText;

          const lines = trimmedText.split('\n');
          const lastLine = lines[lines.length - 1].trim();
          const lastLineIsHashtags = lastLine.split(' ').every(w => w.startsWith('#') || w === '');
          
          if (lastLineIsHashtags && trimmedText.length > 0) {
              return `${trimmedText} ${tagToAdd}`;
          } else if (trimmedText.length > 0) {
              return `${trimmedText}\n\n${tagToAdd}`;
          } else {
              return tagToAdd;
          }
      });
      setHashtagSuggestions(suggestions => suggestions.filter(s => s !== tagToAdd));
  };


  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Share an update</h2>
        <textarea
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        {imagePreview && (
            <div className="mt-3 relative inline-block">
                <img src={imagePreview} alt="Selected preview" className="rounded-lg max-h-48 w-auto border" />
                <button onClick={handleRemoveImage} className="absolute top-1 right-1 bg-gray-900 bg-opacity-60 text-white rounded-full p-1 leading-none hover:bg-opacity-80 transition" aria-label="Remove image">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        )}
        {videoPreview && (
            <div className="mt-3 relative inline-block">
                <video src={videoPreview} controls className="rounded-lg max-h-48 w-auto border bg-black" />
                <button onClick={handleRemoveVideo} className="absolute top-1 right-1 bg-gray-900 bg-opacity-60 text-white rounded-full p-1 leading-none hover:bg-opacity-80 transition" aria-label="Remove video">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        )}

        {/* AI ASSIST SECTION */}
        {(text.trim() || hashtagSuggestions.length > 0) && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-4">
                {text.trim() && (isEnhancing ? (
                    <div className="flex items-center text-sm text-gray-500 animate-pulse">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ConnectAI is thinking...
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-600 mr-2">AI Assist:</span>
                            <button onClick={() => handleEnhanceRequest('improve')} className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition">
                                ✨ Improve
                            </button>
                            <button onClick={() => setShowToneOptions(!showToneOptions)} className={`px-3 py-1 text-sm font-medium rounded-full text-gray-800 hover:bg-gray-200 transition ${showToneOptions ? 'bg-gray-300' : 'bg-gray-100'}`}>
                                🎨 Tone
                            </button>
                            <button onClick={() => handleEnhanceRequest('hashtags')} className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition">
                                # Hashtags
                            </button>
                        </div>
                        {showToneOptions && (
                            <div className="pl-4 flex items-center gap-2 flex-wrap">
                                <button onClick={() => handleEnhanceRequest('tone', 'professional')} className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition">Professional</button>
                                <button onClick={() => handleEnhanceRequest('tone', 'casual')} className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition">Casual</button>
                                <button onClick={() => handleEnhanceRequest('tone', 'confident')} className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200 transition">Confident</button>
                            </div>
                        )}
                    </div>
                ))}
                 {/* AI Hashtag Suggestions */}
                 {(isSuggestingHashtags || hashtagSuggestions.length > 0) && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                            <span>Suggested Hashtags</span>
                             {isSuggestingHashtags && (
                                <svg className="animate-spin ml-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                        </h4>
                        {!isSuggestingHashtags && hashtagSuggestions.length > 0 && (
                             <div className="flex flex-wrap gap-2">
                                {hashtagSuggestions.map((tag, index) => (
                                    <button
                                        key={`${tag}-${index}`}
                                        onClick={() => handleAddHashtag(tag)}
                                        className="px-3 py-1 text-sm font-medium rounded-full bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors"
                                        aria-label={`Add hashtag ${tag}`}
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
        
        <div className="flex justify-between items-center mt-3">
            <div className="flex items-center">
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
                    aria-label="Add image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
                <input type="file" ref={videoFileInputRef} onChange={handleVideoChange} accept="video/*" className="hidden" />
                <button
                    onClick={() => videoFileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
                    aria-label="Add video"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>
            <button
                onClick={handlePost}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 transition"
                disabled={(!text.trim() && !imageFile && !videoFile) || isEnhancing}
            >
                Post
            </button>
        </div>
      </div>
      
      {digestPosts.length > 0 && !digestDismissed && <FeedDigest posts={digestPosts} onDismiss={() => setDigestDismissed(true)} />}

      <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Feed</h2>
      {posts.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm">
            <p>No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((item) => {
            const isLiked = item.likedBy.includes(currentUser.id);
            const isCommenting = activeCommentBox === item.id;
            const isAuthor = item.author === currentUser.name;
            const isEditing = editingPostId === item.id;
            return (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start justify-between">
                      <div className="flex items-center mb-2 flex-grow">
                          <Avatar name={item.author} profilePictureUrl={item.authorProfilePictureUrl} className="mr-3" />
                          <div>
                            <p className="font-bold text-gray-800">{item.author}</p>
                            <div className="flex items-center text-xs text-gray-500">
                                <span>{new Date(item.timestamp).toLocaleString()}</span>
                                {item.lastEdited && <span className="ml-2">(edited)</span>}
                            </div>
                          </div>
                      </div>
                      {isAuthor && !isEditing && (
                          <div className="relative flex-shrink-0">
                            <button onClick={() => setShowEditMenu(showEditMenu === item.id ? null : item.id)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            {showEditMenu === item.id && (
                              <div ref={editMenuRef} className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg z-10 border">
                                <button onClick={() => handleStartEdit(item)} className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                                   <span>Edit Post</span>
                                </button>
                              </div>
                            )}
                          </div>
                      )}
                  </div>

                  {isEditing ? (
                      <div className="my-3 space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full h-28 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          autoFocus
                        />
                         {item.imageUrl && (
                            <div className="my-3 text-sm text-gray-500">
                                <p>Editing text only. The existing image will be kept.</p>
                                <img src={item.imageUrl} alt="Post attachment" className="mt-2 rounded-lg max-h-[100px] w-auto border opacity-50" />
                            </div>
                        )}
                        {item.videoUrl && (
                            <div className="my-3 text-sm text-gray-500">
                                <p>Editing text only. The existing video will be kept.</p>
                                <video src={item.videoUrl} controls className="mt-2 rounded-lg max-h-[100px] w-auto border opacity-50 bg-black" />
                            </div>
                        )}
                        <div className="flex justify-end space-x-2">
                          <button onClick={handleCancelEdit} className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 transition">
                            Cancel
                          </button>
                          <button onClick={handleSaveEdit} disabled={!editingText.trim() || editingText.trim() === item.text} className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 transition">
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {item.text && <p className="text-gray-700 whitespace-pre-wrap my-3">{item.text}</p>}
                        {item.imageUrl && (
                          <div className="my-3">
                              <img src={item.imageUrl} alt="Post attachment" className="rounded-lg max-h-[500px] w-auto border" />
                          </div>
                        )}
                        {item.videoUrl && (
                          <div className="my-3">
                              <video controls src={item.videoUrl} className="rounded-lg max-h-[500px] w-full border bg-black" />
                          </div>
                        )}
                      </>
                  )}

                  {!isEditing && (
                    <>
                        <div className="mt-4 pt-3 border-t flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                onClick={() => onLikePost(item.id)}
                                className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors duration-200 ${
                                    isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                                }`}
                                aria-pressed={isLiked}
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                </svg>
                                <span>{isLiked ? 'Liked' : 'Like'}</span>
                                </button>
                                <button
                                onClick={() => setActiveCommentBox(isCommenting ? null : item.id)}
                                className="flex items-center space-x-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors duration-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                                    </svg>
                                    <span>Comment</span>
                                </button>
                            </div>
                            <div className="text-sm text-gray-500 flex space-x-4">
                            {item.likedBy.length > 0 && (
                                <span>
                                {item.likedBy.length} {item.likedBy.length === 1 ? 'like' : 'likes'}
                                </span>
                            )}
                            {item.comments.length > 0 && (
                                <span>
                                {item.comments.length} {item.comments.length === 1 ? 'comment' : 'comments'}
                                </span>
                            )}
                            </div>
                        </div>
                        {(isCommenting || item.comments.length > 0) && (
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                                {item.comments.map(comment => (
                                    <div key={comment.id} className="flex items-start space-x-3">
                                        <Avatar name={comment.authorName} profilePictureUrl={getCommenterAvatar(comment.authorId)} size="sm" />
                                        <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                                            <p className="font-semibold text-sm text-gray-800">{comment.authorName}</p>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isCommenting && (
                                    <div className="flex items-start space-x-3 pt-2">
                                        <Avatar name={currentUser.name} profilePictureUrl={currentUser.profilePictureUrl} size="sm" />
                                        <div className="flex-1">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Write a comment..."
                                                className="w-full h-16 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                                                autoFocus
                                                onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handlePostComment(item.id);
                                                }
                                                }}
                                            />
                                            <div className="flex justify-end mt-1">
                                                <button
                                                    onClick={() => handlePostComment(item.id)}
                                                    disabled={!commentText.trim()}
                                                    className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-blue-300 transition"
                                                >
                                                    Post
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                  )}
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HomeScreen;