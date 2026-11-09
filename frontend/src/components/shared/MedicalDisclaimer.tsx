import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MedicalDisclaimerProps {
  className?: string;
  variant?: 'default' | 'critical';
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  className = '',
  variant = 'default'
}) => {
  const { t } = useTranslation();

  if (variant === 'critical') {
    return (
      <div className={`bg-error-50 border border-error-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-error-800">
              {t('medicalDisclaimer.criticalTitle')}
            </h3>
            <p className="mt-1 text-sm text-error-700">
              {t('medicalDisclaimer.criticalDesc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-warning-50 border border-warning-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-warning-800">
            {t('medicalDisclaimer.defaultTitle')}
          </h3>
          <p className="mt-1 text-sm text-warning-700">
            {t('medicalDisclaimer.defaultDesc')}
          </p>
        </div>
      </div>
    </div>
  );
};