import { medicalAIService } from './medical-ai-service'; // We'll create this
import { mockAnalysisResults } from '../mocks/analysisResults';

export interface MedicalImage {
  id: string;
  file: File;
  previewUrl: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  analysisType: 'skin' | 'xray' | 'wound' | 'general' | 'clinical';
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

export interface AIDetection {
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
  severity: 'low' | 'medium' | 'high';
  color: string;
}

export interface AIAnalysisResult {
  id: string;
  imageId: string;
  detections: AIDetection[];
  overallConfidence: number;
  recommendations: {
    type: 'doctor' | 'medication' | 'lifestyle' | 'monitoring' | 'emergency';
    title: string;
    description: string;
    priority: number;
    actionUrl?: string;
  }[];
  processingTime: number;
  aiModel: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export const analysisService = {
  // Your existing functions
  async analyzeImage(imageFile: File, analysisType: string, patientInfo?: any): Promise<any> {
    // Combine your mock results with AI analysis
    const mockResult = mockAnalysisResults;
    
    try {
      // Try AI analysis first
      const aiResult = await medicalAIService.analyzeImage(
        imageFile, 
        analysisType as any
      );
      
      // Merge AI results with your mock results
      return {
        ...mockResult,
        aiAnalysis: aiResult,
        hasAI: true,
        confidence: aiResult.confidence,
        timestamp: new Date(),
      };
    } catch (error) {
      console.log('AI analysis failed, using mock results:', error);
      return {
        ...mockResult,
        hasAI: false,
        confidence: 0.85, // Mock confidence
        timestamp: new Date(),
      };
    }
  },

  // New: Get AI-specific analysis
  async getAIAnalysis(imageFile: File, analysisType: 'skin' | 'xray' | 'wound' | 'general'): Promise<AIAnalysisResult> {
    return medicalAIService.analyzeImage(imageFile, analysisType);
  },

  // New: Get available AI models
  getAvailableModels() {
    return medicalAIService.getAvailableModels();
  },

  // New: Check AI service status
  async checkAIStatus() {
    return medicalAIService.checkAPIStatus();
  },

  // Your existing mock function
  getMockAnalysis() {
    return mockAnalysisResults;
  },

  // Simulate upload progress
  simulateUpload(callback: (progress: number) => void): Promise<void> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        callback(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  },
};