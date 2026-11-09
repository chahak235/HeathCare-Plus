export interface Finding {
  name: string;
  confidence: number;
  description: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  type: 'urgent' | 'standard' | 'follow-up';
  title: string;
  description: string;
  timeframe?: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  aiModel: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  findings: Finding[];
  recommendations: Recommendation[];
  disclaimer?: string;
  imageUrl?: string;
  imageType?: 'skin' | 'xray' | 'wound' | 'general';
  processingTime?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  inputSize: string;
  specialty: string[];
  version: string;
}

export interface MedicalImage {
  id: string;
  file: File;
  preview: string;
  type: 'skin' | 'xray' | 'wound' | 'general';
  uploadedAt: Date;
  analysis?: AnalysisResult;
}
