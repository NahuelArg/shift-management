import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, wrapperClassName = '', className = '', id, children, ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-content-2">
            {label}
            {props.required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full appearance-none rounded-lg border bg-surface px-3 py-2.5 pr-8 text-sm text-content
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-danger' : 'border-border hover:border-border-strong'}
              ${className}
            `}
            aria-invalid={error ? 'true' : undefined}
            {...props}
          >
            {children}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-content-3">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
        {error && <p className="text-xs text-danger-text">{error}</p>}
        {hint && !error && <p className="text-xs text-content-3">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
