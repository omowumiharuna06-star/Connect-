export interface User {
  id: string;
  name: string;
  headline: string;
  intent: string;
  location?: string;
  isAdmin?: boolean;
  lastActive?: number;
  profilePictureUrl?: string;
  password?: string;
  isDisabled?: boolean;
  createdAt?: number;
}

export interface Tribe {
  id: string;
  name: string;
  tagline: string;
  members: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: number;
}

export interface Post {
  id:string;
  author: string;
  text: string;
  timestamp: number;
  lastEdited?: number;
  imageUrl?: string;
  videoUrl?: string;
  likedBy: string[];
  comments: Comment[];
  authorProfilePictureUrl?: string;
}

export interface Message {
  id:string;
  from: string;
  text: string;
  ts: number;
}

export interface Task {
  id:string;
  text: string;
  isCompleted: boolean;
  timestamp: number;
  dueDate?: string;
  priority: 'High' | 'Medium' | 'Low';
}

export enum Page {
  HOME = 'HOME',
  DISCOVER = 'DISCOVER',
  CONNECTIONS = 'CONNECTIONS',
  MESSAGES = 'MESSAGES',
  CHAT = 'CHAT',
  COACH = 'COACH',
  CHATBOT = 'CHATBOT',
  TASKS = 'TASKS',
  ADMIN = 'ADMIN',
  PROFILE = 'PROFILE',
  ABOUT = 'ABOUT',
  VIEW_PROFILE = 'VIEW_PROFILE',
}