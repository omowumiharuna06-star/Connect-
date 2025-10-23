import React, { useState, useMemo } from 'react';
import { User, Tribe, Post } from '../types';
import Avatar from './Avatar';

interface AdminScreenProps {
  people: User[];
  tribes: Tribe[];
  posts: Post[];
  onUpdateUser: (user: User) => void;
  onUpdateTribe: (tribe: Tribe) => void;
  onDeletePost: (postId: string) => void;
}

type AdminTab = 'dashboard' | 'users' | 'content' | 'tribes';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
            <div className="flex-shrink-0">
                {icon}
            </div>
            <div className="ml-5 w-0 flex-1">
                <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                    <dd className="text-3xl font-bold text-gray-900">{value}</dd>
                </dl>
            </div>
        </div>
    </div>
);

const EditUserModal: React.FC<{ user: User; onSave: (user: User) => void; onClose: () => void }> = ({ user, onSave, onClose }) => {
    const [editableUser, setEditableUser] = useState<User>(user);

    const handleSave = () => {
        onSave(editableUser);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Edit User: {user.name}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input value={editableUser.name} onChange={(e) => setEditableUser({...editableUser, name: e.target.value})} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Headline</label>
                        <input value={editableUser.headline} onChange={(e) => setEditableUser({...editableUser, headline: e.target.value})} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="isAdmin" checked={editableUser.isAdmin} onChange={(e) => setEditableUser({...editableUser, isAdmin: e.target.checked})} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                        <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">Is Admin</label>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
                </div>
            </div>
        </div>
    );
};

const EditTribeModal: React.FC<{ tribe: Tribe; onSave: (tribe: Tribe) => void; onClose: () => void }> = ({ tribe, onSave, onClose }) => {
    const [editableTribe, setEditableTribe] = useState<Tribe>(tribe);

    const handleSave = () => {
        onSave(editableTribe);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Edit Tribe: {tribe.name}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input value={editableTribe.name} onChange={(e) => setEditableTribe({...editableTribe, name: e.target.value})} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tagline</label>
                        <input value={editableTribe.tagline} onChange={(e) => setEditableTribe({...editableTribe, tagline: e.target.value})} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Members</label>
                        <input type="number" value={editableTribe.members} onChange={(e) => setEditableTribe({...editableTribe, members: parseInt(e.target.value, 10) || 0})} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
                </div>
            </div>
        </div>
    );
};

const AdminScreen: React.FC<AdminScreenProps> = ({ people, tribes, posts, onUpdateUser, onUpdateTribe, onDeletePost }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingTribe, setEditingTribe] = useState<Tribe | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');

  const platformStats = useMemo(() => {
    const totalLikes = posts.reduce((sum, post) => sum + post.likedBy.length, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
    const totalEngagements = totalLikes + totalComments;
    const engagementsPerPost = posts.length > 0 ? (totalEngagements / posts.length).toFixed(1) : '0.0';

    return {
      totalUsers: people.length,
      totalPosts: posts.length,
      totalLikes: totalLikes,
      engagementsPerPost,
    };
  }, [people, posts]);

  const handleDeletePost = (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post permanently? This action cannot be undone.')) {
        onDeletePost(postId);
    }
  };

  const filteredPeople = useMemo(() => {
    return people.filter(p => p.name.toLowerCase().includes(userSearch.toLowerCase()));
  }, [people, userSearch]);
  
  const filteredPosts = useMemo(() => {
    return posts.filter(p => 
        p.author.toLowerCase().includes(postSearch.toLowerCase()) || 
        p.text.toLowerCase().includes(postSearch.toLowerCase())
    );
  }, [posts, postSearch]);


  const TabButton: React.FC<{tab: AdminTab, label: string}> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    switch(activeTab) {
        case 'dashboard': return (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Users" 
                    value={platformStats.totalUsers}
                    icon={<div className="p-3 rounded-full bg-blue-100 text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>}
                />
                <StatCard 
                    title="Total Posts" 
                    value={platformStats.totalPosts}
                    icon={<div className="p-3 rounded-full bg-green-100 text-green-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>}
                />
                 <StatCard 
                    title="Total Likes" 
                    value={platformStats.totalLikes}
                    icon={<div className="p-3 rounded-full bg-red-100 text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 18.333V9a2 2 0 012-2h1V3a2 2 0 012-2h1a2 2 0 012 2v6z" /></svg></div>}
                />
                <StatCard 
                    title="Engagements per Post" 
                    value={platformStats.engagementsPerPost}
                    icon={<div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v1z" /></svg></div>}
                />
            </div>
        );
        case 'users': return (
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">User Management ({filteredPeople.length})</h3>
                    <input type="text" placeholder="Search by name..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-64 p-2 border rounded-md" />
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Headline</th>
                         <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPeople.map((user) => (
                        <tr key={user.id} className={`${user.isDisabled ? 'bg-gray-100' : ''} hover:bg-gray-50`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                                <Avatar name={user.name} profilePictureUrl={user.profilePictureUrl} size="sm" className="mr-3" />
                                {user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.headline}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {user.isAdmin ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Yes</span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">No</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {user.isDisabled ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Disabled</span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button onClick={() => setEditingUser(user)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                <button
                                    onClick={() => onUpdateUser({ ...user, isDisabled: !user.isDisabled })}
                                    className={`px-2 py-1 text-xs font-semibold rounded ${ user.isDisabled ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600' }`}
                                >
                                    {user.isDisabled ? 'Enable' : 'Disable'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
        );
        case 'content': return (
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Content Management ({filteredPosts.length} Posts)</h3>
                    <input type="text" placeholder="Search by author or content..." value={postSearch} onChange={e => setPostSearch(e.target.value)} className="w-64 p-2 border rounded-md" />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{post.author}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-sm">
                                <div className="flex items-center">
                                    {post.imageUrl && <img src={post.imageUrl} alt="post" className="h-10 w-10 rounded-md object-cover mr-3" />}
                                    <span className="truncate">{post.text}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.likedBy.length} Likes, {post.comments.length} Comments</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(post.timestamp).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => handleDeletePost(post.id)} className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700 hover:bg-red-200">Delete</button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
        );
        case 'tribes': return (
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Tribe Management ({tribes.length})</h3>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tagline</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {tribes.map((tribe) => (
                        <tr key={tribe.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tribe.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tribe.tagline}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tribe.members}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => setEditingTribe(tribe)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
        );
        default: return null;
    }
  }

  return (
    <div className="space-y-6">
      {editingUser && <EditUserModal user={editingUser} onSave={onUpdateUser} onClose={() => setEditingUser(null)} />}
      {editingTribe && <EditTribeModal tribe={editingTribe} onSave={onUpdateTribe} onClose={() => setEditingTribe(null)} />}
      
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Admin Dashboard</h2>
        <p className="text-gray-500">Manage users, content, and platform settings.</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <TabButton tab="dashboard" label="Dashboard" />
            <TabButton tab="users" label="Users" />
            <TabButton tab="content" label="Content" />
            <TabButton tab="tribes" label="Tribes" />
        </nav>
      </div>
      
      <div className="mt-6">
        {renderContent()}
      </div>

    </div>
  );
};

export default AdminScreen;