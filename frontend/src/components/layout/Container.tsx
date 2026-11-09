import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'narrow' | 'wide' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  size = 'wide',
  padding = 'md'
}) => {
  const sizeClasses = {
    narrow: 'max-w-6xl',
    wide: 'max-w-7xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: 'px-0',
    sm: 'px-4 sm:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-4 sm:px-6 lg:px-12'
  };

  return (
    <div
      className={`
        mx-auto
        ${sizeClasses[size]}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};