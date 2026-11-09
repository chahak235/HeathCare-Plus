import React, { useState } from 'react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { MedicalCard } from '../../ui/MedicalCard';
import { User, Calendar, Hash, Info } from 'lucide-react';

interface PatientInfoFormProps {
  onSubmit: (data: PatientInfo) => void;
  className?: string;
}

export interface PatientInfo {
  patientId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  clinicalNotes: string;
  referringPhysician: string;
  examType: string;
}

export const PatientInfoForm: React.FC<PatientInfoFormProps> = ({ onSubmit, className = '' }) => {
  const [formData, setFormData] = useState<PatientInfo>({
    patientId: '',
    name: '',
    age: 40,
    gender: 'male',
    clinicalNotes: '',
    referringPhysician: '',
    examType: 'Chest X-ray',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PatientInfo, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PatientInfo, string>> = {};

    if (!formData.patientId.trim()) {
      newErrors.patientId = 'Patient ID is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Patient name is required';
    }

    if (formData.age < 0 || formData.age > 120) {
      newErrors.age = 'Age must be between 0 and 120';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof PatientInfo, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <MedicalCard
      title="Patient Information"
      subtitle="Required for clinical context and accurate analysis"
      privacyLevel="confidential"
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient ID */}
          <Input
            label="Patient ID"
            placeholder="PT-001"
            value={formData.patientId}
            onChange={(e) => handleChange('patientId', e.target.value)}
            leftIcon={<Hash className="w-4 h-4" />}
            error={errors.patientId}
            required
          />

          {/* Patient Name */}
          <Input
            label="Full Name"
            placeholder="John Smith"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            error={errors.name}
            required
          />

          {/* Age */}
          <Input
            label="Age"
            type="number"
            min="0"
            max="120"
            value={formData.age.toString()}
            onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
            leftIcon={<Calendar className="w-4 h-4" />}
            error={errors.age}
            required
          />

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Gender
            </label>
            <div className="flex space-x-4">
              {(['male', 'female', 'other'] as const).map((gender) => (
                <label key={gender} className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value={gender}
                    checked={formData.gender === gender}
                    onChange={(e) => handleChange('gender', e.target.value as any)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                  />
                  <span className="ml-2 text-neutral-700 dark:text-neutral-300 capitalize">
                    {gender}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Referring Physician */}
          <Input
            label="Referring Physician"
            placeholder="Dr. Sarah Chen"
            value={formData.referringPhysician}
            onChange={(e) => handleChange('referringPhysician', e.target.value)}
          />

          {/* Exam Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Exam Type
            </label>
            <select
              value={formData.examType}
              onChange={(e) => handleChange('examType', e.target.value)}
              className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option>Chest X-ray</option>
              <option>CT Scan</option>
              <option>MRI</option>
              <option>Ultrasound</option>
              <option>Mammogram</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* Clinical Notes */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Clinical Notes & History
          </label>
          <textarea
            value={formData.clinicalNotes}
            onChange={(e) => handleChange('clinicalNotes', e.target.value)}
            placeholder="Enter relevant clinical history, symptoms, and notes..."
            className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px]"
            rows={3}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Include symptoms, prior diagnoses, medications, and relevant history
          </p>
        </div>

        {/* Disclaimer */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Note:</strong> This information is used to provide clinical context for AI analysis. 
              All data is encrypted and handled according to HIPAA compliance standards.
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Continue to Image Upload
          </Button>
        </div>
      </form>
    </MedicalCard>
  );
};