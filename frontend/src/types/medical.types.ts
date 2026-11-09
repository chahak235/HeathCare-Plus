export interface MedicalImage {
    id: string;
    file: File;
    previewUrl: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
    analysisType: 'skin' | 'xray' | 'wound' | 'general';
    status: 'uploading' | 'processing' | 'completed' | 'error';
    analysisResult?: AnalysisResult;
  }
  
  export interface AnalysisResult {
    id: string;
    imageId: string;
    findings: Finding[];
    confidence: number;
    recommendations: Recommendation[];
    severity: 'low' | 'medium' | 'high';
    timestamp: Date;
    aiModel: string;
    processingTime: number;
    metadata: Record<string, any>;
  }
  
  export interface Finding {
    id: string;
    name: string;
    confidence: number;
    description: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    color: string; // For visualization
  }
  
  export interface Recommendation {
    id: string;
    type: 'doctor' | 'medication' | 'lifestyle' | 'monitoring' | 'emergency';
    title: string;
    description: string;
    priority: number;
    actionUrl?: string;
  }
  
  export interface AnalysisHistory {
    id: string;
    userId?: string;
    imageUrl: string;
    thumbnailUrl: string;
    analysisType: string;
    result: AnalysisResult;
    createdAt: Date;
    tags: string[];
  }
  
  export interface ModelInfo {
    id: string;
    name: string;
    description: string;
    accuracy: number;
    specialty: string[];
    inputSize: string;
    supportedFormats: string[];
  }