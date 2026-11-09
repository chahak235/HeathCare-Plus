import React from 'react';
import { ButtonProps } from '../../types/ui.types';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  medicalPriority,  // New: For medical priority styling
  ariaLabel,        // New: Required for medical compliance
  type = 'button',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    secondary: 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-500 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-600 dark:hover:bg-neutral-700',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-2 focus:ring-neutral-500 dark:text-neutral-300 dark:hover:bg-neutral-800',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-2 focus:ring-error-500',
    critical: 'bg-clinical-critical text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500',
    clinical: 'bg-clinical-normal text-white hover:bg-green-600 focus:ring-2 focus:ring-green-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm h-9',
    md: 'px-4 py-2.5 text-base h-11',
    lg: 'px-6 py-3 text-lg h-14',
  };

  const priorityClasses = {
    high: 'border-2 border-clinical-high',
    medium: 'border border-clinical-moderate',
    low: '',
  };

  const baseClasses = `
    inline-flex items-center justify-center font-medium
    rounded-patient focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    press-feedback
    aria-disabled:opacity-50 aria-disabled:cursor-not-allowed
    ${medicalPriority ? priorityClasses[medicalPriority] : ''}
  `;

  return (
    <button
      type={type}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
      {!isLoading && leftIcon && <span className="mr-2" aria-hidden="true">{leftIcon}</span>}
      <span className="flex items-center">
        {children}
      </span>
      {!isLoading && rightIcon && <span className="ml-2" aria-hidden="true">{rightIcon}</span>}
    </button>
  );
};

// Medical-specific button variants
export const EmergencyButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button
    variant="critical"
    leftIcon={<AlertTriangle className="w-4 h-4" />}
    ariaLabel={`Emergency: ${props.children}`}
    {...props}
  />
);

export const ClinicalButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button
    variant="clinical"
    leftIcon={<CheckCircle className="w-4 h-4" />}
    medicalPriority="high"
    {...props}
  />
);