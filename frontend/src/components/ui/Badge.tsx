import React from 'react';
import { BadgeProps } from '../../types/ui.types';

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    className = ''
}) => {
    const variantClasses = {
        default: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
        success: 'bg-success-50 text-success-700 dark:bg-success-900 dark:text-success-300',
        warning: 'bg-warning-50 text-warning-700 dark:bg-warning-900 dark:text-warning-300',
        error: 'bg-error-50 text-error-700 dark:bg-error-900 dark:text-error-300',
        outline: 'bg-transparent border border-current',
        info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm'
    };

    return (
        <span
            className={`
        inline-flex items-center rounded-full font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
        >
            {children}
        </span>
    );
};