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
  primary: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger:  'bg-danger-light  text-danger',
  info:    'bg-info-light    text-info',
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
  <div className={`bg-surface rounded-xl shadow-card p-5 flex items-start gap-4 hover:shadow-card-hover transition-shadow ${className}`}>
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accentMap[accent]}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-content-3 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-content leading-tight">{value}</p>
      {subtitle && <p className="text-xs text-content-3 mt-0.5">{subtitle}</p>}
      {trend && (
        <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-success' : 'text-danger'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  </div>
);

export default StatCard;
