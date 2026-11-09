import React from 'react';

interface ProgressRingProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  strokeWidth?: number;
  showPercentage?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 'md',
  label,
  strokeWidth = 3,
  showPercentage = true,
}) => {
  const sizeMap = {
    sm: 60,
    md: 80,
    lg: 100,
  };

  const radius = (sizeMap[size] - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (percent: number) => {
    if (percent >= 90) return 'stroke-success-500';
    if (percent >= 70) return 'stroke-primary-500';
    if (percent >= 50) return 'stroke-warning-500';
    return 'stroke-error-500';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={sizeMap[size]}
          height={sizeMap[size]}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={sizeMap[size] / 2}
            cy={sizeMap[size] / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none stroke-neutral-200 dark:stroke-neutral-700"
          />
          {/* Progress circle */}
          <circle
            cx={sizeMap[size] / 2}
            cy={sizeMap[size] / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className={`fill-none transition-all duration-1000 ease-out ${getColor(
              percentage
            )}`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-neutral-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {label}
        </span>
      )}
    </div>
  );
};