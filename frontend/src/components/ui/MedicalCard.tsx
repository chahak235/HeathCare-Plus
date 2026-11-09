import React from 'react';
import { AlertTriangle, Shield, Lock, Eye, Info } from 'lucide-react';

interface MedicalCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  severity?: 'normal' | 'low' | 'moderate' | 'high' | 'critical';
  privacyLevel?: 'public' | 'restricted' | 'confidential' | 'critical';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const MedicalCard: React.FC<MedicalCardProps> = ({
  children,
  title,
  subtitle,
  severity = 'normal',
  privacyLevel = 'restricted',
  className = '',
  onClick,
  interactive = false,
}) => {
  const severityClasses = {
    normal: '',
    low: 'border-l-4 border-l-clinical-low',
    moderate: 'border-l-4 border-l-clinical-moderate',
    high: 'border-l-4 border-l-clinical-high',
    critical: 'border-l-4 border-l-clinical-critical',
  };

  const severityBackgrounds = {
    normal: '',
    low: '',
    moderate: '',
    high: '',
    critical: 'bg-red-50 dark:bg-red-900/10',
  };

  const privacyIcons = {
    public: null,
    restricted: <Eye className="w-4 h-4 text-amber-500" />,
    confidential: <Lock className="w-4 h-4 text-blue-500" />,
    critical: <Shield className="w-4 h-4 text-purple-500" />,
  };

  const privacyLabels = {
    public: 'Public',
    restricted: 'Restricted',
    confidential: 'Confidential',
    critical: 'Critical',
  };

  return (
    <div
      className={`
        bg-white dark:bg-neutral-800
        border border-neutral-200 dark:border-neutral-700
        rounded-panel
        shadow-sm hover:shadow-md transition-all duration-200
        ${severityClasses[severity]}
        ${severityBackgrounds[severity]}
        ${interactive ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-750' : ''}
        ${className}
      `}
      onClick={onClick}
      role={interactive ? 'button' : 'article'}
      tabIndex={interactive ? 0 : undefined}
    >
      {(title || privacyLevel !== 'public') && (
        <div className="flex items-start justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
          {privacyLevel !== 'public' && (
            <div className="flex items-center space-x-2 ml-4">
              {privacyIcons[privacyLevel]}
              <span className="text-xs font-medium px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded">
                {privacyLabels[privacyLevel]}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
      
      {severity === 'critical' && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800/30">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300 font-medium">
              <strong>Clinical Attention Required:</strong> This finding requires immediate evaluation by a healthcare professional.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Specific medical card variants
export const PatientCard: React.FC<Omit<MedicalCardProps, 'privacyLevel'>> = (props) => (
  <MedicalCard privacyLevel="confidential" {...props} />
);

export const DiagnosticCard: React.FC<Omit<MedicalCardProps, 'privacyLevel'>> = (props) => (
  <MedicalCard privacyLevel="critical" {...props} />
);