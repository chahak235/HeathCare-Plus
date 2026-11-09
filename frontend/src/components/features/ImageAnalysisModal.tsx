import React, { useState, useRef } from 'react';
import axios from 'axios';
import { GlassCard } from '../layout/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import {
  Upload,
  Brain,
  X,
  Camera,
  CheckCircle,
  AlertTriangle,
  Download,
  Shield,
  Image as ImageIcon,
  X as XRayIcon,
  FileText,
  MessageSquare
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

interface RealAnalysisResult {
  overallImpression: string;
  findings: { name: string; detail: string; notability: string; confidence: number }[];
  recommendations: string[];
  urgent: boolean;
  model: string;
}

interface ImageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageAnalysisModal: React.FC<ImageAnalysisModalProps> = ({ isOpen, onClose }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<RealAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedAIType, setSelectedAIType] = useState<'skin' | 'xray' | 'wound' | 'general'>('xray');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await axios.post(
        `${API_URL}/ai/analyze-image`,
        { image: uploadedImage, analysisType: selectedAIType },
        { timeout: 35000 }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Analysis failed');
      }

      setAnalysisResults(response.data.data);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setAnalysisError(
        error?.response?.data?.error ||
          "AI image analysis isn't available right now — please try again in a moment."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setAnalysisResults(null);
    setAnalysisError(null);
  };

  const handleDownloadReport = () => {
    if (!analysisResults) return;

    const report = `
      Medical Image Analysis Report
      =============================
      Analysis Type: ${selectedAIType}
      AI Model: ${analysisResults.model}
      Date: ${new Date().toLocaleString()}

      Overall Impression:
      ${analysisResults.overallImpression}

      Findings:
      ${analysisResults.findings.map((f) => `• ${f.name} (self-reported confidence ${f.confidence}%): ${f.detail}`).join('\n')}

      Recommendations:
      ${analysisResults.recommendations.map((r: string) => `• ${r}`).join('\n')}

      Disclaimer: This is a general-purpose AI visual assessment, not a
      clinically validated diagnostic tool. It is for informational purposes
      only. Always consult a qualified healthcare professional.
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const aiTypes = [
    { id: 'skin' as const, name: 'Skin Conditions', icon: <ImageIcon className="w-5 h-5" />, color: 'from-orange-500 to-red-500' },
    { id: 'xray' as const, name: 'X-ray Analysis', icon: <XRayIcon className="w-5 h-5" />, color: 'from-blue-500 to-indigo-500' },
    { id: 'wound' as const, name: 'Wound Assessment', icon: <FileText className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
    { id: 'general' as const, name: 'General Medical', icon: <Camera className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <GlassCard className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  AI Medical Image Analysis
                </h2>
                <p className="text-gray-300">
                  Try our AI-powered medical image analysis
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1: Select AI Type */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                1. Select Analysis Type
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {aiTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedAIType(type.id)}
                    className={`
                      flex flex-col items-center p-4 rounded-xl border-2 transition-all
                      ${selectedAIType === type.id
                        ? `border-blue-500 bg-gradient-to-br ${type.color} text-white scale-[1.02]`
                        : 'border-white/10 bg-white/5 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="mb-2">{type.icon}</div>
                    <span className="font-medium text-sm">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Upload Image */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                2. Upload Medical Image
              </h3>
              <div
                className={`
                  border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer
                  transition-all duration-300
                  ${uploadedImage
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-white/20 hover:border-blue-400 bg-white/5'
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {uploadedImage ? (
                  <div className="space-y-4">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>Image Ready for Analysis</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                      {isUploading ? (
                        <LoadingSpinner size="lg" />
                      ) : (
                        <Upload className="w-10 h-10 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {isUploading ? 'Uploading...' : 'Click to Upload'}
                      </h4>
                      <p className="text-gray-400">
                        Upload medical image for AI analysis
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Supports: JPG, PNG • Max: 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Analyze Button */}
            {uploadedImage && !analysisResults && (
              <div className="text-center space-y-3">
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  leftIcon={isAnalyzing ? <LoadingSpinner /> : <Brain className="w-5 h-5" />}
                >
                  {isAnalyzing ? 'AI is Analyzing...' : 'Analyze with AI'}
                </Button>
                {analysisError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{analysisError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Results */}
            {analysisResults && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  3. AI Analysis Results
                </h3>

                {/* Overall impression */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Overall Impression</h4>
                    {analysisResults.urgent && (
                      <Badge variant="error">Discuss promptly</Badge>
                    )}
                  </div>
                  <p className="text-gray-300">{analysisResults.overallImpression}</p>
                </GlassCard>

                {/* AI Findings */}
                <GlassCard className="p-6">
                  <h4 className="font-semibold text-white mb-4">AI Findings</h4>
                  {analysisResults.findings.length === 0 ? (
                    <p className="text-sm text-gray-400">No specific findings identified.</p>
                  ) : (
                    <div className="space-y-3">
                      {analysisResults.findings.map((finding, i) => (
                        <div key={i} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-white">{finding.name}</span>
                            <Badge variant={finding.notability === 'seek-prompt-care' ? 'error' : finding.notability === 'worth-discussing' ? 'warning' : 'success'}>
                              {finding.notability.replace('-', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">{finding.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>

                {/* Recommendations */}
                <GlassCard className="p-6">
                  <h4 className="font-semibold text-white mb-4">Recommendations</h4>
                  <ul className="space-y-2">
                    {analysisResults.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </GlassCard>

                {/* Model Info */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Brain className="w-4 h-4" />
                  <span>AI Model: {analysisResults.model} (general-purpose vision AI, not a diagnostic device)</span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="secondary"
                    onClick={handleReset}
                    className="w-full"
                  >
                    Analyze Another
                  </Button>
                  <Button
                    onClick={handleDownloadReport}
                    leftIcon={<Download className="w-4 h-4" />}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    Download Report
                  </Button>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-2">Medical Disclaimer</h4>
                  <p className="text-sm text-yellow-300/80">
                    This AI analysis is for informational purposes only and is not a substitute for professional medical advice. 
                    Always consult with qualified healthcare professionals for medical diagnosis and treatment.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-2">Tips for Best Results</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Use clear, well-lit images</li>
                    <li>• Focus on the area of concern</li>
                    <li>• Remove shadows and glare</li>
                    <li>• Keep file size under 10MB</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};