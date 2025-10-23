import { User, Post, Tribe, Message, Comment, Task } from '../types';
import { starterUsers, starterTribes } from '../constants';
import { uid, getChatKey } from '../utils';

// --- LocalStorage Database Simulation ---

const DB_KEY = 'connectplus_db';

interface Database {
    users: User[];
    tribes: Tribe[];
    posts: Post[];
    tasks: Task[];
    connections: Record<string, string[]>;
    messages: Record<string, Message[]>;
    lastRead: Record<string, number>;
}

const getDb = (): Database => {
    const dbString = localStorage.getItem(DB_KEY);
    if (dbString) {
        return JSON.parse(dbString);
    }
    
    // Initialize if not present
    const adminUser: User = {
        id: 'u_admin_001',
        name: 'Ajia Abdulrasaq',
        headline: 'Founder & Admin',
        intent: 'Build a great community',
        isAdmin: true,
        password: 'password',
        isDisabled: false,
        createdAt: Date.now() - 100000
    };

    const initialUsers = [...starterUsers];
    if (!initialUsers.find(u => u.name.toLowerCase() === 'ajia abdulrasaq')) {
        initialUsers.unshift(adminUser);
    }

    const initialDb: Database = {
        users: initialUsers,
        tribes: [...starterTribes],
        posts: [],
        tasks: [],
        connections: {},
        messages: {},
        lastRead: {},
    };
    localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
    return initialDb;
};

const saveDb = (db: Database) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};


// --- Network Delay Simulation ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- User API ---
export const fetchUsers = async (): Promise<User[]> => {
    await delay(100);
    const db = getDb();
    return Promise.resolve([...db.users]);
};

export const fetchUserByName = async (name: string): Promise<User | undefined> => {
    await delay(50);
    const db = getDb();
    return Promise.resolve(db.users.find(p => p.name.toLowerCase() === name.toLowerCase()));
};

export const createUser = async (user: User): Promise<User> => {
    await delay(150);
    const db = getDb();
    db.users.unshift(user);
    saveDb(db);
    return Promise.resolve(user);
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    await delay(100);
    const db = getDb();
    db.users = db.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    saveDb(db);
    return Promise.resolve(updatedUser);
};

// --- Connections API ---
export const fetchConnections = async (userId: string): Promise<User[]> => {
    await delay(100);
    const db = getDb();
    const connectionIds = db.connections[userId] || [];
    const connectedUsers = db.users.filter(u => connectionIds.includes(u.id));
    return Promise.resolve(connectedUsers);
};

export const createConnection = async (userId: string, peerId: string): Promise<User> => {
    await delay(150);
    const db = getDb();
    // Add connection for current user
    if (!db.connections[userId]) db.connections[userId] = [];
    if (!db.connections[userId].includes(peerId)) {
        db.connections[userId].push(peerId);
    }
    // Make connection two-way
    if (!db.connections[peerId]) db.connections[peerId] = [];
    if (!db.connections[peerId].includes(userId)) {
        db.connections[peerId].push(userId);
    }
    saveDb(db);
    const peerUser = db.users.find(u => u.id === peerId);
    return Promise.resolve(peerUser!);
};

// --- Posts API ---
export const fetchPosts = async (): Promise<Post[]> => {
    await delay(200);
    const db = getDb();
    return Promise.resolve([...db.posts].sort((a, b) => b.timestamp - a.timestamp));
};

export const createPost = async (post: Post): Promise<Post> => {
    await delay(150);
    const db = getDb();
    db.posts.unshift(post);
    saveDb(db);
    return Promise.resolve(post);
};

export const updatePost = async (updatedPost: Post): Promise<Post> => {
    await delay(50);
    const db = getDb();
    db.posts = db.posts.map(p => p.id === updatedPost.id ? updatedPost : p);
    saveDb(db);
    return Promise.resolve(updatedPost);
};

export const deletePost = async (postId: string): Promise<void> => {
    await delay(200);
    const db = getDb();
    db.posts = db.posts.filter(p => p.id !== postId);
    saveDb(db);
    return Promise.resolve();
};

// --- Tribes API ---
export const fetchTribes = async (): Promise<Tribe[]> => {
    await delay(50);
    const db = getDb();
    return Promise.resolve([...db.tribes]);
}

export const updateTribe = async (updatedTribe: Tribe): Promise<Tribe> => {
    await delay(100);
    const db = getDb();
    db.tribes = db.tribes.map(t => t.id === updatedTribe.id ? updatedTribe : t);
    saveDb(db);
    return Promise.resolve(updatedTribe);
};

// --- Messages API ---
export const fetchMessages = async (chatKey: string, peerName: string): Promise<Message[]> => {
    await delay(50);
    const db = getDb();
    if (!db.messages[chatKey]) {
        // Create an initial conversation if none exists
        const initialMsg: Message = { id: uid('m'), from: peerName, text: 'Hey — nice to connect!', ts: Date.now() - 1000 };
        db.messages[chatKey] = [initialMsg];
        saveDb(db);
    }
    return Promise.resolve([...db.messages[chatKey]]);
};

export const sendMessage = async (chatKey: string, message: Message): Promise<Message> => {
    await delay(100);
    const db = getDb();
    if (!db.messages[chatKey]) db.messages[chatKey] = [];
    db.messages[chatKey].push(message);
    saveDb(db);
    return Promise.resolve(message);
};

export const fetchConversations = async (userId: string, userName: string, allUsers: User[]): Promise<any[]> => {
    await delay(250);
    const db = getDb();
    const conversations: any[] = [];
    for (const peer of allUsers) {
        if (peer.id === userId) continue;
        const chatKey = getChatKey(userId, peer.id);
        if (db.messages[chatKey] && db.messages[chatKey].length > 0) {
            const lastMessage = db.messages[chatKey][db.messages[chatKey].length - 1];
            const lastReadTimestamp = db.lastRead[chatKey] || 0;
            const isUnread = lastMessage.ts > lastReadTimestamp && lastMessage.from !== userName;
            conversations.push({ peer, lastMessage, isUnread });
        }
    }
    return Promise.resolve(conversations.sort((a,b) => b.lastMessage.ts - a.lastMessage.ts));
}

export const markChatAsRead = async (chatKey: string): Promise<void> => {
    await delay(20);
    const db = getDb();
    db.lastRead[chatKey] = Date.now();
    saveDb(db);
    return Promise.resolve();
}

export const deleteConversation = async(chatKey: string): Promise<void> => {
    await delay(200);
    const db = getDb();
    delete db.messages[chatKey];
    saveDb(db);
    return Promise.resolve();
}


// --- Tasks API ---
export const fetchTasks = async (): Promise<Task[]> => {
    await delay(50);
    const db = getDb();
    return Promise.resolve([...db.tasks]);
};

export const createTask = async (task: Task): Promise<Task> => {
    await delay(100);
    const db = getDb();
    db.tasks.unshift(task);
    saveDb(db);
    return Promise.resolve(task);
};

export const updateTask = async (updatedTask: Task): Promise<Task> => {
    await delay(50);
    const db = getDb();
    db.tasks = db.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    saveDb(db);
    return Promise.resolve(updatedTask);
};

export const deleteTask = async (taskId: string): Promise<void> => {
    await delay(150);
    const db = getDb();
    db.tasks = db.tasks.filter(t => t.id !== taskId);
    saveDb(db);
    return Promise.resolve();
};