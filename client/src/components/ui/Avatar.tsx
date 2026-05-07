import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '' }) => (
  <div
    className={`
      inline-flex items-center justify-center rounded-full font-semibold
      bg-primary-light text-primary select-none shrink-0
      ${sizeClasses[size]} ${className}
    `}
    aria-label={name}
  >
    {initials(name)}
  </div>
);

export default Avatar;
