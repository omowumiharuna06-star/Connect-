import React, { useState, useEffect, useMemo } from 'react';
import { Page, User, Post, Tribe, Message, Comment, Task } from './types';
import { starterUsers, starterTribes } from './constants';
import SignInScreen from './components/SignInScreen';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import DiscoverScreen from './components/DiscoverScreen';
import ConnectionsScreen from './components/ConnectionsScreen';
import MessagesScreen from './components/MessagesScreen';
import ChatScreen from './components/ChatScreen';
import CoachScreen from './components/CoachScreen';
import ChatbotScreen from './components/ChatbotScreen';
import AdminScreen from './components/AdminScreen';
import ProfileScreen from './components/ProfileScreen';
import AboutScreen from './components/AboutScreen';
import ViewProfileScreen from './components/ViewProfileScreen';
import TasksScreen from './components/TasksScreen';
import { uid } from './utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<User[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [activity, setActivity] = useState<Record<string, number>>({});
  
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [activeChatPeer, setActiveChatPeer] = useState<User | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [lastHomeVisit, setLastHomeVisit] = useState<number>(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('connectplus_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedConnections = localStorage.getItem('connectplus_connections');
     if (storedConnections) {
      setConnections(JSON.parse(storedConnections));
    }
    const storedPeople = localStorage.getItem('connectplus_people');
    if (storedPeople) {
      // Backward compatibility for isDisabled and createdAt flags
      const parsedPeople = JSON.parse(storedPeople).map((p: any) => ({
          ...p,
          isDisabled: p.isDisabled || false,
          createdAt: p.createdAt || Date.now() 
        }));
      setPeople(parsedPeople);
    } else {
      setPeople(starterUsers);
    }
     const storedTribes = localStorage.getItem('connectplus_tribes');
    if (storedTribes) {
      setTribes(JSON.parse(storedTribes));
    } else {
      setTribes(starterTribes);
    }
    const storedPosts = localStorage.getItem('connectplus_posts');
    if (storedPosts) {
      // Ensure old posts without certain properties get default values for compatibility
      const parsedPosts: Post[] = JSON.parse(storedPosts).map((post: any) => ({
        ...post,
        likedBy: post.likedBy || [],
        comments: post.comments || [],
        authorProfilePictureUrl: post.authorProfilePictureUrl || undefined,
        lastEdited: post.lastEdited || undefined,
        videoUrl: post.videoUrl || undefined,
      }));
      setPosts(parsedPosts);
    }
    const storedTasks = localStorage.getItem('connectplus_tasks');
    if (storedTasks) {
        // Compatibility for old tasks
        const parsedTasks = JSON.parse(storedTasks).map((task: any) => ({
            ...task,
            priority: task.priority || 'Medium',
        }));
        setTasks(parsedTasks);
    }
    const storedLastHomeVisit = localStorage.getItem('connectplus_lastHomeVisit');
    if (storedLastHomeVisit) {
        setLastHomeVisit(JSON.parse(storedLastHomeVisit));
    }
  }, []);

  // Persist the list of all people to localStorage whenever it changes
  useEffect(() => {
    // This check prevents overwriting stored data with an empty array on initial load
    if (people.length > 0 || localStorage.getItem('connectplus_people')) {
      localStorage.setItem('connectplus_people', JSON.stringify(people));
    }
  }, [people]);

  useEffect(() => {
    localStorage.setItem('connectplus_posts', JSON.stringify(posts));
  }, [posts]);
  
  useEffect(() => {
    localStorage.setItem('connectplus_tribes', JSON.stringify(tribes));
  }, [tribes]);

  useEffect(() => {
    localStorage.setItem('connectplus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Effect to update the current user's own activity timestamp
  useEffect(() => {
    if (user) {
      const userActivityKey = `connectplus_activity_${user.id}`;
      const updateUserActivity = () => {
        const now = Date.now();
        localStorage.setItem(userActivityKey, now.toString());
        setActivity(prev => ({ ...prev, [user.id]: now }));
      };

      updateUserActivity(); // Update immediately
      const activityInterval = setInterval(updateUserActivity, 60 * 1000); // And every minute

      return () => clearInterval(activityInterval);
    }
  }, [user]);

  // Effect to poll for all users' activity data from localStorage
  useEffect(() => {
    const fetchAllActivity = () => {
      const newActivity: Record<string, number> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('connectplus_activity_')) {
          const userId = key.replace('connectplus_activity_', '');
          const timestamp = localStorage.getItem(key);
          if (timestamp) {
            newActivity[userId] = parseInt(timestamp, 10);
          }
        }
      }
      setActivity(prev => ({...prev, ...newActivity}));
    };

    fetchAllActivity(); // Initial fetch
    const pollInterval = setInterval(fetchAllActivity, 30 * 1000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // Memoize enriched user lists to avoid unnecessary re-renders
  const enrichedPeople = useMemo(() => {
    return people.map(p => ({
      ...p,
      lastActive: activity[p.id],
    }));
  }, [people, activity]);

  const enrichedConnections = useMemo(() => {
    return connections.map(c => ({
      ...c,
      lastActive: activity[c.id],
    }));
  }, [connections, activity]);

  const disabledUserNames = useMemo(() => {
    return new Set(people.filter(p => p.isDisabled).map(p => p.name));
  }, [people]);

  const visiblePosts = useMemo(() => {
    return posts.filter(post => !disabledUserNames.has(post.author));
  }, [posts, disabledUserNames]);


  const handleSignIn = (name: string, password?: string) => {
    const existingUser = people.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (existingUser) {
      // Prevent disabled users from logging in
      if (existingUser.isDisabled) {
        alert("Your account has been disabled. Please contact an administrator.");
        return;
      }
      // User exists, check password
      if (existingUser.password && existingUser.password !== password) {
        alert("Incorrect password. Please try again.");
        return;
      }
      // If user exists but has no password (legacy user) or password is correct, sign them in
      setUser(existingUser);
      localStorage.setItem('connectplus_user', JSON.stringify(existingUser));
    } else {
      // New user registration
      if (!password) {
        alert("A password is required to create a new account.");
        return;
      }
      
      const isAdmin = name.toLowerCase() === 'ajia abdulrasaq';
      const newUser: User = {
        id: uid('u'),
        name: name,
        headline: isAdmin ? 'Founder & Admin' : 'New to Connect+',
        intent: 'Connect',
        isAdmin: isAdmin,
        profilePictureUrl: undefined,
        password: password, // Store password for new user
        isDisabled: false,
        createdAt: Date.now(),
      };
      
      setUser(newUser);
      localStorage.setItem('connectplus_user', JSON.stringify(newUser));
      setPeople(prevPeople => [newUser, ...prevPeople]);
    }
  };

  const handleResetPassword = (name: string, newPassword: string): boolean => {
    const userToUpdate = people.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!userToUpdate) {
        alert("No account found with that name.");
        return false;
    }
    if (userToUpdate.isDisabled) {
        alert("This account is disabled and its password cannot be reset.");
        return false;
    }
    if (!userToUpdate.password) {
        alert("This account was created without a password and cannot be reset.");
        return false;
    }

    const updatedUser = { ...userToUpdate, password: newPassword };

    setPeople(prevPeople => prevPeople.map(p => p.id === updatedUser.id ? updatedUser : p));
    setConnections(prevConnections => prevConnections.map(c => c.id === updatedUser.id ? updatedUser : c));
    
    alert("Your password has been successfully reset. You can now sign in with your new password.");
    return true;
  };

  const handleSignOut = () => {
    setUser(null);
    setConnections([]);
    localStorage.removeItem('connectplus_user');
    localStorage.removeItem('connectplus_connections');
    setCurrentPage(Page.HOME);
  };

  const handleCreatePost = (p: Post) => {
    if (!user || user.isDisabled) return;
    const postWithAuthorPic = { ...p, authorProfilePictureUrl: user.profilePictureUrl };
    setPosts([postWithAuthorPic, ...posts]);
  };

  const handleEditPost = (postId: string, newText: string) => {
    if (!user || user.isDisabled) return;
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, text: newText, lastEdited: Date.now() };
        }
        return post;
      })
    );
  };

  const handleLikePost = (postId: string) => {
    if (!user || user.isDisabled) return;
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const likedByCurrentUser = post.likedBy.includes(user.id);
          const newLikedBy = likedByCurrentUser
            ? post.likedBy.filter(id => id !== user.id) // Unlike
            : [...post.likedBy, user.id]; // Like
          return { ...post, likedBy: newLikedBy };
        }
        return post;
      })
    );
  };

  const handleCommentOnPost = (postId: string, text: string) => {
    if (!user || user.isDisabled) return;

    const newComment: Comment = {
      id: uid('c'),
      authorId: user.id,
      authorName: user.name,
      text: text,
      timestamp: Date.now(),
    };

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          // Add the new comment to the existing comments array
          const updatedComments = [...post.comments, newComment];
          return { ...post, comments: updatedComments };
        }
        return post;
      })
    );
  };

  const handleAdminDeletePost = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  };

  const handleConnect = (p: User) => {
    if (connections.find(c => c.id === p.id) || p.id === user?.id || p.isDisabled) return;
    const newConnections = [p, ...connections];
    setConnections(newConnections);
    localStorage.setItem('connectplus_connections', JSON.stringify(newConnections));
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('connectplus_user', JSON.stringify(updatedUser));
    setPeople(prevPeople => prevPeople.map(p => p.id === updatedUser.id ? updatedUser : p));
    setConnections(prevConnections => prevConnections.map(c => c.id === updatedUser.id ? updatedUser : c));

    // Also update author pic on existing posts
    setPosts(prevPosts => prevPosts.map(p => {
        if (p.author === updatedUser.name) {
            return { ...p, authorProfilePictureUrl: updatedUser.profilePictureUrl };
        }
        return p;
    }));
  };

  const handleAdminUpdateUser = (updatedUser: User) => {
    setPeople(prevPeople => prevPeople.map(p => p.id === updatedUser.id ? updatedUser : p));
    setConnections(prevConnections => prevConnections.map(c => c.id === updatedUser.id ? updatedUser : c));
    if (user?.id === updatedUser.id) {
        setUser(updatedUser);
        localStorage.setItem('connectplus_user', JSON.stringify(updatedUser));
    }
  };

  const handleAdminUpdateTribe = (updatedTribe: Tribe) => {
    setTribes(prevTribes => prevTribes.map(t => t.id === updatedTribe.id ? updatedTribe : t));
  };

  const handleCreateTask = (text: string, dueDate: string, priority: 'High' | 'Medium' | 'Low') => {
    const newTask: Task = {
      id: uid('t'),
      text: text,
      isCompleted: false,
      timestamp: Date.now(),
      dueDate: dueDate || undefined,
      priority: priority,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };
  
  const handleToggleTask = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };
  
  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
  
  const handleNavigate = (page: Page) => {
      // When navigating to home, update the visit timestamp
      if (page === Page.HOME) {
        const now = Date.now();
        setLastHomeVisit(now);
        localStorage.setItem('connectplus_lastHomeVisit', JSON.stringify(now));
      }
      setActiveChatPeer(null);
      setViewingProfile(null);
      setCurrentPage(page);
  }

  const handleOpenChat = (peer: User) => {
      setActiveChatPeer(peer);
      setCurrentPage(Page.CHAT);
  }

  const handleViewProfile = (profileToView: User) => {
    setViewingProfile(profileToView);
    setCurrentPage(Page.VIEW_PROFILE);
  }

  const renderContent = () => {
    if (activeChatPeer) {
        const peerWithActivity = enrichedPeople.find(p => p.id === activeChatPeer.id) || activeChatPeer;
        return <ChatScreen peer={peerWithActivity} currentUser={user!} />;
    }
    const homeScreenProps = {
        posts: visiblePosts,
        onCreatePost: handleCreatePost,
        currentUser: user!,
        onLikePost: handleLikePost,
        onCommentOnPost: handleCommentOnPost,
        onEditPost: handleEditPost,
        people: people,
        lastHomeVisit: lastHomeVisit,
    };

    const adminScreenProps = {
        people: people,
        tribes: tribes,
        posts: posts,
        onUpdateUser: handleAdminUpdateUser,
        onUpdateTribe: handleAdminUpdateTribe,
        onDeletePost: handleAdminDeletePost,
    };

    switch(currentPage) {
        case Page.HOME:
            return <HomeScreen {...homeScreenProps} />;
        case Page.DISCOVER:
            const discoverablePeople = enrichedPeople.filter(p => p.id !== user?.id);
            return <DiscoverScreen currentUser={user!} people={discoverablePeople} tribes={tribes} onConnect={handleConnect} connections={connections} onViewProfile={handleViewProfile} />;
        case Page.CONNECTIONS:
            return <ConnectionsScreen connections={enrichedConnections} onOpenChat={handleOpenChat} onViewProfile={handleViewProfile} />;
        case Page.MESSAGES:
            return <MessagesScreen currentUser={user!} people={people} onOpenChat={handleOpenChat} />;
        case Page.COACH:
            return <CoachScreen user={user!} connections={connections} />;
        case Page.CHATBOT:
            return <ChatbotScreen />;
        case Page.TASKS:
            return <TasksScreen tasks={tasks} onCreateTask={handleCreateTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />;
        case Page.PROFILE:
            return <ProfileScreen user={user!} onUpdateProfile={handleUpdateProfile} />;
        case Page.ABOUT:
            return <AboutScreen />;
        case Page.ADMIN:
            return user?.isAdmin ? <AdminScreen {...adminScreenProps} /> : <HomeScreen {...homeScreenProps} />;
        case Page.VIEW_PROFILE:
            if (viewingProfile) {
              const profileWithActivity = enrichedPeople.find(p => p.id === viewingProfile.id) || viewingProfile;
              return <ViewProfileScreen profileUser={profileWithActivity} onConnect={handleConnect} connections={connections} currentUser={user!} />;
            }
            // Fallback to Discover if no profile is being viewed
            setCurrentPage(Page.DISCOVER);
            return null;
        case Page.CHAT: // Should be handled by activeChatPeer, but as a fallback
             if(connections.length > 0) {
                const peerWithActivity = enrichedConnections.find(c => c.id === connections[0].id) || connections[0];
                return <ChatScreen peer={peerWithActivity} currentUser={user!} />;
             }
             return <MessagesScreen currentUser={user!} people={people} onOpenChat={handleOpenChat} />;
        default:
            return <HomeScreen {...homeScreenProps} />;
    }
  }

  if (!user) {
    return <SignInScreen onSignIn={handleSignIn} onResetPassword={handleResetPassword} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
        <Header user={user} onNavigate={handleNavigate} onSignOut={handleSignOut} currentPage={currentPage}/>
        <main className="max-w-4xl mx-auto p-4 md:p-6">
            {renderContent()}
        </main>
    </div>
  );
}