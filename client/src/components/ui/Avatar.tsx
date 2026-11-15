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

// Siempre fondo -light + texto -text: las iniciales son texto y necesitan ≥ 4.5:1
const colorClasses = [
  'bg-primary-light text-primary-text',
  'bg-success-light text-success-text',
  'bg-warning-light text-warning-text',
  'bg-info-light text-info-text',
  'bg-danger-light text-danger-text',
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
    role="img"
    aria-label={name}
  >
    {initials(name)}
  </div>
);

export default Avatar;
