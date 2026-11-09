import axios from 'axios';
import type { AnalysisResult, Finding, Recommendation, ModelInfo } from '../types/medical-images';

// Real backend-proxied AI image analysis (Groq vision model). This used to
// call Hugging Face's public inference API directly with a placeholder
// token ('hf_your_token_here') against generic ImageNet classifiers that
// were never medical models in the first place — every call failed and
// silently fell back to hardcoded mock findings regardless of the image.
// There is no mock fallback here anymore: if the backend can't produce a
// real result, this throws, and the UI shows that honestly instead of
// presenting invented findings as if they were real.
const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

const NOTABILITY_TO_SEVERITY: Record<string, 'low' | 'medium' | 'high'> = {
  routine: 'low',
  'worth-discussing': 'medium',
  'seek-prompt-care': 'high',
};

export class MedicalAIService {
  async analyzeImage(
    imageFile: File,
    analysisType: 'skin' | 'xray' | 'wound' | 'general'
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const imageDataUri = await this.fileToDataUri(imageFile);

    const response = await axios.post(
      `${API_URL}/ai/analyze-image`,
      { image: imageDataUri, analysisType },
      { timeout: 35000 }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Image analysis failed');
    }

    const result = response.data.data as {
      overallImpression: string;
      findings: { name: string; detail: string; notability: string; confidence: number }[];
      recommendations: string[];
      urgent: boolean;
      model: string;
    };

    const findings: Finding[] = result.findings.map((f) => ({
      name: f.name,
      // The model's own self-reported certainty in this specific
      // observation — not a calibrated diagnostic accuracy score, but a
      // real signal from the model rather than an invented number.
      confidence: Math.max(0, Math.min(100, f.confidence || 0)) / 100,
      description: f.detail,
      severity: NOTABILITY_TO_SEVERITY[f.notability] || 'low',
    }));

    const recommendations: Recommendation[] = [
      {
        type: 'standard',
        title: 'AI-Assisted Visual Review — Not a Diagnosis',
        description:
          'This is a general-purpose vision AI, not a clinically validated radiology/dermatology model. Always have a qualified doctor confirm before acting on this.',
      },
      ...result.recommendations.map((r): Recommendation => ({
        type: result.urgent ? 'urgent' : 'follow-up',
        title: result.urgent ? 'Seek prompt medical attention' : 'Suggested next step',
        description: r,
      })),
    ];

    const avgConfidence =
      findings.length > 0 ? findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length : 0;

    return {
      id: `analysis-${Date.now()}`,
      timestamp: new Date().toISOString(),
      aiModel: result.model,
      confidence: avgConfidence,
      severity: result.urgent ? 'high' : findings.some((f) => f.severity === 'medium') ? 'medium' : 'low',
      findings,
      recommendations,
      disclaimer: result.overallImpression,
      imageType: analysisType,
      processingTime: Date.now() - startTime,
    };
  }

  private fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  }

  getAvailableModels(): ModelInfo[] {
    return [
      {
        id: 'groq-vision',
        name: 'Groq Vision (multimodal LLM)',
        description: 'General-purpose AI visual assessment — not a specialized diagnostic model.',
        accuracy: 0,
        inputSize: 'any',
        specialty: ['skin', 'xray', 'wound', 'general'],
        version: '1.0',
      },
    ];
  }

  async checkAPIStatus(): Promise<{ available: boolean; models: string[] }> {
    try {
      const response = await axios.get(`${API_URL}/ai/status`, { timeout: 5000 });
      const available = !!response.data?.available;
      return { available, models: available ? ['groq-vision'] : [] };
    } catch {
      return { available: false, models: [] };
    }
  }
}

// Export singleton instance
export const medicalAIService = new MedicalAIService();
