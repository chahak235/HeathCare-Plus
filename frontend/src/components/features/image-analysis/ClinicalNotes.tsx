import React from 'react';
import { MedicalCard } from '../../ui/MedicalCard';
import { Button } from '../../ui/Button';
import { Save, Clock, User } from 'lucide-react';

interface ClinicalNotesProps {
  value: string;
  onChange: (value: string) => void;
  patientInfo?: any;
  className?: string;
}

export const ClinicalNotes: React.FC<ClinicalNotesProps> = ({
  value,
  onChange,
  patientInfo,
  className = '',
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      alert('Clinical notes saved successfully');
    }, 1000);
  };

  const templateNotes = [
    'Normal chest X-ray findings.',
    'Follow-up recommended in 6 months.',
    'Consider CT scan for further evaluation.',
    'No acute cardiopulmonary process.',
    'Stable compared to previous study.',
  ];

  return (
    <MedicalCard
      title="Clinical Notes"
      subtitle="Add your professional assessment and recommendations"
      privacyLevel="confidential"
      className={className}
    >
      {/* Patient Context */}
      {patientInfo && (
        <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <User className="w-4 h-4 text-neutral-400 mr-2" />
              <span className="font-medium">{patientInfo.name}</span>
              <span className="mx-2">•</span>
              <span className="text-neutral-600 dark:text-neutral-400">
                {patientInfo.age}y {patientInfo.gender}
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-neutral-400 mr-2" />
              <span className="text-neutral-600 dark:text-neutral-400">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notes Editor */}
      <div className="mb-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your clinical assessment, differential diagnosis, and recommendations..."
          className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[200px]"
          rows={8}
        />
      </div>

      {/* Quick Templates */}
      <div className="mb-6">
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Quick Templates
        </div>
        <div className="flex flex-wrap gap-2">
          {templateNotes.map((note, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onChange(value + (value ? '\n' : '') + note)}
              className="px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors"
            >
              {note}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-500">
          {value.length} characters • {value.split(/\s+/).filter(Boolean).length} words
        </div>
        <div className="flex space-x-3">
          <Button
            variant="ghost"
            onClick={() => onChange('')}
            disabled={!value}
          >
            Clear
          </Button>
          <Button
            onClick={handleSave}
            disabled={!value || isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </div>

      {/* Formatting Tips */}
      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-xs text-neutral-500">
          <strong>Formatting Tips:</strong> Use bullet points for findings, separate sections with headers, 
          include differential diagnosis and recommendations. All notes are automatically saved and versioned.
        </div>
      </div>
    </MedicalCard>
  );
};

// Add useState import
import { useState } from 'react';