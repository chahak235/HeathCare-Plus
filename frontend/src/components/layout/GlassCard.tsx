import React from 'react';
import { GlassCardProps } from '../../types/ui.types';

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverable = false,
  blurLevel = 'md'
}) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg'
  };

  return (
    <div
      className={`
        glass-card
        ${blurClasses[blurLevel]}
        ${hoverable ? 'hover-lift cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
};