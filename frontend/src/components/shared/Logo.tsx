import React from 'react';
import { Stethoscope } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className="absolute inset-0 bg-primary-100 rounded-full blur-md opacity-50" />
        <Stethoscope
          className={`${iconSizes[size]} relative text-primary-600`}
        />
      </div>
      {showText && (
        <div className={`font-semibold ${sizeClasses[size]}`}>
          <span className="text-primary-600">HealthCare</span>
          <span className="text-neutral-700 dark:text-neutral-300">+</span>
        </div>
      )}
    </div>
  );
};