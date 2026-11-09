import React from 'react';
import { InputProps } from '../../types/ui.types';

// Add forwardRef, and pass inputRef as prop
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      className = '',
      multiline,
      rows,
      ...props
    },
    ref
  ) => {
    const baseClassName = `
    w-full
    bg-white dark:bg-neutral-800
    border ${error ? 'border-error-300' : 'border-neutral-300 dark:border-neutral-600'}
    rounded-lg
    px-4 py-2
    text-neutral-900 dark:text-white
    placeholder-neutral-400 dark:placeholder-neutral-500
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${className}
  `;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && !multiline && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}
          {multiline ? (
            <textarea
              rows={rows || 2}
              className={baseClassName}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              className={baseClassName}
              ref={ref}
              {...props}
            />
          )}
          {rightIcon && !multiline && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
