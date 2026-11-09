import React, { useState } from 'react';
import { AlertTriangle, Shield, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ClinicalDisclaimerProps {
  onAccept: () => void;
  required?: boolean;
  className?: string;
}

const ClinicalDisclaimer: React.FC<ClinicalDisclaimerProps> = ({
  onAccept,
  required = true,
  className = '',
}) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    onAccept();
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-neutral-800 border border-blue-200 dark:border-blue-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-start mb-4">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-4">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
            Clinical Use Disclaimer
          </h3>
          <p className="text-neutral-700 dark:text-neutral-300">
            This AI-powered tool is for <strong>clinical decision support only</strong>.
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            <strong>Not for Diagnosis:</strong> AI analysis should not be used as the sole basis for diagnosis
          </span>
        </div>

        <div className="flex items-start">
          <Lock className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            <strong>HIPAA Compliant:</strong> All data is encrypted and processed according to healthcare privacy standards
          </span>
        </div>

        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            <strong>Clinical Validation Required:</strong> All findings must be reviewed and validated by a qualified healthcare professional
          </span>
        </div>
      </div>

      {required && (
        <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
          <div className="flex items-start mb-4">
            <input
              type="checkbox"
              id="clinical-consent"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
                if (e.target.checked) onAccept();
              }}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded mt-1"
            />
            <label htmlFor="clinical-consent" className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
              <strong>I acknowledge and agree:</strong> I am a qualified healthcare professional using this tool for clinical decision support only. 
              I understand that AI analysis is supplementary and requires professional validation. I confirm that I have appropriate 
              patient consent for this analysis and will maintain all required documentation.
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!accepted}
            className="w-full"
            aria-label="Accept clinical disclaimer"
          >
            Accept & Continue
          </Button>
        </div>
      )}

      {!required && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          By using this tool, you acknowledge this disclaimer. For clinical use, explicit acceptance is required above.
        </div>
      )}
    </div>
  );
};

// Export as default
export default ClinicalDisclaimer;