import React, { useState, useEffect, useMemo } from 'react';
import { Page, User, Post, Tribe, Message, Comment, Task } from './types';
import * as api from './services/apiService';
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
import { uid, getChatKey } from './utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<User[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [activeChatPeer, setActiveChatPeer] = useState<User | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [lastHomeVisit, setLastHomeVisit] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);

  // Initial data loading from the API service
  useEffect(() => {
    const loadInitialData = async (currentUser: User) => {
      setIsLoading(true);
      try {
        const [peopleData, tribesData, postsData, tasksData, connectionsData] = await Promise.all([
          api.fetchUsers(),
          api.fetchTribes(),
          api.fetchPosts(),
          api.fetchTasks(),
          api.fetchConnections(currentUser.id),
        ]);
        setPeople(peopleData);
        setTribes(tribesData);
        setPosts(postsData);
        setTasks(tasksData);
        setConnections(connectionsData);
      } catch (error) {
        console.error("Failed to load initial data", error);
        // Handle error appropriately, maybe show an error message
      } finally {
        setIsLoading(false);
      }
    };
    
    // Check for a logged-in user in localStorage to persist session
    const storedUser = localStorage.getItem('connectplus_user');
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      setUser(currentUser);
      loadInitialData(currentUser);
    } else {
      setIsLoading(false); // Not logged in, no data to load
    }
    
    const storedLastHomeVisit = localStorage.getItem('connectplus_lastHomeVisit');
    if (storedLastHomeVisit) {
        setLastHomeVisit(JSON.parse(storedLastHomeVisit));
    }
  }, []);

  const disabledUserNames = useMemo(() => {
    return new Set(people.filter(p => p.isDisabled).map(p => p.name));
  }, [people]);

  const visiblePosts = useMemo(() => {
    return posts.filter(post => !disabledUserNames.has(post.author));
  }, [posts, disabledUserNames]);

  const handleSignIn = async (name: string, password?: string) => {
    const existingUser = await api.fetchUserByName(name);

    if (existingUser) {
      if (existingUser.isDisabled) {
        alert("Your account has been disabled. Please contact an administrator.");
        return;
      }
      if (existingUser.password && existingUser.password !== password) {
        alert("Incorrect password. Please try again.");
        return;
      }
      localStorage.setItem('connectplus_user', JSON.stringify(existingUser));
      window.location.reload(); // Reload to fetch all data for the new user
    } else {
      if (!password) {
        alert("A password is required to create a new account.");
        return;
      }
      
      const isAdmin = name.toLowerCase() === 'ajia abdulrasaq';
      const newUser: User = {
        id: uid('u'), name,
        headline: isAdmin ? 'Founder & Admin' : 'New to Connect+',
        intent: 'Connect', isAdmin, password,
        isDisabled: false, createdAt: Date.now(),
      };
      
      const createdUser = await api.createUser(newUser);
      localStorage.setItem('connectplus_user', JSON.stringify(createdUser));
      window.location.reload(); // Reload to fetch all data
    }
  };

  const handleResetPassword = (name: string, newPassword: string): boolean => {
    // This is a mock implementation. In a real app, this would involve a secure flow.
    alert("Password reset functionality is not fully implemented in this demo.");
    return false;
  };

  const handleSignOut = () => {
    setUser(null);
    setConnections([]);
    localStorage.removeItem('connectplus_user');
    setCurrentPage(Page.HOME);
  };

  const handleCreatePost = async (p: Post) => {
    if (!user || user.isDisabled) return;
    const postWithAuthorPic = { ...p, authorProfilePictureUrl: user.profilePictureUrl };
    
    // Optimistic update
    setPosts([postWithAuthorPic, ...posts]);
    
    try {
        await api.createPost(postWithAuthorPic);
    } catch(e) {
        console.error("Failed to create post:", e);
        // Revert on failure
        setPosts(posts);
        alert("Error: Could not save your post. Please try again.");
    }
  };

  const handleEditPost = async (postId: string, newText: string) => {
    if (!user || user.isDisabled) return;
    const originalPosts = [...posts];
    const postToUpdate = originalPosts.find(p => p.id === postId);
    if (!postToUpdate) return;

    const updatedPost = { ...postToUpdate, text: newText, lastEdited: Date.now() };

    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? updatedPost : p));

    try {
        await api.updatePost(updatedPost);
    } catch(e) {
        console.error("Failed to edit post:", e);
        setPosts(originalPosts);
        alert("Error: Could not save your edit. Please try again.");
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user || user.isDisabled) return;
    const postToUpdate = posts.find(p => p.id === postId);
    if (!postToUpdate) return;

    const likedByCurrentUser = postToUpdate.likedBy.includes(user.id);
    const newLikedBy = likedByCurrentUser
        ? postToUpdate.likedBy.filter(id => id !== user.id)
        : [...postToUpdate.likedBy, user.id];
    
    const updatedPost = { ...postToUpdate, likedBy: newLikedBy };
    
    // Optimistic update
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? updatedPost : p));

    try {
        await api.updatePost(updatedPost);
    } catch(e) {
        console.error("Failed to like post:", e);
        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? postToUpdate : p));
    }
  };

  const handleCommentOnPost = async (postId: string, text: string) => {
    if (!user || user.isDisabled) return;
    const postToUpdate = posts.find(p => p.id === postId);
    if (!postToUpdate) return;
    
    const newComment: Comment = {
      id: uid('c'), authorId: user.id, authorName: user.name, text, timestamp: Date.now(),
    };
    
    const updatedPost = { ...postToUpdate, comments: [...postToUpdate.comments, newComment] };

    // Optimistic update
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? updatedPost : p));

    try {
        await api.updatePost(updatedPost);
    } catch(e) {
        console.error("Failed to comment on post:", e);
        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? postToUpdate : p));
    }
  };

  const handleAdminDeletePost = async (postId: string) => {
    const originalPosts = [...posts];
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    try {
        await api.deletePost(postId);
    } catch(e) {
        console.error("Failed to delete post:", e);
        setPosts(originalPosts);
        alert("Error: could not delete post.");
    }
  };

  const handleConnect = async (p: User) => {
    if (!user || connections.find(c => c.id === p.id) || p.id === user?.id || p.isDisabled) return;
    
    setConnections([p, ...connections]); // Optimistic update
    try {
        await api.createConnection(user.id, p.id);
    } catch(e) {
        console.error("Failed to connect:", e);
        setConnections(connections.filter(c => c.id !== p.id));
        alert("Error: Could not add connection.");
    }
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    const originalUser = { ...user };
    setUser(updatedUser); // Optimistic update

    try {
        await api.updateUser(updatedUser);
        setPeople(prevPeople => prevPeople.map(p => p.id === updatedUser.id ? updatedUser : p));
        setConnections(prevConnections => prevConnections.map(c => c.id === updatedUser.id ? updatedUser : c));
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.author === originalUser.name) {
                return { ...p, author: updatedUser.name, authorProfilePictureUrl: updatedUser.profilePictureUrl };
            }
            return p;
        }));
        localStorage.setItem('connectplus_user', JSON.stringify(updatedUser));
    } catch(e) {
        console.error("Failed to update profile:", e);
        setUser(originalUser);
        alert("Error: Could not update profile.");
    }
  };

  const handleAdminUpdateUser = async (updatedUser: User) => {
    const originalPeople = [...people];
    setPeople(prevPeople => prevPeople.map(p => p.id === updatedUser.id ? updatedUser : p));
    try {
        await api.updateUser(updatedUser);
        if (user?.id === updatedUser.id) {
            setUser(updatedUser);
            localStorage.setItem('connectplus_user', JSON.stringify(updatedUser));
        }
    } catch(e) {
        console.error("Failed to update user:", e);
        setPeople(originalPeople);
        alert("Error: Could not update user.");
    }
  };

  const handleAdminUpdateTribe = async (updatedTribe: Tribe) => {
    const originalTribes = [...tribes];
    setTribes(prevTribes => prevTribes.map(t => t.id === updatedTribe.id ? updatedTribe : t));
    try {
      await api.updateTribe(updatedTribe);
    } catch(e) {
      console.error("Failed to update tribe:", e);
      setTribes(originalTribes);
      alert("Error: Could not update tribe.");
    }
  };

  const handleCreateTask = async (text: string, dueDate: string, priority: 'High' | 'Medium' | 'Low') => {
    const newTask: Task = {
      id: uid('t'), text, isCompleted: false, timestamp: Date.now(), dueDate: dueDate || undefined, priority,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    try {
      await api.createTask(newTask);
    } catch (e) {
      console.error("Failed to create task:", e);
      setTasks(tasks);
    }
  };
  
  const handleToggleTask = async (taskId: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    const updatedTask = { ...taskToUpdate, isCompleted: !taskToUpdate.isCompleted };
    
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t));
    try {
      await api.updateTask(updatedTask);
    } catch (e) {
      console.error("Failed to toggle task:", e);
      setTasks(tasks);
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    const originalTasks = [...tasks];
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    try {
      await api.deleteTask(taskId);
    } catch (e) {
      console.error("Failed to delete task:", e);
      setTasks(originalTasks);
    }
  };
  
  const handleNavigate = (page: Page) => {
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
      api.markChatAsRead(getChatKey(user!.id, peer.id));
      setActiveChatPeer(peer);
      setCurrentPage(Page.CHAT);
  }

  const handleViewProfile = (profileToView: User) => {
    setViewingProfile(profileToView);
    setCurrentPage(Page.VIEW_PROFILE);
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }
    if (activeChatPeer) {
        return <ChatScreen peer={activeChatPeer} currentUser={user!} />;
    }
    const homeScreenProps = {
        posts: visiblePosts, onCreatePost: handleCreatePost, currentUser: user!,
        onLikePost: handleLikePost, onCommentOnPost: handleCommentOnPost, onEditPost: handleEditPost,
        people, lastHomeVisit,
    };

    const adminScreenProps = {
        people, tribes, posts, onUpdateUser: handleAdminUpdateUser,
        onUpdateTribe: handleAdminUpdateTribe, onDeletePost: handleAdminDeletePost,
    };

    switch(currentPage) {
        case Page.HOME: return <HomeScreen {...homeScreenProps} />;
        case Page.DISCOVER:
            const discoverablePeople = people.filter(p => p.id !== user?.id);
            return <DiscoverScreen currentUser={user!} people={discoverablePeople} tribes={tribes} onConnect={handleConnect} connections={connections} onViewProfile={handleViewProfile} onOpenChat={handleOpenChat} />;
        case Page.CONNECTIONS:
            return <ConnectionsScreen connections={connections} onOpenChat={handleOpenChat} onViewProfile={handleViewProfile} />;
        case Page.MESSAGES:
            return <MessagesScreen currentUser={user!} people={people} onOpenChat={handleOpenChat} />;
        case Page.COACH:
            return <CoachScreen user={user!} people={people} />;
        case Page.CHATBOT: return <ChatbotScreen />;
        case Page.TASKS: return <TasksScreen tasks={tasks} onCreateTask={handleCreateTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />;
        case Page.PROFILE: return <ProfileScreen user={user!} onUpdateProfile={handleUpdateProfile} />;
        case Page.ABOUT: return <AboutScreen />;
        case Page.ADMIN: return user?.isAdmin ? <AdminScreen {...adminScreenProps} /> : <HomeScreen {...homeScreenProps} />;
        case Page.VIEW_PROFILE:
            if (viewingProfile) {
              return <ViewProfileScreen profileUser={viewingProfile} onConnect={handleConnect} connections={connections} currentUser={user!} />;
            }
            setCurrentPage(Page.DISCOVER);
            return null;
        case Page.CHAT:
             if(connections.length > 0) {
                return <ChatScreen peer={connections[0]} currentUser={user!} />;
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