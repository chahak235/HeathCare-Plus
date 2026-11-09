import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

export interface StepProps {
  number: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
}

export const Step: React.FC<StepProps> = ({ number, title, description, status }) => {
  const statusColors = {
    pending: 'border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500',
    active: 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    completed: 'border-primary-500 bg-primary-500 text-white',
  };

  const lineColors = {
    pending: 'bg-neutral-200 dark:bg-neutral-700',
    active: 'bg-neutral-200 dark:bg-neutral-700',
    completed: 'bg-primary-500',
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${statusColors[status]}`}>
        {status === 'completed' ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <span className="font-semibold">{number}</span>
        )}
      </div>
      <div className="mt-2 text-center">
        <div className="font-medium text-sm text-neutral-900 dark:text-white">{title}</div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">{description}</div>
      </div>
    </div>
  );
};

interface StepsProps {
  currentStep: number | string;
  children: React.ReactNode;
}

export const Steps: React.FC<StepsProps> = ({ currentStep, children }) => {
  const steps = React.Children.toArray(children) as React.ReactElement<StepProps>[];
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Connecting lines */}
        <div className="absolute top-5 left-0 right-0 h-0.5 flex">
          {steps.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-full"
              style={{
                backgroundColor: index < steps.length - 1 ? (
                  steps[index].props.status === 'completed' ? '#0ea5e9' : '#e5e5e5'
                ) : 'transparent',
              }}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="relative flex w-full justify-between">
          {steps}
        </div>
      </div>
    </div>
  );
};