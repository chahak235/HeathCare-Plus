export interface SymptomInput {
  symptoms: string[];
  duration?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  location?: string;
  radiation?: string;
  aggravatingFactors?: string[];
  relievingFactors?: string[];
  associatedSymptoms?: string[];
}

export interface VitalSigns {
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  temperature?: number;
  painLevel?: number; // 0-10
  consciousness?: 'alert' | 'confused' | 'unresponsive';
}

export interface PatientContext {
  age: number;
  gender: 'male' | 'female' | 'other';
  medicalHistory?: string[];
  medications?: string[];
  allergies?: string[];
  pregnancy?: boolean;
  trauma?: boolean;
}

export interface TriageInput {
  symptoms: SymptomInput;
  vitals: VitalSigns;
  context: PatientContext;
  timestamp: Date;
}

export interface TriageResult {
  priority: 1 | 2 | 3 | 4 | 5 | 6;
  confidence: number; // 0-100
  primaryConcern: string;
  suggestedSpecialty: string;
  suggestedActions: string[];
  recommendedTests?: string[];
  estimatedWaitTime?: number; // in minutes
  reasoning: string;
  redFlags: string[];
  requiresImmediateAction: boolean;
}

export interface TriageRule {
  id: string;
  condition: string;
  priority: 1 | 2 | 3 | 4 | 5 | 6;
  specialty: string;
  action: string;
}

export const TRIAGE_RULES: TriageRule[] = [
  {
    id: 'rule-001',
    condition: 'chest pain AND (shortness of breath OR sweating)',
    priority: 1,
    specialty: 'Cardiology',
    action: 'Immediate ECG, cardiac monitoring'
  },
  {
    id: 'rule-002',
    condition: 'difficulty breathing AND oxygen saturation < 90',
    priority: 1,
    specialty: 'Critical Care',
    action: 'Immediate oxygen, respiratory support'
  },
  {
    id: 'rule-003',
    condition: 'stroke symptoms (facial droop OR arm weakness OR speech difficulty)',
    priority: 1,
    specialty: 'Neurology',
    action: 'Immediate CT scan, stroke protocol'
  },
  {
    id: 'rule-004',
    condition: 'severe bleeding OR trauma',
    priority: 1,
    specialty: 'Emergency Medicine',
    action: 'Immediate hemorrhage control'
  },
  {
    id: 'rule-005',
    condition: 'high fever (>103°F) AND (confusion OR stiff neck)',
    priority: 1,
    specialty: 'Infectious Disease',
    action: 'Immediate sepsis workup'
  },
  {
    id: 'rule-006',
    condition: 'severe headache AND (vision changes OR nausea)',
    priority: 2,
    specialty: 'Neurology',
    action: 'Urgent neurological assessment'
  },
  {
    id: 'rule-007',
    condition: 'abdominal pain AND (vomiting OR fever)',
    priority: 3,
    specialty: 'General Surgery',
    action: 'Surgical consult within 30 min'
  }
];
