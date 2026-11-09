import React from 'react';
import { CardProps } from '../../types/ui.types';

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div
      className={`
        bg-surface-primary
        border border-border-light
        rounded-xl
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
};