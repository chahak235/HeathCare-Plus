                import React, { useState, useEffect } from 'react';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import MedicalImageUpload from '../components/features/image-upload/MedicalImageUpload';
import AnalysisResults from '../components/features/analysis-results/AnalysisResults';
import { xrayModelService, XRAY_MODEL_INFO } from '../services/xray-model-service';
import { MedicalImage, AnalysisResult, ModelInfo } from '../types/medical-images';


import {
  Camera,
  Brain,
  Shield as WoundIcon,
  Clock,
  Download,
  Share2,
  History,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  Activity,
  Scan as XRayIcon
} from 'lucide-react';


const ImageAnalysis: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<'skin' | 'xray'>('xray');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const availableModels: ModelInfo[] = [XRAY_MODEL_INFO];
  const skinModelReady = false; // Skin condition model is coming soon

  useEffect(() => {
    const initialize = async () => {
      // Start downloading the X-ray model in the background
      xrayModelService.preload();

      // Load previous analyses from localStorage
      const savedHistory = localStorage.getItem('medical_analysis_history');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          setAnalysisHistory(parsed.slice(0, 10)); // Last 10 analyses
        } catch (error) {
          console.error('Error loading analysis history:', error);
        }
      }
    };

    initialize();
  }, []);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setAnalysisResult(null); // Clear previous result
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    if (analysisType === 'skin' && !skinModelReady) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await xrayModelService.analyze(selectedImage);
      setAnalysisResult(result);

      // Save to history
      const newHistory = [result, ...analysisHistory.slice(0, 9)]; // Keep last 10
      setAnalysisHistory(newHistory);
      localStorage.setItem('medical_analysis_history', JSON.stringify(newHistory));

      // Generate downloadable report
      generateReport(result);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      alert("The X-ray model couldn't analyse this image. Check your internet connection for the first load, then try again with a JPG or PNG.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateReport = (result: AnalysisResult) => {
    // Store report data for download
    const reportData = {
      result,
      generatedAt: new Date().toISOString(),
      imageName: selectedImage?.name,
      analysisType,
    };
    localStorage.setItem('last_analysis_report', JSON.stringify(reportData));
  };

  const handleDownloadReport = () => {
    const reportData = localStorage.getItem('last_analysis_report');
    if (!reportData) {
      alert('No report available to download');
      return;
    }

    const data = JSON.parse(reportData);
    const reportContent = `
MEDICAL IMAGE ANALYSIS REPORT
===============================
Generated: ${new Date(data.generatedAt).toLocaleString()}
Image: ${data.imageName}
Analysis Type: ${data.analysisType}
AI Model: ${data.result.aiModel}
Confidence: ${(data.result.confidence * 100).toFixed(1)}%
Severity: ${data.result.severity.toUpperCase()}

FINDINGS:
${data.result.findings.map(f => `• ${f.name} (${(f.confidence * 100).toFixed(1)}%): ${f.description}`).join('\n')}

RECOMMENDATIONS:
${data.result.recommendations.map(r => `• [${r.type.toUpperCase()}] ${r.title}: ${r.description}`).join('\n')}

DISCLAIMER:
This AI analysis is for informational purposes only and is not a substitute for professional medical advice.
Always consult with qualified healthcare professionals for medical diagnosis and treatment.
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!analysisResult) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Medical Image Analysis Result',
          text: `AI analysis of my medical image. Confidence: ${(analysisResult.confidence * 100).toFixed(1)}%`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Sharing cancelled:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      const text = `Medical Image Analysis - Confidence: ${(analysisResult.confidence * 100).toFixed(1)}% - Severity: ${analysisResult.severity}`;
      await navigator.clipboard.writeText(text);
      alert('Analysis summary copied to clipboard!');
    }
  };

  const clearAnalysis = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
  };

  const analysisTypes = [
    {
      id: 'xray',
      name: 'Chest X-ray',
      description: 'Pneumonia screening',
      icon: <XRayIcon className="w-5 h-5" />,
      color: 'from-primary-500 to-primary-600',
      models: availableModels.filter(m => m.specialty.includes('xray')),
    },
    {
      id: 'skin',
      name: 'Skin Conditions',
      description: skinModelReady ? 'Moles, rashes, lesions' : 'Coming soon',
      icon: <ImageIcon className="w-5 h-5" />,
      color: 'from-orange-500 to-red-500',
      models: availableModels.filter(m => m.specialty.includes('skin')),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-950">
      <Container>
        {/* Hero Section */}
        <div className="pt-8 pb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary-600 rounded-2xl">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">
              AI Medical Image Analysis
            </h1>
          </div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
            Screen chest X-rays for pneumonia with our own AI model, right in your browser. Skin condition analysis is coming soon.
          </p>
          
          {/* Status Indicators */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                X-ray model: 88.5% test accuracy
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Not a diagnostic device
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm">
              <WoundIcon className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Runs on your device
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm">
              <Brain className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Medical AI Models
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Upload & Controls */}
          <div className="lg:col-span-2 space-y-8">
            {/* Analysis Type Selection */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                Select Analysis Type
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {analysisTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setAnalysisType(type.id as 'skin' | 'xray');
                      setAnalysisResult(null);
                    }}
                    className={`
                      flex flex-col items-center p-4 rounded-xl border-2 transition-all
                      ${analysisType === type.id
                        ? `border-primary-600 bg-gradient-to-br ${type.color} text-white scale-[1.02]`
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 hover:border-primary-300 dark:hover:border-primary-700'
                      }
                    `}
                  >
                    <div className={`
                      p-3 rounded-lg mb-3
                      ${analysisType === type.id
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-neutral-700'
                      }
                    `}>
                      {type.icon}
                    </div>
                    <span className="font-medium text-sm">{type.name}</span>
                    <span className="text-xs opacity-75 mt-1">{type.description}</span>
                    {type.models.length > 0 && (
                      <span className="text-xs mt-2 opacity-60">
                        {type.models.length} AI model{type.models.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Image Upload */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Upload Medical Image
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {analysisType === 'xray' ? 'Upload a clear front-view chest X-ray (JPG or PNG)' : 'Skin condition analysis is coming soon'}
                  </p>
                </div>
                {selectedImage && (
                  <Button
                    variant="secondary"
                    onClick={clearAnalysis}
                    leftIcon={<XRayIcon className="w-4 h-4" />}
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              <MedicalImageUpload
                onImageSelect={handleImageSelect}
                selectedImage={selectedImage}
                analysisType={analysisType}
              />

              {selectedImage && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || (analysisType === 'skin' && !skinModelReady)}
                    className="w-full py-4 text-lg"
                    leftIcon={isAnalyzing ? <Clock className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                  >
                    {isAnalyzing ? 'Analyzing...' : analysisType === 'xray' ? 'Analyze Chest X-ray' : 'Skin Analysis Coming Soon'}
                  </Button>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-3">
                    {analysisType === 'xray' ? 'Takes a few seconds. The first run downloads the model (about 15 MB).' : 'This model is still being trained.'}
                  </p>
                </div>
              )}
            </Card>

            {/* Results Section */}
            {analysisResult && (
              <Card className="p-6">
                <AnalysisResults
                  result={analysisResult}
                  onDownloadReport={handleDownloadReport}
                  onShare={handleShare}
                  isLoading={isAnalyzing}
                />
              </Card>
            )}
          </div>

          {/* Right Column - Info & History */}
          <div className="space-y-6">
            {/* AI Models Info */}
            <Card className="p-6 bg-gradient-to-b from-primary-50 to-white dark:from-primary-900/20 dark:to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-100 dark:bg-primary-800/30 rounded-lg">
                  <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    AI Models Used
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Open-source medical AI
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {availableModels.slice(0, 3).map((model) => (
                  <div
                    key={model.id}
                    className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{model.name}</span>
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                        {model.accuracy.toFixed(0)}% acc
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                      {model.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-500">
                      <span>Input: {model.inputSize}</span>
                      <span>{model.specialty[0]}</span>
                    </div>
                  </div>
                ))}
                
                {availableModels.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm"
                    onClick={() => {
                      // Show all models modal
                      alert(`${availableModels.length} AI models available for medical image analysis.`);
                    }}
                  >
                    View All {availableModels.length} Models
                  </Button>
                )}
              </div>
            </Card>

            {/* Analysis History */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <History className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    Recent Analyses
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Your previous results
                  </p>
                </div>
              </div>

              {analysisHistory.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {analysisHistory.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setAnalysisResult(item)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">Analysis #{analysisHistory.length - index}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          item.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-500">
                        <span>{item.aiModel}</span>
                        <span>{(item.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-600 mt-2">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No analysis history yet
                  </p>
                  <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
                    Upload and analyze your first image
                  </p>
                </div>
              )}
            </Card>

            {/* Quick Guide */}
            <Card className="p-6 bg-gradient-to-b from-green-50 to-white dark:from-green-900/10 dark:to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-800/30 rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    Quick Guide
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    For best results
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  'Use clear, well-lit images',
                  'Focus on the area of concern',
                  'Remove shadows and glare',
                  'Include scale reference if possible',
                  'Avoid blurry or rotated images',
                ].map((tip, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-neutral-700 dark:text-neutral-300">{tip}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Disclaimer */}
            <Card className="p-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                    Medical Disclaimer
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400/80">
                    This tool provides AI analysis for informational purposes only. 
                    It is not a substitute for professional medical advice, diagnosis, or treatment.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-center text-neutral-900 dark:text-white mb-8">
            Advanced Medical AI Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🔬',
                title: 'Multiple AI Models',
                description: 'Specialized models for different medical image types'
              },
              {
                icon: '⚡',
                title: 'Real-time Analysis',
                description: 'Get results in seconds with AI processing'
              },
              {
                icon: '📊',
                title: 'Confidence Scores',
                description: 'Transparent AI confidence ratings for each finding'
              },
              {
                icon: '📋',
                title: 'Actionable Reports',
                description: 'Downloadable reports with recommendations'
              },
              {
                icon: '🛡️',
                title: 'Privacy Notice',
                description: 'X-rays are analysed in your browser and never uploaded to our servers.'
              },
              {
                icon: '🎯',
                title: 'Not a Diagnosis',
                description: 'A general-purpose AI describes what it sees. It is not a clinically validated medical model.'
              },
              {
                icon: '🤝',
                title: 'Doctor Integration',
                description: 'Easy to share results with healthcare providers'
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 text-center hover-lift transition-all">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ImageAnalysis;