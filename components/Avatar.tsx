import React from 'react';

interface AvatarProps {
  name: string;
  profilePictureUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-lg',
  lg: 'w-12 h-12 text-xl',
  xl: 'w-16 h-16 text-3xl',
  '2xl': 'w-24 h-24 text-5xl',
};

const Avatar: React.FC<AvatarProps> = ({ name, profilePictureUrl, size = 'md', className = '' }) => {
  const baseClasses = 'rounded-full flex items-center justify-center font-bold flex-shrink-0';
  const colorClasses = 'bg-blue-500 text-white';

  if (profilePictureUrl) {
    return (
      <img
        src={profilePictureUrl}
        alt={name}
        className={`${baseClasses} ${sizeClasses[size]} object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${baseClasses} ${colorClasses} ${sizeClasses[size]} ${className}`}>
      {name ? name.charAt(0).toUpperCase() : '?'}
    </div>
  );
};

export default Avatar;