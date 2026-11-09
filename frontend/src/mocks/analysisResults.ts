import { AnalysisResult, Pathology } from '../types/medical.types';

export const mockPathologies: Pathology[] = [
  { id: '1', name: 'Atelectasis', confidence: 0.92, severity: 'medium', description: 'Partial or complete collapse of lung', prevalence: 'Common' },
  { id: '2', name: 'Cardiomegaly', confidence: 0.87, severity: 'high', description: 'Enlarged heart', prevalence: 'Common' },
  { id: '3', name: 'Consolidation', confidence: 0.78, severity: 'high', description: 'Lung tissue filled with liquid', prevalence: 'Common' },
  { id: '4', name: 'Edema', confidence: 0.85, severity: 'critical', description: 'Excess fluid in lungs', prevalence: 'Common' },
  { id: '5', name: 'Effusion', confidence: 0.91, severity: 'medium', description: 'Fluid in pleural space', prevalence: 'Very Common' },
  { id: '6', name: 'Emphysema', confidence: 0.67, severity: 'medium', description: 'Alveoli damage', prevalence: 'Common' },
  { id: '7', name: 'Fibrosis', confidence: 0.73, severity: 'low', description: 'Lung tissue scarring', prevalence: 'Less Common' },
  { id: '8', name: 'Hernia', confidence: 0.45, severity: 'low', description: 'Diaphragm hernia', prevalence: 'Rare' },
  { id: '9', name: 'Infiltration', confidence: 0.81, severity: 'medium', description: 'Abnormal substance in lungs', prevalence: 'Common' },
  { id: '10', name: 'Mass', confidence: 0.89, severity: 'critical', description: 'Abnormal growth', prevalence: 'Less Common' },
  { id: '11', name: 'Nodule', confidence: 0.76, severity: 'medium', description: 'Small growth', prevalence: 'Common' },
  { id: '12', name: 'Pleural Thickening', confidence: 0.68, severity: 'low', description: 'Pleural membrane thickening', prevalence: 'Less Common' },
  { id: '13', name: 'Pneumonia', confidence: 0.94, severity: 'high', description: 'Lung infection', prevalence: 'Very Common' },
  { id: '14', name: 'Pneumothorax', confidence: 0.82, severity: 'critical', description: 'Collapsed lung', prevalence: 'Common' },
  { id: '15', name: 'Tuberculosis', confidence: 0.59, severity: 'high', description: 'Bacterial infection', prevalence: 'Less Common' },
];

export const mockAnalysisResults: AnalysisResult[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=600',
    patientId: 'PT-001',
    patientAge: 65,
    patientGender: 'male',
    timestamp: new Date('2024-01-15T10:30:00'),
    findings: mockPathologies.slice(0, 3),
    recommendations: [
      'Follow-up CT scan recommended within 2 weeks',
      'Consult with pulmonology specialist',
      'Monitor oxygen saturation levels'
    ],
    urgency: 'high',
    note: 'Multiple abnormalities detected requiring prompt evaluation.'
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=600',
    patientId: 'PT-002',
    patientAge: 42,
    patientGender: 'female',
    timestamp: new Date('2024-01-14T14:20:00'),
    findings: mockPathologies.slice(3, 5),
    recommendations: [
      'Routine follow-up in 6 months',
      'Continue current treatment plan',
      'Schedule pulmonary function test'
    ],
    urgency: 'medium',
    note: 'Stable findings with minor progression.'
  }
];