import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  subtitle?: string;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const accentMap = {
  primary: 'bg-primary-light text-primary-text',
  success: 'bg-success-light text-success-text',
  warning: 'bg-warning-light text-warning-text',
  danger:  'bg-danger-light  text-danger-text',
  info:    'bg-info-light    text-info-text',
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  subtitle,
  accent = 'primary',
  className = '',
}) => (
  <div className={`bg-surface rounded-xl shadow-card p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-3 sm:gap-4 hover:shadow-card-hover transition-shadow ${className}`}>
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accentMap[accent]}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0 w-full">
      <p className="text-xs font-medium text-content-3 uppercase tracking-wide mb-1 break-words">{label}</p>
      <p className="text-lg min-[375px]:text-xl sm:text-2xl font-bold text-content leading-tight break-words">{value}</p>
      {subtitle && <p className="text-xs text-content-3 mt-0.5">{subtitle}</p>}
      {trend && (
        <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  </div>
);

export default StatCard;
