import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, wrapperClassName = '', className = '', id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-content-2">
            {label}
            {props.required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-3 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-content
              placeholder:text-content-3
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-danger focus:ring-danger/30 focus:border-danger' : 'border-border hover:border-border-strong'}
              ${leftIcon ? 'pl-9' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger-text">{error}</p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-content-3">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
