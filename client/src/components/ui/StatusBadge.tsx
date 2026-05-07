import React from 'react';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  success: 'bg-success-light text-success-text',
  warning: 'bg-warning-light text-warning-text',
  danger:  'bg-danger-light  text-danger-text',
  info:    'bg-info-light    text-info-text',
  neutral: 'bg-surface-3    text-content-2',
};

const dotColors: Record<Variant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  info:    'bg-info',
  neutral: 'bg-content-3',
};

export const bookingStatusVariant = (status: string): Variant => {
  switch (status) {
    case 'CONFIRMED':  return 'success';
    case 'PENDING':    return 'warning';
    case 'CANCELLED':  return 'danger';
    case 'COMPLETED':  return 'info';
    default:           return 'neutral';
  }
};

export const paymentStatusVariant = (status: string): Variant => {
  switch (status) {
    case 'PAID':    return 'success';
    case 'PENDING': return 'warning';
    case 'REFUNDED': return 'info';
    default:        return 'neutral';
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  dot = true,
  className = '',
}) => (
  <span
    className={`
      inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
      ${variantClasses[variant]} ${className}
    `}
  >
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
    {label}
  </span>
);

export default StatusBadge;
