import React from 'react';
import { User, Page } from '../types';
import Avatar from './Avatar';

interface HeaderProps {
  user: User;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
  currentPage: Page;
}

const NavButton: React.FC<{
    label: string;
    page: Page;
    currentPage: Page;
    onClick: (page: Page) => void;
    isAdmin?: boolean;
}> = ({ label, page, currentPage, onClick, isAdmin = false }) => {
    const isActive = currentPage === page;
    const adminClasses = isAdmin ? 'text-yellow-500 hover:bg-yellow-100' : 'text-gray-600 hover:bg-gray-200';
    const activeAdminClasses = isAdmin ? 'bg-yellow-500 text-white' : 'bg-blue-600 text-white';

    return (
        <button
            onClick={() => onClick(page)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive
                ? activeAdminClasses
                : `${adminClasses} hover:text-gray-900`
            }`}
        >
            {label}
        </button>
    );
}

const Header: React.FC<HeaderProps> = ({ user, onNavigate, onSignOut, currentPage }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">Connect+</h1>
            <nav className="hidden md:flex ml-10 space-x-4">
              <NavButton label="Home" page={Page.HOME} currentPage={currentPage} onClick={onNavigate} />
              <NavButton label="Discover" page={Page.DISCOVER} currentPage={currentPage} onClick={onNavigate} />
              <NavButton label="Connections" page={Page.CONNECTIONS} currentPage={currentPage} onClick={onNavigate} />
              <NavButton label="Messages" page={Page.MESSAGES} currentPage={currentPage} onClick={onNavigate} />
              <NavButton label="AI Coach" page={Page.COACH} currentPage={currentPage} onClick={onNavigate} />
              <NavButton label="AI Chatbot" page={Page.CHATBOT} currentPage={currentPage} onClick={onNavigate} />
              <NavButton label="Tasks" page={Page.TASKS} currentPage={currentPage} onClick={onNavigate} />
              <NavButton label="Profile" page={Page.PROFILE} currentPage={currentPage} onClick={onNavigate} />
              <NavButton label="About" page={Page.ABOUT} currentPage={currentPage} onClick={onNavigate} />
              {user.isAdmin && <NavButton label="Admin" page={Page.ADMIN} currentPage={currentPage} onClick={onNavigate} isAdmin />}
            </nav>
          </div>
          <div className="flex items-center">
             <div className="flex items-center mr-4 cursor-pointer" onClick={() => onNavigate(Page.PROFILE)}>
                <span className="text-gray-700 hidden sm:inline">Hi, <span className="font-semibold">{user.name}</span></span>
                <Avatar name={user.name} profilePictureUrl={user.profilePictureUrl} size="sm" className="ml-2" />
            </div>
            <button
              onClick={onSignOut}
              className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      <nav className="md:hidden bg-gray-50 border-t border-b">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex justify-around flex-wrap">
            <NavButton label="Home" page={Page.HOME} currentPage={currentPage} onClick={onNavigate} />
            <NavButton label="Discover" page={Page.DISCOVER} currentPage={currentPage} onClick={onNavigate} />
            <NavButton label="Connections" page={Page.CONNECTIONS} currentPage={currentPage} onClick={onNavigate} />
            <NavButton label="Messages" page={Page.MESSAGES} currentPage={currentPage} onClick={onNavigate} />
            <NavButton label="AI Coach" page={Page.COACH} currentPage={currentPage} onClick={onNavigate} />
            <NavButton label="AI Chatbot" page={Page.CHATBOT} currentPage={currentPage} onClick={onNavigate} />
            <NavButton label="Tasks" page={Page.TASKS} currentPage={currentPage} onClick={onNavigate} />
            <NavButton label="Profile" page={Page.PROFILE} currentPage={currentPage} onClick={onNavigate} />
            <NavButton label="About" page={Page.ABOUT} currentPage={currentPage} onClick={onNavigate} />
            {user.isAdmin && <NavButton label="Admin" page={Page.ADMIN} currentPage={currentPage} onClick={onNavigate} isAdmin />}
        </div>
      </nav>
    </header>
  );
};

export default Header;