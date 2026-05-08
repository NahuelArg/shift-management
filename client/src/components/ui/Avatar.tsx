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

const colorClasses = [
  'bg-primary-light text-primary',
  'bg-success-light text-success',
  'bg-warning-light text-warning',
  'bg-info-light text-info',
  'bg-danger-light text-danger',
];

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

const colorFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colorClasses[hash % colorClasses.length];
};

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '' }) => (
  <div
    className={`
      inline-flex items-center justify-center rounded-full font-semibold
      select-none shrink-0
      ${colorFromName(name)} ${sizeClasses[size]} ${className}
    `}
    aria-label={name}
  >
    {initials(name)}
  </div>
);

export default Avatar;
