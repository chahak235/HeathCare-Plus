import React from 'react';
import { Switch } from '@headlessui/react';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
}

export const Toggle: React.FC<ToggleProps> = ({
  enabled,
  onChange,
  label,
  description,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: {
      toggle: 'h-5 w-9',
      dot: 'h-3 w-3',
      dotTranslate: enabled ? 'translate-x-4' : 'translate-x-0.5',
    },
    md: {
      toggle: 'h-6 w-11',
      dot: 'h-4 w-4',
      dotTranslate: enabled ? 'translate-x-5' : 'translate-x-1',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <Switch.Group>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          {label && (
            <Switch.Label className="font-medium text-neutral-900 dark:text-white cursor-pointer">
              {label}
            </Switch.Label>
          )}
          {description && (
            <Switch.Description className="text-sm text-neutral-500 dark:text-neutral-400">
              {description}
            </Switch.Description>
          )}
        </div>
        <Switch
          checked={enabled}
          onChange={onChange}
          className={`
            ${enabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-700'}
            ${currentSize.toggle}
            relative inline-flex items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          `}
        >
          <span
            className={`
              ${enabled ? 'bg-white' : 'bg-white'}
              ${currentSize.dot}
              ${currentSize.dotTranslate}
              inline-block transform rounded-full transition-transform
            `}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
};