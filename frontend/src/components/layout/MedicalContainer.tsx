import React from 'react';

interface MedicalContainerProps {
  children: React.ReactNode;
  type?: 'clinical' | 'patient' | 'diagnostic' | 'admin' | 'default';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'dense' | 'standard' | 'spacious';
  className?: string;
}

export const MedicalContainer: React.FC<MedicalContainerProps> = ({
  children,
  type = 'default',
  maxWidth = 'xl',
  padding = 'standard',
  className = '',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-4xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: 'px-0',
    dense: 'px-4',
    standard: 'px-4 sm:px-6 lg:px-8',
    spacious: 'px-4 sm:px-6 lg:px-12',
  };

  const typeStyles = {
    default: '',
    clinical: 'bg-gradient-to-b from-white to-blue-50 dark:from-neutral-900 dark:to-blue-950/10',
    patient: 'bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900',
    diagnostic: 'bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-neutral-900',
    admin: 'bg-gradient-to-b from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900',
  };

  return (
    <div className={`min-h-screen ${typeStyles[type]}`}>
      <div
        className={`
          mx-auto ${maxWidthClasses[maxWidth]}
          ${paddingClasses[padding]} py-8
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
};